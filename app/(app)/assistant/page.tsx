"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check } from "@/components/ui/Icons";
import { useApp } from "@/components/layout/AppProvider";
import { PageHead, StatusPill } from "@/components/ui/Primitives";
import { Bot, Send, Sparkle, ArrowRight, Copy, Telegram, Mail, WhatsApp } from "@/components/ui/Icons";
import type { Card, ChatTurn } from "@/lib/ai/agent";
import type { DisplayStatus } from "@/lib/domain/format";

type Msg = ChatTurn & { cards?: Card[] };

const SUGGESTIONS = [
  "Who owes me money?",
  "How much is outstanding?",
  "Check my messages",
  "Remind Priya",
  "Send the invoice to Bruce",
  "Invoice this: Hi, it's Jess from Bloom Cafe (jess@bloom.example). Can you design our menu? $350, due Dec 1.",
];

export default function Assistant() {
  const { call, refresh, state } = useApp();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("leash-chat");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore chat from sessionStorage after hydration
      if (saved) setMsgs(JSON.parse(saved));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem("leash-chat", JSON.stringify(msgs.slice(-30)));
    } catch {}
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs]);

  async function send(q = text) {
    if (!q.trim() || busy) return;
    const next: Msg[] = [...msgs, { role: "user", text: q.trim() }];
    setMsgs(next);
    setText("");
    setBusy(true);
    const r = await call("/api/agent", { messages: next.map(({ role, text }) => ({ role, text })) });
    setBusy(false);
    setMsgs([...next, { role: "model", text: r.ok ? r.body.reply : (r.body.error ?? "Something went wrong."), cards: r.ok ? r.body.cards : [] }]);
    if (r.ok && r.body.cards?.length) refresh();
  }

  return (
    <>
      <PageHead
        title="Assistant"
        sub="Ask about your money, your clients or your inbox. It drafts invoices and prepares sends and reminders; nothing goes out until you tap Confirm."
      >
        {msgs.length > 0 && (
          <button className="btn ghost" onClick={() => setMsgs([])}>
            New chat
          </button>
        )}
      </PageHead>
      <section className="card chat-card">
        <div className="chat">
          {msgs.length === 0 && (
            <div className="chat-empty">
              <span className="bot-ic">
                <Bot size={24} />
              </span>
              <b>Hi, I&apos;m your Leash assistant.</b>
              <p className="muted">
                {state?.config.ai ? `Powered by Gemini (${state.config.aiModel}).` : "Running in demo mode. Add a free Gemini key for full conversations."} Try:
              </p>
              <div className="examples center">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="chip" onClick={() => send(s)}>
                    {s.length > 60 ? `${s.slice(0, 57)}…` : s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              {m.role === "model" && (
                <span className="bot-ic sm">
                  <Sparkle size={13} />
                </span>
              )}
              <div className="bubble-body">
                <p>{m.text}</p>
                {m.cards && m.cards.length > 0 && (
                  <div className="cards">
                    {m.cards.map((c, k) => (
                      <CardView key={k} c={c} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {busy && (
            <div className="bubble model">
              <span className="bot-ic sm">
                <Sparkle size={13} />
              </span>
              <div className="bubble-body typing">
                Thinking<span>.</span>
                <span>.</span>
                <span>.</span>
              </div>
            </div>
          )}
          <div ref={end} />
        </div>
        <form
          className="chat-input"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input className="input" placeholder="Ask Leash…" value={text} onChange={(e) => setText(e.target.value)} aria-label="Message the assistant" />
          <button className="btn primary" disabled={busy || !text.trim()} aria-label="Send">
            <Send size={15} />
          </button>
        </form>
      </section>
    </>
  );
}

function CardView({ c }: { c: Card }) {
  const { state, toast } = useApp();
  if (c.type === "invoice")
    return (
      <Link href={`/invoices/${c.id}`} className="mini-card">
        <div>
          <b>{c.client}</b>
          <span className="muted sm-text">
            <span className="num">{c.number}</span> · {c.note}
          </span>
        </div>
        <div className="mini-end">
          <b className="amount">{c.amount}</b>
          <StatusPill status={c.status as DisplayStatus} />
        </div>
      </Link>
    );
  if (c.type === "inbox")
    return (
      <Link href="/inbox" className="mini-card">
        <div>
          <b>
            {c.source === "telegram" ? <Telegram size={13} /> : c.source === "email" ? <Mail size={13} /> : <WhatsApp size={13} />} {c.from}
          </b>
          <span className="muted sm-text">{c.preview.slice(-110)}</span>
        </div>
        <ArrowRight size={15} />
      </Link>
    );
  if (c.type === "action") return <ActionCard c={c} />;
  const inv = state?.invoices.find((i) => i.id === c.invoiceId);
  return (
    <div className="mini-card col">
      <div className="row-between">
        <b>
          {c.stage} · {c.client}
        </b>
        <span className="muted sm-text num">{c.number}</span>
      </div>
      <p className="draft-text">{c.text}</p>
      <div className="channels">
        <Link className="btn primary sm" href={`/invoices/${c.invoiceId}`}>
          Review &amp; send
        </Link>
        <button
          className="btn sm"
          onClick={() => {
            navigator.clipboard.writeText(c.text);
            toast("Copied.");
          }}
        >
          <Copy size={13} /> Copy
        </button>
        {inv?.client.phone && (
          <a
            className="btn sm"
            href={`https://wa.me/${inv.client.phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(c.text)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsApp size={13} /> WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

/** A send or reminder the assistant prepared. It runs only when you tap Confirm. */
function ActionCard({ c }: { c: Extract<Card, { type: "action" }> }) {
  const { call, refresh, toast } = useApp();
  const [phase, setPhase] = useState<"ready" | "busy" | "done" | "error">("ready");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState(c.message ?? "");

  async function confirm() {
    setPhase("busy");
    setErr("");
    for (const action of c.steps) {
      const r = await call(`/api/invoices/${c.invoiceId}`, {
        action,
        ...(action === "remind" ? { channel: c.channel, stage: c.stage, subject: c.subject, message: msg } : {}),
      });
      if (!r.ok) {
        setPhase("error");
        setErr(r.body.error ?? "That didn't go through.");
        refresh();
        return;
      }
    }
    setPhase("done");
    toast(c.steps.includes("remind") ? "Reminder sent." : `${c.number} sent.`);
    refresh();
  }

  return (
    <div className={`mini-card col action-card ${phase}`}>
      <div className="row-between">
        <b>{c.title}</b>
        <span className="muted sm-text">
          <span className="num">{c.number}</span> · <span className="amount">{c.amount}</span>
        </span>
      </div>
      {c.steps.includes("remind") && (
        <textarea
          className="input draft-edit"
          rows={5}
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          disabled={phase !== "ready" && phase !== "error"}
          aria-label="Reminder text"
        />
      )}
      {c.steps.length > 1 && <p className="muted sm-text">Approves the draft (creates it in PayPal), then sends it with a pay link.</p>}
      {err && <p className="err-text">{err}</p>}
      <div className="channels">
        {phase === "done" ? (
          <span className="done-text">
            <Check size={14} /> Done · logged in Activity
          </span>
        ) : (
          <>
            <button className="btn primary sm" onClick={confirm} disabled={phase === "busy"}>
              <Check size={13} /> {phase === "busy" ? "Sending…" : "Confirm & send"}
            </button>
            <Link className="btn sm" href={`/invoices/${c.invoiceId}`}>
              Open invoice
            </Link>
            {msg && (
              <button
                className="btn sm"
                onClick={() => {
                  navigator.clipboard.writeText(msg);
                  toast("Copied.");
                }}
              >
                <Copy size={13} /> Copy
              </button>
            )}
            {msg && c.phone && (
              <a
                className="btn sm"
                href={`https://wa.me/${c.phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(msg)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsApp size={13} /> WhatsApp
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}
