// Thin PayPal REST client (sandbox by default): Invoicing v2 + webhook verification.
import { randomUUID } from "node:crypto";
import { env } from "@/lib/server/env";

const baseUrl = () => (env().PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com");

export class PayPalError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown,
  ) {
    super(message);
  }
}

export function paypalConfigured() {
  const e = env();
  return Boolean(e.PAYPAL_CLIENT_ID && e.PAYPAL_CLIENT_SECRET);
}

// ---------- Response shapes (only the fields Leash reads) ----------

type TokenResponse = { access_token: string; expires_in: number };
type ErrorResponse = { message?: string; details?: { description?: string }[] };
type CreatedInvoice = { id?: string; href?: string };
type InvoiceResponse = { status: string; detail?: { metadata?: { recipient_view_url?: string } } };
type VerifyResponse = { verification_status: "SUCCESS" | "FAILURE" };

// Cached per Client ID, so swapping keys in .env.local never reuses the old app's token.
let tokenCache: { token: string; expires: number; clientId: string } | null = null;

/** Test helper: drop the cached OAuth token. */
export function resetPayPalTokenForTests() {
  tokenCache = null;
}

async function accessToken(): Promise<string> {
  const { PAYPAL_CLIENT_ID: clientId = "", PAYPAL_CLIENT_SECRET: clientSecret = "" } = env();
  if (tokenCache && tokenCache.clientId === clientId && tokenCache.expires > Date.now() + 60_000) return tokenCache.token;
  if (!paypalConfigured()) throw new PayPalError("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET are not set", 500, null);
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const body = (await res.json()) as TokenResponse;
  if (!res.ok) throw new PayPalError("PayPal auth failed", res.status, body);
  tokenCache = { token: body.access_token, expires: Date.now() + body.expires_in * 1000, clientId };
  return tokenCache.token;
}

async function call<T>(method: string, path: string, body?: unknown, idempotencyKey?: string): Promise<T> {
  const requestId = idempotencyKey ?? randomUUID();
  const send = async () =>
    fetch(`${baseUrl()}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${await accessToken()}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": requestId,
        Prefer: "return=representation",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  let res = await send();
  // A revoked or expired token: drop it and retry once with a fresh one (same request id, so no duplicates).
  if (res.status === 401) {
    tokenCache = null;
    res = await send();
  }
  const text = await res.text();
  const json: unknown = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const err = json as ErrorResponse;
    const detail = err?.details?.[0]?.description ?? err?.message ?? res.statusText;
    throw new PayPalError(`PayPal ${method} ${path} failed: ${detail}`, res.status, json);
  }
  return json as T;
}

const money = (amount: number, currency: string) => ({ currency_code: currency, value: amount.toFixed(2) });

// ---------- Invoicing v2 ----------

export type PayPalInvoiceInput = {
  number: string;
  currency: string;
  clientName: string;
  clientEmail: string;
  note: string;
  dueDate: string;
  items: { name: string; quantity: number; unitPrice: number }[];
  invoicer?: { businessName?: string; email?: string };
};

/** Create the invoice in PayPal (PayPal-side status: DRAFT). */
export async function createPayPalInvoice(i: PayPalInvoiceInput) {
  const [given, ...rest] = i.clientName.trim().split(/\s+/);
  const r = await call<CreatedInvoice>(
    "POST",
    "/v2/invoicing/invoices",
    {
      detail: {
        invoice_number: i.number,
        currency_code: i.currency,
        note: i.note.slice(0, 4000),
        payment_term: { term_type: "DUE_ON_DATE_SPECIFIED", due_date: i.dueDate },
      },
      ...(i.invoicer?.businessName ? { invoicer: { business_name: i.invoicer.businessName } } : {}),
      primary_recipients: [
        {
          billing_info: {
            name: { given_name: given || i.clientName, surname: rest.join(" ") || undefined },
            email_address: i.clientEmail,
          },
        },
      ],
      items: i.items.map((it) => ({
        name: it.name.slice(0, 200),
        quantity: String(it.quantity),
        unit_amount: money(it.unitPrice, i.currency),
        unit_of_measure: "QUANTITY",
      })),
    },
    `invoice-${i.number}`,
  );
  const id = r.id ?? r.href?.split("/").pop();
  if (!id) throw new PayPalError("PayPal did not return an invoice id", 500, r);
  return { id };
}

export async function getPayPalInvoice(id: string) {
  const r = await call<InvoiceResponse>("GET", `/v2/invoicing/invoices/${id}`);
  return { status: r.status, payUrl: r.detail?.metadata?.recipient_view_url };
}

/** Send through PayPal: PayPal emails the client a secure pay link. */
export async function sendPayPalInvoice(id: string, subject?: string, note?: string) {
  await call("POST", `/v2/invoicing/invoices/${id}/send`, {
    send_to_invoicer: true,
    send_to_recipient: true,
    ...(subject ? { subject } : {}),
    ...(note ? { note } : {}),
  });
  return getPayPalInvoice(id);
}

/** PayPal reminder email carrying our approved message. */
export async function remindPayPalInvoice(id: string, subject: string, note: string) {
  await call("POST", `/v2/invoicing/invoices/${id}/remind`, {
    subject: subject.slice(0, 4000),
    note: note.slice(0, 4000),
    send_to_invoicer: false,
    send_to_recipient: true,
  });
}

export async function cancelPayPalInvoice(id: string) {
  await call("POST", `/v2/invoicing/invoices/${id}/cancel`, {
    subject: "Invoice cancelled",
    note: "This invoice has been cancelled.",
    send_to_invoicer: true,
    send_to_recipient: true,
  });
}

// ---------- Webhooks ----------

/** The parts of a PayPal webhook event Leash acts on. */
export type PayPalWebhookEvent = {
  event_type?: string;
  resource?: { id?: string; invoice?: { id?: string } };
};

export async function verifyWebhook(headers: Headers, event: unknown): Promise<boolean> {
  const webhookId = env().PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;
  const r = await call<VerifyResponse>("POST", "/v1/notifications/verify-webhook-signature", {
    auth_algo: headers.get("paypal-auth-algo"),
    cert_url: headers.get("paypal-cert-url"),
    transmission_id: headers.get("paypal-transmission-id"),
    transmission_sig: headers.get("paypal-transmission-sig"),
    transmission_time: headers.get("paypal-transmission-time"),
    webhook_id: webhookId,
    webhook_event: event,
  });
  return r.verification_status === "SUCCESS";
}
