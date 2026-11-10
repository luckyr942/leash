"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/layout/AppProvider";
import FollowUp from "@/components/invoice/FollowUp";
import InvoiceDoc from "@/components/invoice/InvoiceDoc";
import PayQR from "@/components/invoice/PayQR";
import { StatusPill, Avatar } from "@/components/ui/Primitives";
import { ArrowLeft, Check, Printer, Mail, Phone, WhatsApp, Copy, Link as LinkIcon, Close } from "@/components/ui/Icons";
import { displayStatus, money2, ago, day, channelLink } from "@/lib/domain/format";

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const { state, call, toast, refresh } = useApp();
  const [busy, setBusy] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  if (!state) return null;
  const inv = state.invoices.find((i) => i.id === id);
  if (!inv)
    return (
      <div className="card">
        <p>That invoice isn&apos;t in this workspace.</p>
        <Link href="/invoices" className="link">
          Back to invoices
        </Link>
      </div>
    );
  const events = state.activity.filter((a) => a.invoiceId === inv.id);
  const status = displayStatus(inv);
  const live = !inv.simulated && state.config.paypal;
  const phone = inv.client.phone?.replace(/[^\d]/g, "");

  async function act(action: string, msg: string, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(action);
    const r = await call(`/api/invoices/${inv!.id}`, { action });
    setBusy(null);
    if (r.ok) {
      toast(msg);
      refresh();
    }
  }

  async function addEmail() {
    const { items, client, description, currency, dueDate, note } = inv!;
    setBusy("email");
    const r = await call(`/api/invoices/${inv!.id}`, { invoice: { items, client: { ...client, email }, description, currency, dueDate, note } }, "PUT");
    setBusy(null);
    if (r.ok) {
      toast("Email added.");
      refresh();
    }
  }

  const shareText = `Hi ${inv.client.name.split(" ")[0]}, here's invoice ${inv.number} for ${money2(inv.total, inv.currency)}: ${inv.payUrl}`;

  return (
    <>
      <div className="detail-head no-print">
        <Link href="/invoices" className="back">
          <ArrowLeft size={15} /> Invoices
        </Link>
        <div className="detail-title">
          <Avatar name={inv.client.name} size={44} />
          <div>
            <h1>
              {inv.client.name} <StatusPill status={status} />
            </h1>
            <p className="muted">
              <span className="num">{inv.number}</span> · <span className="amount">{money2(inv.total, inv.currency)}</span> · due {day(inv.dueDate)}
              {inv.simulated ? " · simulated" : ""}
            </p>
          </div>
        </div>
        <div className="head-actions">
          {inv.status === "DRAFT" && (
            <button
              className="btn primary"
              disabled={!!busy || !inv.client.email}
              onClick={() => act("approve", `Approved. ${inv.number} was created in PayPal${live ? "" : " (simulated)"}.`)}
            >
              <Check size={15} /> {busy === "approve" ? "Approving…" : "Approve & create in PayPal"}
            </button>
          )}
          {inv.status === "SENT" && (
            <>
              {live && (
                <button className="btn ghost" disabled={!!busy} onClick={() => act("sync", "Status refreshed from PayPal.")}>
                  Refresh status
                </button>
              )}
              <button
                className="btn ghost"
                disabled={!!busy}
                onClick={() => act("mark_paid", "Marked as paid.", "Mark this invoice as paid? Use this when the client paid outside PayPal.")}
              >
                <Check size={15} /> Mark paid
              </button>
            </>
          )}
          {(inv.status === "DRAFT" || inv.status === "APPROVED" || inv.status === "SENT") && (
            <button
              className="btn ghost danger"
              disabled={!!busy}
              onClick={() => act("cancel", "Invoice cancelled.", `Cancel ${inv.number}?${inv.status === "SENT" ? " PayPal will notify the client." : ""}`)}
            >
              <Close size={14} /> Cancel
            </button>
          )}
          <button className="btn ghost" onClick={() => window.print()}>
            <Printer size={15} /> Print
          </button>
        </div>
      </div>
      {inv.error && <div className="warn-box no-print">Last PayPal error: {inv.error}</div>}

      <div className="detail-grid">
        <div className="doc-col">
          <InvoiceDoc inv={inv} profile={state.profile} />
        </div>

        <aside className="side-col no-print">
          <section className="card">
            <div className="card-head">
              <h2>Next step</h2>
            </div>
            {inv.status === "DRAFT" && !inv.client.email ? (
              <div className="fu">
                <p className="fu-why">Add the client&apos;s email so PayPal can deliver the invoice.</p>
                <div className="inline-form">
                  <input
                    className="input"
                    type="email"
                    placeholder="client@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-label="Client email"
                  />
                  <button className="btn" disabled={!email || busy === "email"} onClick={addEmail}>
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <FollowUp inv={inv} />
            )}
          </section>

          {inv.payUrl && inv.status === "SENT" && (
            <section className="card">
              <div className="card-head">
                <h2>Pay link</h2>
                <a className="link" href={inv.payUrl} target="_blank" rel="noopener noreferrer">
                  Open <LinkIcon size={13} />
                </a>
              </div>
              <div className="paylink-row">
                <PayQR url={inv.payUrl} size={112} />
                <div className="paylink">
                  <code>{inv.payUrl}</code>
                  <span className="muted sm-text">Show this QR on a call or print it on the invoice. Any phone camera opens the PayPal checkout.</span>
                </div>
              </div>
              <div className="channels">
                <button
                  className="btn sm"
                  onClick={() => {
                    navigator.clipboard.writeText(inv.payUrl!);
                    toast("Pay link copied.");
                  }}
                >
                  <Copy size={14} /> Copy
                </button>
                <a className="btn sm" href={channelLink("whatsapp", inv.client, "", shareText) ?? "#"} target="_blank" rel="noopener noreferrer">
                  <WhatsApp size={14} /> WhatsApp
                </a>
                <a className="btn sm" href={channelLink("email", inv.client, `Invoice ${inv.number}`, shareText) ?? "#"}>
                  <Mail size={14} /> Email
                </a>
              </div>
            </section>
          )}

          <section className="card">
            <div className="card-head">
              <h2>Client</h2>
            </div>
            <div className="client-card">
              <b>{inv.client.name}</b>
              {inv.client.company && <span className="muted">{inv.client.company}</span>}
              <div className="contact">
                {inv.client.email && (
                  <a href={`mailto:${inv.client.email}`} className="contact-row">
                    <Mail size={15} /> {inv.client.email}
                  </a>
                )}
                {phone && (
                  <>
                    <a href={`tel:+${phone}`} className="contact-row">
                      <Phone size={15} /> +{phone}
                    </a>
                    <a href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer" className="contact-row">
                      <WhatsApp size={15} /> Open WhatsApp chat
                    </a>
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Timeline</h2>
            </div>
            <ul className="timeline">
              {events.map((e) => (
                <li key={e.id} className={`t-${e.actor}`}>
                  <i />
                  <div>
                    <p>{e.message}</p>
                    <span className="muted sm-text">
                      {e.actor === "ai" ? "AI" : e.actor === "paypal" ? "PayPal" : "You"} · {ago(e.at)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}
