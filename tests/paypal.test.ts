import "./helpers/isolated-env";
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { resetEnvForTests } from "@/lib/server/env";
import { createPayPalInvoice, getPayPalInvoice, PayPalError, resetPayPalTokenForTests, verifyWebhook } from "@/lib/integrations/paypal/client";
import { createDraft, invoiceAction, validate } from "@/lib/services/invoices";
import { draftInput, emptyWorkspace, json, mockFetch } from "./helpers/fixtures";

// Live mode against a scripted fake of the PayPal sandbox API.
Object.assign(process.env, { PAYPAL_CLIENT_ID: "test-client", PAYPAL_CLIENT_SECRET: "test-secret", PAYPAL_ENV: "sandbox" });
resetEnvForTests();

const SANDBOX = "https://api-m.sandbox.paypal.com";
const token = (n = 1) => json(200, { access_token: `tok-${n}`, expires_in: 32400 });
const input = {
  number: "LSH-2026-0001",
  currency: "USD",
  clientName: "Ada Lovelace",
  clientEmail: "ada@example.com",
  note: "Thanks",
  dueDate: "2026-12-01",
  items: [{ name: "Logo", quantity: 2, unitPrice: 12.5 }],
};

beforeEach(() => resetPayPalTokenForTests());

test("create invoice: OAuth, idempotency key, money formatting, id from href", async () => {
  const calls = mockFetch((c) => (c.url.endsWith("/oauth2/token") ? token() : json(201, { href: `${SANDBOX}/v2/invoicing/invoices/INV2-AAAA` })));
  const r = await createPayPalInvoice(input);
  assert.equal(r.id, "INV2-AAAA");

  assert.equal(calls[0].url, `${SANDBOX}/v1/oauth2/token`);
  assert.equal(calls[0].headers.authorization, `Basic ${Buffer.from("test-client:test-secret").toString("base64")}`);

  const create = calls[1];
  assert.equal(create.headers.authorization, "Bearer tok-1");
  assert.equal(create.headers["paypal-request-id"], "invoice-LSH-2026-0001", "retries can't create duplicates");
  const body = create.body as {
    detail: { invoice_number: string };
    items: { unit_amount: { value: string }; quantity: string }[];
    primary_recipients: { billing_info: { name: { given_name: string; surname: string } } }[];
  };
  assert.equal(body.detail.invoice_number, "LSH-2026-0001");
  assert.deepEqual(body.items[0].unit_amount, { currency_code: "USD", value: "12.50" });
  assert.equal(body.items[0].quantity, "2");
  assert.deepEqual(body.primary_recipients[0].billing_info.name, { given_name: "Ada", surname: "Lovelace" });
});

test("the access token is cached between calls", async () => {
  const calls = mockFetch((c) => (c.url.endsWith("/oauth2/token") ? token() : json(200, { status: "SENT" })));
  await getPayPalInvoice("INV2-1");
  await getPayPalInvoice("INV2-2");
  assert.equal(calls.filter((c) => c.url.endsWith("/oauth2/token")).length, 1);
});

test("a 401 drops the cached token and retries once with the same request id", async () => {
  let tokens = 0;
  let gets = 0;
  const calls = mockFetch((c) => {
    if (c.url.endsWith("/oauth2/token")) return token(++tokens);
    return ++gets === 1
      ? json(401, { message: "expired" })
      : json(200, { status: "PAID", detail: { metadata: { recipient_view_url: "https://pay.example/x" } } });
  });
  const r = await getPayPalInvoice("INV2-1");
  assert.deepEqual(r, { status: "PAID", payUrl: "https://pay.example/x" });
  const apiCalls = calls.filter((c) => !c.url.endsWith("/oauth2/token"));
  assert.equal(apiCalls.length, 2);
  assert.equal(apiCalls[1].headers.authorization, "Bearer tok-2");
  assert.equal(apiCalls[0].headers["paypal-request-id"], apiCalls[1].headers["paypal-request-id"]);
});

test("PayPal error details are surfaced in the message", async () => {
  mockFetch((c) => (c.url.endsWith("/oauth2/token") ? token() : json(422, { details: [{ description: "Currency is not supported" }] })));
  await assert.rejects(createPayPalInvoice(input), (e: unknown) => e instanceof PayPalError && e.status === 422 && /Currency is not supported/.test(e.message));
});

test("webhooks are rejected when no webhook id is configured (no network call)", async () => {
  const calls = mockFetch(() => json(200, {}));
  assert.equal(await verifyWebhook(new Headers(), { event_type: "INVOICING.INVOICE.PAID" }), false);
  assert.equal(calls.length, 0);
});

test("approve: a duplicate invoice number is retried once with a unique suffix", async () => {
  const s = emptyWorkspace();
  const draft = createDraft(s, validate(draftInput()), "manual");
  assert.equal(draft.simulated, false, "PayPal keys are set, so this is a live invoice");
  let creates = 0;
  const calls = mockFetch((c) => {
    if (c.url.endsWith("/oauth2/token")) return token();
    return ++creates === 1 ? json(422, { details: [{ description: "Invoice number is duplicate" }] }) : json(201, { id: "INV2-BBBB" });
  });
  const approved = await invoiceAction(s, draft.id, "approve", { appUrl: "http://localhost:3000" });
  assert.equal(approved.status, "APPROVED");
  assert.equal(approved.paypalInvoiceId, "INV2-BBBB");
  const numbers = calls
    .filter((c) => c.url.endsWith("/v2/invoicing/invoices"))
    .map((c) => (c.body as { detail: { invoice_number: string } }).detail.invoice_number);
  assert.equal(numbers[0], draft.number);
  assert.match(numbers[1], new RegExp(`^${draft.number}-[0-9A-F]{4}$`));
});

test("sync: marks the invoice paid when PayPal says PAID", async () => {
  const s = emptyWorkspace();
  const { id } = createDraft(s, validate(draftInput()), "manual");
  let paidNow = false;
  mockFetch((c) => {
    if (c.url.endsWith("/oauth2/token")) return token();
    if (c.url.endsWith("/v2/invoicing/invoices")) return json(201, { id: "INV2-CCCC" });
    if (c.url.endsWith("/send")) return json(202, {});
    return json(200, { status: paidNow ? "PAID" : "SENT", detail: { metadata: { recipient_view_url: "https://pay.example/c" } } });
  });
  await invoiceAction(s, id, "approve", { appUrl: "" });
  const sent = await invoiceAction(s, id, "send", { appUrl: "" });
  assert.equal(sent.payUrl, "https://pay.example/c");
  paidNow = true;
  const synced = await invoiceAction(s, id, "sync", { appUrl: "" });
  assert.equal(synced.status, "PAID");
  assert.ok(s.activity().some((a) => a.type === "paid" && a.actor === "paypal"));
});

test("a PayPal failure is saved on the invoice and returned as a 502", async () => {
  const s = emptyWorkspace();
  const { id } = createDraft(s, validate(draftInput()), "manual");
  mockFetch((c) => (c.url.endsWith("/oauth2/token") ? token() : json(500, { message: "Internal error" })));
  await assert.rejects(invoiceAction(s, id, "approve", { appUrl: "" }), /PayPal: .*Internal error/);
  assert.match(s.getInvoice(id)!.error!, /Internal error/);
  assert.equal(s.getInvoice(id)!.status, "DRAFT", "nothing changes when PayPal fails");
});
