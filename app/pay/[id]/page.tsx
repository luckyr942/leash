import { timingSafeEqual } from "node:crypto";
import { findInvoiceById, store } from "@/lib/store";
import { money2, day } from "@/lib/format";
import PayButton from "./PayButton";
import { LogoMark } from "@/components/Logo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pay invoice · Leash (sandbox)", robots: { index: false } };

// What the client sees in demo mode (live invoices open PayPal's own invoice page instead).
export default async function PayPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string }> }) {
  const { id } = await params;
  const { t } = await searchParams;
  const hit = /^[a-f0-9]{8}$/.test(id) ? findInvoiceById(id) : undefined;
  const tok = hit?.invoice.payToken;
  const valid = tok && t && t.length === tok.length && timingSafeEqual(Buffer.from(t), Buffer.from(tok));
  if (!hit || !valid) {
    return (
      <main className="pay-page">
        <div className="pay-card">
          <h1>Link not valid</h1>
          <p className="muted">This payment link is invalid or has expired. Ask the sender for a new one.</p>
        </div>
      </main>
    );
  }
  const inv = hit.invoice;
  const profile = store(hit.workspaceId).getProfile();
  return (
    <main className="pay-page">
      <div className="pay-card">
        <div className="pay-brand">
          <LogoMark size={26} />
          <div className="sandbox">Sandbox demo · no real money moves</div>
        </div>
        <span className="muted sm-text">Invoice from</span>
        <h1>{profile.business || profile.yourName}</h1>
        <div className="pay-amt">{money2(inv.total, inv.currency)}</div>
        <p className="muted">
          <span className="num">{inv.number}</span> · due {day(inv.dueDate)}
        </p>
        <ul className="pay-items">
          {inv.items.map((it, i) => (
            <li key={i}>
              <span>{it.name}</span>
              <b>{money2(it.quantity * it.unitPrice, inv.currency)}</b>
            </li>
          ))}
        </ul>
        {inv.status === "PAID" ? <div className="paid-box">Paid · thank you!</div> : inv.status === "SENT" ? <PayButton id={inv.id} token={t!} /> : <div className="paid-box muted">This invoice is {inv.status.toLowerCase()}.</div>}
      </div>
    </main>
  );
}
