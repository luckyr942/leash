import { verifyWebhook, type PayPalWebhookEvent } from "@/lib/integrations/paypal/client";
import { log } from "@/lib/server/logger";
import { findInvoiceByPayPalId, store } from "@/lib/server/db";

// PayPal tells us when an invoice is paid or cancelled, even if the client pays days later.
// No session here: authenticity comes from PayPal's signature, verified with PayPal's API.
export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.length > 200_000) return Response.json({ error: "Too large" }, { status: 413 });
  let event: PayPalWebhookEvent;
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const ok = await verifyWebhook(req.headers, event).catch(() => false);
  if (!ok) {
    log.warn("PayPal webhook rejected: signature not verified", { type: event.event_type });
    return Response.json({ error: "Signature verification failed" }, { status: 400 });
  }

  const type = String(event.event_type ?? "");
  const resource = event.resource ?? {};
  const invId = resource.invoice?.id ?? resource.id;
  const hit = invId ? findInvoiceByPayPalId(invId) : undefined;
  if (hit && type.startsWith("INVOICING.INVOICE.")) {
    const s = store(hit.workspaceId);
    const inv = hit.invoice;
    const t = new Date().toISOString();
    const ref = { invoiceId: inv.id, invoiceNumber: inv.number };
    if (type === "INVOICING.INVOICE.PAID" && inv.status !== "PAID") {
      s.saveInvoice({ ...inv, status: "PAID", paidAt: t, updatedAt: t });
      s.log({ ...ref, type: "paid", actor: "paypal", message: `PayPal: ${inv.client.name} paid ${inv.number}` });
    } else if (type === "INVOICING.INVOICE.CANCELLED" && inv.status !== "CANCELLED") {
      s.saveInvoice({ ...inv, status: "CANCELLED", updatedAt: t });
      s.log({ ...ref, type: "cancelled", actor: "paypal", message: `PayPal: ${inv.number} was cancelled` });
    } else if (type === "INVOICING.INVOICE.REFUNDED") {
      s.log({ ...ref, type: "status", actor: "paypal", message: `PayPal: ${inv.number} was refunded` });
    }
  }
  log.info("PayPal webhook processed", { type, invoiceId: invId, matched: Boolean(hit) });
  return Response.json({ received: true });
}
