import type { Invoice, Profile } from "@/lib/domain/models";
import { day, money2 } from "@/lib/domain/format";
import PayQR from "./PayQR";

/** Printable invoice document (what the client sees, matching the PayPal invoice). */
export default function InvoiceDoc({ inv, profile }: { inv: Invoice; profile: Profile }) {
  const sub = inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  return (
    <article className="doc">
      <header className="doc-top">
        <div>
          <div className="doc-from">{profile.business || profile.yourName || "Your business"}</div>
          <div className="muted sm-text">{[profile.yourName, profile.email].filter(Boolean).join(" · ")}</div>
        </div>
        <div className="doc-title">
          <span>Invoice</span>
          <b>{inv.number}</b>
        </div>
      </header>
      <div className="doc-meta">
        <div>
          <span>Billed to</span>
          <b>{inv.client.name}</b>
          {inv.client.company && <em>{inv.client.company}</em>}
          <em>{inv.client.email || "No email yet"}</em>
        </div>
        <div>
          <span>Issued</span>
          <b>{day(inv.sentAt ?? inv.createdAt)}</b>
        </div>
        <div>
          <span>Due</span>
          <b>{day(inv.dueDate)}</b>
        </div>
        <div>
          <span>Amount due</span>
          <b className="doc-amt">{money2(inv.status === "PAID" ? 0 : inv.total, inv.currency)}</b>
        </div>
      </div>
      <table className="doc-items">
        <thead>
          <tr>
            <th>Description</th>
            <th className="r">Qty</th>
            <th className="r">Rate</th>
            <th className="r">Amount</th>
          </tr>
        </thead>
        <tbody>
          {inv.items.map((it, i) => (
            <tr key={i}>
              <td>{it.name}</td>
              <td className="r">{it.quantity}</td>
              <td className="r">{money2(it.unitPrice, inv.currency)}</td>
              <td className="r">{money2(it.quantity * it.unitPrice, inv.currency)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="r">
              Subtotal
            </td>
            <td className="r">{money2(sub, inv.currency)}</td>
          </tr>
          <tr className="grand">
            <td colSpan={3} className="r">
              Total ({inv.currency})
            </td>
            <td className="r">{money2(inv.total, inv.currency)}</td>
          </tr>
        </tfoot>
      </table>
      {inv.note && <p className="doc-note">{inv.note}</p>}
      <footer className="doc-foot">
        {inv.status === "PAID" ? (
          <span className="paid-stamp">PAID</span>
        ) : inv.payUrl && inv.status === "SENT" ? (
          <span className="doc-pay">
            <PayQR url={inv.payUrl} size={84} label="Scan to pay" />
            <span>Pay securely with PayPal or card: scan the code or use the link in your email.</span>
          </span>
        ) : (
          <span>Pay securely with PayPal or card.</span>
        )}
        {inv.paypalInvoiceId && <span className="mono">PayPal {inv.paypalInvoiceId}</span>}
      </footer>
    </article>
  );
}
