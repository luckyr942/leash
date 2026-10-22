// Invoice lifecycle: draft -> approve (create in PayPal) -> send -> remind -> paid.
// Every step is a deliberate user action and is written to the activity log.
import { randomBytes } from "node:crypto";
import type { Invoice, InvoiceItem, Store, Channel, Client } from "./store";
import { STAGE_LABEL, type Stage } from "./rules";
import {
  paypalConfigured,
  createPayPalInvoice,
  sendPayPalInvoice,
  remindPayPalInvoice,
  cancelPayPalInvoice,
  getPayPalInvoice,
  PayPalError,
} from "./paypal";
import { HttpError } from "./session";
import { sendEmail } from "./connectors/email";
import { sendTelegram } from "./connectors/telegram";

export type InvoiceInput = {
  client: Client;
  description: string;
  items: InvoiceItem[];
  currency: string;
  dueDate: string;
  note: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const round2 = (n: number) => Math.round(n * 100) / 100;
const money = (n: number, c: string) => new Intl.NumberFormat("en-US", { style: "currency", currency: c }).format(n);
const errText = (e: unknown) => (e instanceof PayPalError || e instanceof Error ? e.message : String(e));
const simId = (p: string) => `SIM-${p}-${randomBytes(5).toString("hex").toUpperCase()}`;
const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

export function validate(input: Partial<InvoiceInput>): InvoiceInput {
  const c = (input.client ?? {}) as Partial<Client>;
  const client: Client = {
    name: str(c.name, 120),
    email: str(c.email, 200),
    phone: str(c.phone, 30).replace(/[^\d+]/g, "") || undefined,
    company: str(c.company, 120) || undefined,
    telegramChatId: /^-?\d+$/.test(String(c.telegramChatId ?? "")) ? String(c.telegramChatId) : undefined,
    telegramHandle: str(c.telegramHandle, 60) || undefined,
  };
  if (!client.name) throw new HttpError(400, "Add the client's name.");
  if (client.email && !EMAIL.test(client.email)) throw new HttpError(400, "That client email doesn't look right.");
  const items = (Array.isArray(input.items) ? input.items : [])
    .slice(0, 50)
    .map((i) => ({ name: str(i?.name, 200), quantity: Math.max(0.01, Number(i?.quantity) || 1), unitPrice: round2(Number(i?.unitPrice) || 0) }))
    .filter((i) => i.name && i.unitPrice > 0);
  if (!items.length) throw new HttpError(400, "Add at least one line with a price.");
  const dueDate = str(input.dueDate, 10);
  if (!DATE.test(dueDate)) throw new HttpError(400, "Add a due date.");
  const currency = str(input.currency, 3).toUpperCase() || "USD";
  if (!/^[A-Z]{3}$/.test(currency)) throw new HttpError(400, "Currency should be a 3-letter code like USD.");
  return { client, description: str(input.description, 500), items, currency, dueDate, note: str(input.note, 1000) };
}

const total = (items: InvoiceItem[]) => round2(items.reduce((s, i) => s + i.quantity * i.unitPrice, 0));

export function createDraft(s: Store, input: InvoiceInput, source: "chat" | "manual", inboxId?: string): Invoice {
  const t = new Date().toISOString();
  const box = inboxId ? s.getInbox(inboxId) : undefined;
  if (box?.source === "telegram" && /^-?\d+$/.test(box.handle)) {
    input = { ...input, client: { ...input.client, telegramChatId: box.handle, telegramHandle: box.subject.startsWith("@") ? box.subject : undefined } };
  }
  const inv = s.saveInvoice({
    id: s.newInvoiceId(),
    number: s.nextInvoiceNumber(),
    createdAt: t,
    updatedAt: t,
    status: "DRAFT",
    ...input,
    total: total(input.items),
    source,
    simulated: !paypalConfigured(),
    reminders: [],
  });
  s.log({
    type: "created",
    actor: source === "chat" ? "ai" : "you",
    message: `${source === "chat" ? "AI drafted" : "You drafted"} ${inv.number} for ${inv.client.name} · ${money(inv.total, inv.currency)}${box ? ` from your ${box.source} inbox` : ""}`,
    invoiceId: inv.id,
    invoiceNumber: inv.number,
  });
  if (box) s.upsertInbox({ ...box, invoiceId: inv.id });
  return inv;
}

export function updateDraft(s: Store, id: string, input: InvoiceInput): Invoice {
  const inv = s.getInvoice(id);
  if (!inv) throw new HttpError(404, "No such invoice");
  if (inv.status !== "DRAFT") throw new HttpError(409, "Only drafts can be edited.");
  return s.saveInvoice({ ...inv, ...input, total: total(input.items), updatedAt: new Date().toISOString() });
}

type Ctx = { appUrl: string; subject?: string; message?: string; channel?: Channel; stage?: Stage };

export async function invoiceAction(s: Store, id: string, action: string, ctx: Ctx): Promise<Invoice> {
  const inv = s.getInvoice(id);
  if (!inv) throw new HttpError(404, "No such invoice");
  const save = (patch: Partial<Invoice>) => s.saveInvoice({ ...inv, ...patch, updatedAt: new Date().toISOString() });
  const log = (type: string, actor: "you" | "paypal" | "system", message: string) =>
    s.log({ type, actor, message, invoiceId: inv.id, invoiceNumber: inv.number });
  const live = !inv.simulated && paypalConfigured();
  const profile = s.getProfile();

  try {
    switch (action) {
      // Approval is the gate: only now does anything reach PayPal.
      case "approve": {
        if (inv.status !== "DRAFT") throw new HttpError(409, "Only drafts can be approved.");
        if (!EMAIL.test(inv.client.email)) throw new HttpError(400, "Add the client's email before approving.");
        let paypalInvoiceId = simId("INV2");
        if (live) {
          const input = {
            number: inv.number,
            currency: inv.currency,
            clientName: inv.client.name,
            clientEmail: inv.client.email,
            note: inv.note,
            dueDate: inv.dueDate,
            items: inv.items,
            invoicer: { businessName: profile.business },
          };
          // Workspaces number their own invoices but can share one PayPal account (e.g. a hosted demo),
          // so if PayPal already has this number, add a short unique suffix and try again.
          const r = await createPayPalInvoice(input).catch((e) => {
            if (!(e instanceof PayPalError && /duplicate/i.test(e.message))) throw e;
            return createPayPalInvoice({ ...input, number: `${inv.number}-${randomBytes(2).toString("hex").toUpperCase()}` });
          });
          paypalInvoiceId = r.id;
        }
        const out = save({ status: "APPROVED", approvedAt: new Date().toISOString(), paypalInvoiceId, error: undefined });
        log("approved", "you", `You approved ${inv.number}; created in PayPal${live ? "" : " (simulated)"} as ${paypalInvoiceId}`);
        return out;
      }
      case "send": {
        if (inv.status !== "APPROVED") throw new HttpError(409, "Approve the invoice before sending it.");
        let payUrl: string | undefined;
        let payToken = inv.payToken;
        if (live) {
          const r = await sendPayPalInvoice(inv.paypalInvoiceId!, ctx.subject, ctx.message);
          payUrl = r.payUrl;
        } else {
          payToken = randomBytes(12).toString("base64url");
          payUrl = `${ctx.appUrl}/pay/${inv.id}?t=${payToken}`;
        }
        const out = save({ status: "SENT", sentAt: new Date().toISOString(), payUrl, payToken, error: undefined });
        log("sent", "you", `You sent ${inv.number} to ${inv.client.email} via PayPal${live ? "" : " (simulated)"}`);
        return out;
      }
      // A reminder the person approved by tapping a channel. PayPal sends it for the "paypal" channel;
      // email / WhatsApp / SMS open on the person's own device with the approved text.
      case "remind": {
        if (inv.status !== "SENT") throw new HttpError(409, "Only sent invoices can be reminded.");
        const stage = ctx.stage ?? "FRIENDLY";
        const channel = ctx.channel ?? "copy";
        if (!["paypal", "email", "whatsapp", "sms", "telegram", "copy"].includes(channel)) throw new HttpError(400, "Unknown channel");
        let serverSent = false;
        if (channel === "paypal" && live) {
          await remindPayPalInvoice(inv.paypalInvoiceId!, ctx.subject ?? `Reminder: invoice ${inv.number}`, ctx.message ?? "");
        }
        // Real delivery through your connected accounts (otherwise the device opens the app with the text).
        if (channel === "email" && s.getConnector("email")) {
          if (!EMAIL.test(inv.client.email)) throw new HttpError(400, "This client has no email address.");
          await sendEmail(s, inv.client.email, ctx.subject ?? `Invoice ${inv.number}`, ctx.message ?? "").catch((e) => {
            throw new HttpError(502, e instanceof Error ? e.message : "Email failed");
          });
          serverSent = true;
        }
        if (channel === "telegram") {
          if (!inv.client.telegramChatId) throw new HttpError(400, "This client hasn't messaged your Telegram bot yet.");
          await sendTelegram(s, inv.client.telegramChatId, ctx.message ?? "").catch((e) => {
            throw new HttpError(502, e instanceof Error ? e.message : "Telegram failed");
          });
          serverSent = true;
        }
        const out = save({ reminders: [...inv.reminders, { at: new Date().toISOString(), stage, channel }] });
        const via = {
          paypal: live ? "PayPal email" : "PayPal email (simulated)",
          email: serverSent ? `your connected email (${s.getConnector<{ user: string }>("email")?.user})` : "your email app",
          whatsapp: "WhatsApp",
          sms: "SMS",
          telegram: "your Telegram bot",
          copy: "copied text",
        }[channel];
        log("reminder_sent", "you", `You approved a ${STAGE_LABEL[stage].toLowerCase()} for ${inv.number} · sent via ${via}`);
        return out;
      }
      case "escalate": {
        if (inv.status !== "SENT") throw new HttpError(409, "Only sent invoices can be escalated.");
        const out = save({ escalatedAt: new Date().toISOString() });
        log("escalated", "you", `You took ${inv.number} offline for a direct conversation; automatic suggestions stopped`);
        return out;
      }
      case "mark_paid": {
        if (inv.status !== "SENT") throw new HttpError(409, "Only sent invoices can be marked paid.");
        const out = save({ status: "PAID", paidAt: new Date().toISOString() });
        log("paid", "you", `You marked ${inv.number} as paid (${money(inv.total, inv.currency)})`);
        return out;
      }
      case "cancel": {
        if (inv.status === "PAID" || inv.status === "CANCELLED") throw new HttpError(409, `Invoice is already ${inv.status.toLowerCase()}.`);
        if (live && inv.paypalInvoiceId && inv.status === "SENT") await cancelPayPalInvoice(inv.paypalInvoiceId);
        const out = save({ status: "CANCELLED" });
        log("cancelled", "you", `You cancelled ${inv.number}`);
        return out;
      }
      case "sync": {
        if (!live || !inv.paypalInvoiceId) return inv;
        const r = await getPayPalInvoice(inv.paypalInvoiceId);
        const paid = r.status === "PAID" || r.status === "MARKED_AS_PAID";
        if (paid && inv.status !== "PAID") {
          const out = save({ status: "PAID", paidAt: new Date().toISOString(), payUrl: r.payUrl ?? inv.payUrl });
          log("paid", "paypal", `PayPal: ${inv.number} paid · ${money(inv.total, inv.currency)}`);
          return out;
        }
        return save({ payUrl: r.payUrl ?? inv.payUrl });
      }
      default:
        throw new HttpError(400, "Unknown action");
    }
  } catch (e) {
    if (e instanceof HttpError) throw e;
    save({ error: errText(e) });
    throw new HttpError(502, `PayPal: ${errText(e)}`);
  }
}

/** Client paid on the simulated pay page (demo mode only). */
export function simulatedClientPayment(s: Store, inv: Invoice): Invoice {
  if (inv.status !== "SENT") return inv;
  const out = s.saveInvoice({ ...inv, status: "PAID", paidAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  s.log({ type: "paid", actor: "paypal", message: `PayPal (simulated): ${inv.client.name} paid ${inv.number} · ${money(inv.total, inv.currency)}`, invoiceId: inv.id, invoiceNumber: inv.number });
  return out;
}
