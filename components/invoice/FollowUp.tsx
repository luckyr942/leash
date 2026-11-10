"use client";
// The collections assistant for one invoice: rules pick the step, AI drafts the words,
// and the person approves by tapping a channel. Nothing is sent without that tap.
import { useEffect, useState } from "react";
import { useApp } from "@/components/layout/AppProvider";
import { Mail, WhatsApp, Sms, Copy, Send, Sparkle, Phone, Alert, Check, Telegram } from "@/components/ui/Icons";
import { StagePill } from "@/components/ui/Primitives";
import { assess, STAGE_LABEL } from "@/lib/domain/rules";
import { channelLink } from "@/lib/domain/format";
import type { Invoice, Channel } from "@/lib/domain/models";

type Draft = {
  stage: "FRIENDLY" | "FIRM" | "FINAL" | "ESCALATE" | "SEND";
  subject: string;
  email: string;
  short: string;
  why: string;
  draftedBy: "ai" | "template";
};

export default function FollowUp({ inv, compact = false }: { inv: Invoice; compact?: boolean }) {
  const { call, refresh, toast, state } = useApp();
  const emailConnected = Boolean(state?.connectors.email.connected);
  const tgReady = Boolean(state?.connectors.telegram.connected && inv.client.telegramChatId);
  const a = assess(inv);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<"long" | "short">("long");
  const [manual, setManual] = useState(false);

  const wantsDraft = ["FRIENDLY", "FIRM", "FINAL", "ESCALATE", "SEND"].includes(a.action) || manual;

  async function load() {
    setLoading(true);
    const r = await call(`/api/invoices/${inv.id}/followup`);
    setLoading(false);
    if (r.ok) setDraft(r.body.draft);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the draft when the invoice changes
    setDraft(null);
    if (wantsDraft && !compact) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inv.id, inv.status, inv.reminders.length, manual]);

  const fill = (text: string) => text.replaceAll("{{link}}", inv.payUrl ?? "(PayPal link is created when you send)");

  async function sendInvoice() {
    if (!draft) return;
    setBusy("send");
    const r = await call(`/api/invoices/${inv.id}`, { action: "send", subject: draft.subject, message: fill(draft.email) });
    setBusy(null);
    if (r.ok) {
      toast(inv.simulated ? "Sent (simulated). Share the pay link below." : "Sent. PayPal emailed your client a secure pay link.");
      refresh();
    }
  }

  async function remind(channel: Channel) {
    if (!draft || draft.stage === "SEND") return;
    const subject = draft.subject;
    const body = fill(channel === "whatsapp" || channel === "sms" || channel === "telegram" ? draft.short : draft.email);
    // Connected email is sent by the server; otherwise open the person's own app with the text (as a user gesture).
    const href = channel === "email" && emailConnected ? null : channelLink(channel, { email: inv.client.email, phone: inv.client.phone }, subject, body);
    if (channel === "copy") await navigator.clipboard.writeText(body).catch(() => {});
    if (href) {
      if (channel === "whatsapp") window.open(href, "_blank", "noopener");
      else window.location.href = href;
    }
    setBusy(channel);
    const r = await call(`/api/invoices/${inv.id}`, { action: "remind", channel, stage: draft.stage, subject, message: body });
    setBusy(null);
    if (r.ok) {
      toast(
        channel === "paypal"
          ? `${STAGE_LABEL[draft.stage]} sent through PayPal${inv.simulated ? " (simulated)" : ""}.`
          : channel === "copy"
            ? "Copied. Paste it anywhere; logged as sent."
            : channel === "telegram"
              ? `Sent to ${inv.client.name.split(" ")[0]} on Telegram.`
              : channel === "email" && emailConnected
                ? `Emailed ${inv.client.email} from ${state?.connectors.email.user}.`
                : `Opened ${channel === "email" ? "your email app" : channel === "whatsapp" ? "WhatsApp" : "Messages"} with the reminder; logged.`,
      );
      refresh();
    }
  }

  async function act(action: string, msg: string) {
    setBusy(action);
    const r = await call(`/api/invoices/${inv.id}`, { action });
    setBusy(null);
    if (r.ok) {
      toast(msg);
      refresh();
    }
  }

  // ---------- states without a message ----------
  if (a.action === "APPROVE") {
    return (
      <div className="fu">
        <div className="fu-head">
          <StagePill action="approve" label="Waiting for your approval" />
        </div>
        <p className="fu-why">{a.reason}</p>
      </div>
    );
  }
  if (a.action === "NONE") {
    return (
      <div className="fu">
        <div className="fu-head">
          <StagePill action={inv.status === "PAID" ? "paid" : "none"} label={a.label} />
        </div>
        <p className="fu-why">{a.reason}</p>
        {inv.escalatedAt && inv.status === "SENT" && (
          <button className="btn" disabled={!!busy} onClick={() => act("mark_paid", "Marked as paid.")}>
            <Check size={15} /> Mark as paid
          </button>
        )}
      </div>
    );
  }
  if (a.action === "WAIT" && !manual) {
    return (
      <div className="fu">
        <div className="fu-head">
          <StagePill action="wait" label={a.label} />
        </div>
        <p className="fu-why">{a.reason}</p>
        <button className="btn ghost sm" onClick={() => setManual(true)}>
          Write a reminder anyway
        </button>
      </div>
    );
  }

  if (compact && !draft) {
    return (
      <button className="btn sm" onClick={load} disabled={loading}>
        <Sparkle size={14} /> {loading ? "Drafting…" : "Draft message"}
      </button>
    );
  }

  return (
    <div className="fu">
      <div className="fu-head">
        <StagePill
          action={a.action === "WAIT" ? "friendly" : a.action}
          label={a.action === "SEND" ? "Ready to send" : a.action === "WAIT" ? "Early nudge" : STAGE_LABEL[a.action as "FIRM"]}
        />
        <span className="muted sm-text">{a.action === "SEND" ? "" : a.label}</span>
      </div>
      {!draft ? (
        <div className="fu-loading">
          <Sparkle size={15} /> {loading ? "Drafting a message…" : ""}
        </div>
      ) : (
        <>
          <p className="fu-why">
            <Sparkle size={13} /> {draft.why}
            <span className="by">{draft.draftedBy === "ai" ? "Drafted by Gemini" : "Template (add a Gemini key for tailored drafts)"}</span>
          </p>

          {a.action === "ESCALATE" && (
            <div className="fu-alert">
              <Alert size={15} /> More reminders rarely work at this point. Talk to {inv.client.name.split(" ")[0]} directly.
            </div>
          )}

          <label className="field-label">Subject</label>
          <input className="input" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
          {draft.stage !== "SEND" && (
            <div className="seg sm-seg" role="tablist" aria-label="Message length">
              <button role="tab" aria-selected={tab === "long"} className={tab === "long" ? "on" : ""} onClick={() => setTab("long")}>
                Email
              </button>
              <button role="tab" aria-selected={tab === "short"} className={tab === "short" ? "on" : ""} onClick={() => setTab("short")}>
                Chat (WhatsApp / SMS / Telegram)
              </button>
            </div>
          )}
          <textarea
            className="input"
            rows={tab === "long" ? 8 : 4}
            value={tab === "long" ? draft.email : draft.short}
            onChange={(e) => setDraft(tab === "long" ? { ...draft, email: e.target.value } : { ...draft, short: e.target.value })}
            aria-label="Message"
          />
          <p className="muted sm-text">
            {"{{link}}"} becomes {inv.payUrl ? "your PayPal pay link" : "the PayPal pay link once sent"}. Review before sending — Leash never sends on its own.
          </p>

          {draft.stage === "SEND" ? (
            <div className="channels">
              <button className="btn primary" disabled={!!busy} onClick={sendInvoice}>
                <Send size={15} /> {busy === "send" ? "Sending…" : "Send via PayPal"}
              </button>
            </div>
          ) : (
            <div className="channels">
              <button className="btn primary" disabled={!!busy} onClick={() => remind("paypal")} title="PayPal emails the reminder with the secure pay link">
                <Send size={15} /> {busy === "paypal" ? "Sending…" : "Send via PayPal"}
              </button>
              <button
                className="btn"
                disabled={!!busy || !inv.client.email}
                onClick={() => remind("email")}
                title={inv.client.email ? "Open your email app" : "No client email"}
              >
                <Mail size={15} /> {emailConnected ? "Send email" : "Email"}
              </button>
              {tgReady && (
                <button className="btn" disabled={!!busy} onClick={() => remind("telegram")} title="Send in your Telegram bot chat">
                  <Telegram size={15} /> Telegram
                </button>
              )}
              <button
                className="btn"
                disabled={!!busy}
                onClick={() => remind("whatsapp")}
                title={inv.client.phone ? "Open WhatsApp" : "Open WhatsApp and pick the contact"}
              >
                <WhatsApp size={15} /> WhatsApp
              </button>
              <button className="btn" disabled={!!busy} onClick={() => remind("sms")}>
                <Sms size={15} /> SMS
              </button>
              <button className="btn ghost" disabled={!!busy} onClick={() => remind("copy")}>
                <Copy size={15} /> Copy
              </button>
            </div>
          )}

          {a.action === "ESCALATE" && (
            <div className="channels" style={{ marginTop: 8 }}>
              {inv.client.phone && (
                <a className="btn" href={`tel:+${inv.client.phone.replace(/[^\d]/g, "")}`}>
                  <Phone size={15} /> Call {inv.client.name.split(" ")[0]}
                </a>
              )}
              <button className="btn ghost" disabled={!!busy} onClick={() => act("escalate", "Taken offline. Leash will stop suggesting reminders.")}>
                Handle it personally
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
