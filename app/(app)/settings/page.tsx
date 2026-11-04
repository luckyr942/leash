"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { PageHead } from "@/components/UI";
import { Check } from "@/components/Icons";
import ThemeToggle from "@/components/ThemeToggle";
import type { Profile } from "@/lib/store";

export default function Settings() {
  const { state, call, toast, refresh } = useApp();
  const [p, setP] = useState<Profile | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    if (state && !p) setP(state.profile);
  }, [state, p]);
  if (!state || !p) return null;
  const c = state.config;

  const STATUS = [
    { ok: c.ai, label: `Gemini AI (${c.aiModel})`, on: "Extracts invoices, drafts follow-ups and powers the assistant", off: "Rule-based demo. Set GEMINI_API_KEY (free at aistudio.google.com)" },
    { ok: c.paypal, label: `PayPal Invoicing (${c.env})`, on: "Invoices are created, sent and reminded through PayPal", off: "Simulated. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET" },
    { ok: c.webhooks, label: "PayPal webhooks", on: "Paid invoices update automatically", off: "Optional. Set PAYPAL_WEBHOOK_ID" },
  ];

  async function save() {
    setBusy("save");
    const r = await call("/api/settings", p);
    setBusy(null);
    if (r.ok) {
      toast("Profile saved.");
      refresh();
    }
  }
  async function data(action: "sample" | "clear", msg: string, confirmText: string) {
    if (!window.confirm(confirmText)) return;
    setBusy(action);
    const r = await call("/api/workspace", { action });
    setBusy(null);
    if (r.ok) {
      toast(msg);
      setP(null);
      refresh();
    }
  }

  return (
    <>
      <PageHead title="Settings" />
      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <h2>Your business</h2>
          </div>
          <p className="muted sm-text" style={{ marginTop: -4 }}>
            Used on invoices and to sign the messages Leash drafts.
          </p>
          <div className="form-grid">
            <label>
              Your name
              <input className="input" value={p.yourName} onChange={(e) => setP({ ...p, yourName: e.target.value })} />
            </label>
            <label>
              Business name
              <input className="input" value={p.business} onChange={(e) => setP({ ...p, business: e.target.value })} />
            </label>
            <label>
              Reply-to email
              <input className="input" type="email" value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} placeholder="you@studio.com" />
            </label>
            <label>
              Default currency
              <input className="input" maxLength={3} value={p.currency} onChange={(e) => setP({ ...p, currency: e.target.value.toUpperCase() })} />
            </label>
            <label>
              Default payment terms (days)
              <input className="input" inputMode="numeric" value={p.defaultDueDays} onChange={(e) => setP({ ...p, defaultDueDays: Number(e.target.value.replace(/\D/g, "")) || 0 })} />
            </label>
          </div>
          <div className="actions-row">
            <button className="btn primary" disabled={busy === "save"} onClick={save}>
              {busy === "save" ? "Saving…" : "Save"}
            </button>
          </div>
        </section>

        <div className="stack">
          <section className="card">
            <div className="card-head">
              <h2>Connections</h2>
            </div>
            <ul className="status-list">
              {STATUS.map((s) => (
                <li key={s.label}>
                  <span className={`tick ${s.ok ? "ok" : ""}`}>{s.ok ? <Check size={12} /> : "–"}</span>
                  <div>
                    <b>{s.label}</b>
                    <span>{s.ok ? s.on : s.off}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <section className="card">
            <div className="card-head">
              <h2>Appearance</h2>
              <ThemeToggle />
            </div>
            <p className="muted sm-text" style={{ margin: 0 }}>
              Light by default. Your choice is remembered in this browser.
            </p>
          </section>
          <section className="card">
            <div className="card-head">
              <h2>Workspace</h2>
            </div>
            <p className="muted sm-text" style={{ marginTop: -4 }}>
              Workspace <code>{state.workspace}</code> is private to this browser and removed after 30 days without use.
            </p>
            <div className="channels">
              <button className="btn" disabled={!!busy} onClick={() => data("sample", "Sample data loaded.", "Replace everything with the sample freelancer data?")}>
                Load sample data
              </button>
              <button className="btn ghost danger" disabled={!!busy} onClick={() => data("clear", "All invoices and activity cleared.", "Delete all invoices and activity in this workspace?")}>
                Clear everything
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
