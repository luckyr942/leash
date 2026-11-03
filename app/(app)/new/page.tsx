"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { PageHead } from "@/components/UI";
import { Sparkle, Alert, Close, Plus, Check } from "@/components/Icons";
import { money2 } from "@/lib/format";
import type { InvoiceItem } from "@/lib/store";
import { CURRENCIES } from "@/lib/fx";

type Form = {
  client: { name: string; email: string; phone: string; company: string };
  description: string;
  items: InvoiceItem[];
  currency: string;
  dueDate: string;
  note: string;
};

const EXAMPLES = [
  {
    label: "WhatsApp: landing page",
    text: "Sarah: Hi! I need a website landing page for our launch. Budget is $500.\nMe: Happy to help. When do you need it?\nSarah: Please deliver by November 10. Payment due after delivery.\nSarah: My email is sarah@brightlabs.example, phone +1 555 0199",
  },
  {
    label: "Email: app redesign",
    text: "From: Tom Hale <tom@hale.example>\nSubject: App redesign\n\nHi, following our call, we'd like to go ahead with the app redesign. The quote of €2.5k works for us. Please invoice on 1 Dec, net 30.\n\nThanks,\nTom",
  },
  { label: "Missing details", text: "Can you design a logo for our coffee shop? We can talk price later. – Jess" },
];

const plusDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

export default function NewInvoice() {
  const { state, call, toast, refresh } = useApp();
  const router = useRouter();
  const [chat, setChat] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [by, setBy] = useState<"ai" | "demo" | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [inboxId, setInboxId] = useState<string | null>(null);
  const imported = useRef(false);

  // Arriving from the Inbox: load that conversation and extract straight away.
  useEffect(() => {
    if (!state || imported.current) return;
    imported.current = true;
    try {
      const raw = sessionStorage.getItem("leash-import");
      if (!raw) return;
      sessionStorage.removeItem("leash-import");
      const imp = JSON.parse(raw) as { text: string; inboxId: string; source: string; handle: string };
      setChat(imp.text);
      setInboxId(imp.inboxId);
      extract(imp.text, imp);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  if (!state) return null;
  const cur = state.profile.currency;

  const blank = (): Form => ({
    client: { name: "", email: "", phone: "", company: "" },
    description: "",
    items: [{ name: "", quantity: 1, unitPrice: 0 }],
    currency: cur,
    dueDate: plusDays(state.profile.defaultDueDays),
    note: "Thank you for your business!",
  });

  async function extract(text = chat, imp?: { source: string; handle: string }) {
    setBusy("extract");
    const r = await call("/api/extract", { conversation: text });
    setBusy(null);
    if (!r.ok) return;
    const e = r.body.extracted;
    setForm({
      client: {
        name: e.clientName,
        email: e.clientEmail || (imp?.source === "email" ? imp.handle : ""),
        phone: e.clientPhone || (imp?.source === "whatsapp" ? imp.handle : ""),
        company: e.clientCompany,
      },
      description: e.description,
      items: e.items.length ? e.items : [{ name: e.description.replace(/\.$/, "") || "", quantity: 1, unitPrice: 0 }],
      currency: e.currency || cur,
      dueDate: e.dueDate || "",
      note: "Thank you for your business!",
    });
    setMissing(e.missing);
    setNotes(e.notes);
    setBy(e.extractedBy);
  }

  const f = form;
  const total = f ? f.items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0) : 0;
  const set = (patch: Partial<Form>) => f && setForm({ ...f, ...patch });
  const setClient = (patch: Partial<Form["client"]>) => f && setForm({ ...f, client: { ...f.client, ...patch } });
  const setItem = (i: number, patch: Partial<InvoiceItem>) => f && set({ items: f.items.map((it, k) => (k === i ? { ...it, ...patch } : it)) });
  const isMissing = (label: string) => missing.includes(label);

  async function save(approve: boolean) {
    if (!f) return;
    setBusy(approve ? "approve" : "save");
    const r = await call("/api/invoices", { invoice: f, source: by ? "chat" : "manual", inboxId });
    if (!r.ok) return setBusy(null);
    const id = r.body.invoice.id;
    if (approve) {
      const a = await call(`/api/invoices/${id}`, { action: "approve" });
      if (a.ok) toast(`Approved and created in PayPal${a.body.invoice.simulated ? " (simulated)" : ""}. Next: send it.`);
    } else toast("Saved as a draft. Nothing has gone to PayPal.");
    await refresh();
    setBusy(null);
    router.push(`/invoices/${id}`);
  }

  return (
    <>
      <PageHead title="New invoice" sub="Paste your conversation with the client. AI pulls out the details; you check them and approve." />

      <div className="grid-new">
        <section className="card">
          <div className="card-head">
            <h2>1 · Client conversation</h2>
          </div>
          <textarea
            className="input chat"
            rows={11}
            value={chat}
            onChange={(e) => setChat(e.target.value)}
            placeholder={"Paste a WhatsApp chat, email thread or DM…\n\ne.g. \"I need a website landing page. Budget is $500. Please deliver by November 10. Payment due after delivery.\""}
            aria-label="Client conversation"
          />
          <div className="examples">
            <span className="muted sm-text">Try:</span>
            {EXAMPLES.map((x) => (
              <button key={x.label} className="chip" onClick={() => setChat(x.text)}>
                {x.label}
              </button>
            ))}
          </div>
          <div className="actions-row">
            <button className="btn ghost" onClick={() => { setForm(blank()); setMissing([]); setBy(null); setNotes(""); }}>
              Start blank
            </button>
            <button className="btn primary" disabled={busy === "extract" || chat.trim().length < 10} onClick={() => extract()}>
              <Sparkle size={15} /> {busy === "extract" ? "Reading…" : "Extract invoice"}
            </button>
          </div>
          <p className="muted sm-text" style={{ marginTop: 12 }}>
            The conversation is only used to fill this form. AI never sends anything: invoices go to PayPal only after you approve.
          </p>
        </section>

        <section className={`card ${f ? "" : "dim"}`}>
          <div className="card-head">
            <h2>2 · Review</h2>
            {by && (
              <span className="pill a-friendly">
                <Sparkle size={12} /> {by === "ai" ? "Extracted by Gemini" : "Extracted (demo parser)"}
              </span>
            )}
          </div>
          {!f ? (
            <p className="muted">Extract from a conversation or start blank to fill the invoice here.</p>
          ) : (
            <>
              {missing.length > 0 && (
                <div className="warn-box">
                  <Alert size={15} /> <b>Missing:</b> {missing.join(", ")}. Fill these in before approving.
                </div>
              )}
              {notes && <p className="muted sm-text note-line">{notes}</p>}
              <div className="form-grid">
                <label className={isMissing("Client name") && !f.client.name ? "need" : ""}>
                  Client name
                  <input className="input" value={f.client.name} onChange={(e) => setClient({ name: e.target.value })} />
                </label>
                <label>
                  Company
                  <input className="input" value={f.client.company} onChange={(e) => setClient({ company: e.target.value })} placeholder="Optional" />
                </label>
                <label className={isMissing("Client email") && !f.client.email ? "need" : ""}>
                  Email
                  <input className="input" type="email" value={f.client.email} onChange={(e) => setClient({ email: e.target.value })} placeholder="Needed to send" />
                </label>
                <label>
                  Phone (WhatsApp / SMS)
                  <input className="input" value={f.client.phone} onChange={(e) => setClient({ phone: e.target.value })} placeholder="Optional, e.g. +1 555 0100" />
                </label>
                <label className={isMissing("Due date") && !f.dueDate ? "need" : ""}>
                  Due date
                  <input className="input" type="date" value={f.dueDate} onChange={(e) => set({ dueDate: e.target.value })} />
                </label>
                <label>
                  Currency
                  <select className="input" value={f.currency} onChange={(e) => set({ currency: e.target.value })}>
                    {(CURRENCIES.includes(f.currency) ? CURRENCIES : [f.currency, ...CURRENCIES]).map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="lines-head">
                <span>Line items</span>
                <button className="btn ghost sm" onClick={() => set({ items: [...f.items, { name: "", quantity: 1, unitPrice: 0 }] })}>
                  <Plus size={14} /> Add line
                </button>
              </div>
              <div className="lines">
                {f.items.map((it, i) => (
                  <div className={`line ${isMissing("Amount") && !(Number(it.unitPrice) > 0) ? "need" : ""}`} key={i}>
                    <input className="input" aria-label="Description" placeholder="Description" value={it.name} onChange={(e) => setItem(i, { name: e.target.value })} />
                    <input className="input num" aria-label="Quantity" inputMode="decimal" value={it.quantity} onChange={(e) => setItem(i, { quantity: e.target.value as unknown as number })} />
                    <input className="input num" aria-label="Rate" inputMode="decimal" value={it.unitPrice} onChange={(e) => setItem(i, { unitPrice: e.target.value as unknown as number })} />
                    <button className="icon-btn" aria-label="Remove line" onClick={() => set({ items: f.items.filter((_, k) => k !== i) })} disabled={f.items.length === 1}>
                      <Close size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <label className="full">
                Note to client
                <input className="input" value={f.note} onChange={(e) => set({ note: e.target.value })} />
              </label>
              <div className="total-row">
                <span>Total</span>
                <b>{money2(total, f.currency || "USD")}</b>
              </div>
              <div className="actions-row">
                <button className="btn ghost" disabled={!!busy} onClick={() => save(false)}>
                  {busy === "save" ? "Saving…" : "Save draft"}
                </button>
                <button className="btn primary" disabled={!!busy || !f.client.email || !f.dueDate || total <= 0} onClick={() => save(true)} title={!f.client.email ? "Add the client's email first" : undefined}>
                  <Check size={15} /> {busy === "approve" ? "Approving…" : "Approve & create in PayPal"}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
