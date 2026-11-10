import { timingSafeEqual } from "node:crypto";
import { findInvoiceById, store } from "@/lib/server/db";
import { simulatedClientPayment } from "@/lib/services/invoices";

// Demo mode only: the client-side "pay" page posts here. Live invoices are paid on PayPal's own page.
type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const { t } = (await req.json().catch(() => ({}))) as { t?: string };
  const hit = /^[a-f0-9]{8}$/.test(id) ? findInvoiceById(id) : undefined;
  const token = hit?.invoice.payToken;
  const valid = token && typeof t === "string" && t.length === token.length && timingSafeEqual(Buffer.from(t), Buffer.from(token));
  if (!hit || !valid || !hit.invoice.simulated) return Response.json({ error: "Invalid payment link" }, { status: 404 });
  const inv = simulatedClientPayment(store(hit.workspaceId), hit.invoice);
  return Response.json({ status: inv.status });
}
