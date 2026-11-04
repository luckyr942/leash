"use client";
import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { PageHead } from "@/components/UI";
import { Telegram, Mail, WhatsApp, Instagram, Check, Refresh, Sparkle, PayPalMark, Upload, ArrowRight } from "@/components/Icons";

const PROVIDERS = [
  ["gmail", "Gmail", "https://myaccount.google.com/apppasswords"],
  ["outlook", "Outlook / Microsoft 365", "https://account.live.com/proofs/AppPassword"],
  ["zoho", "Zoho Mail", "https://accounts.zoho.com/home#security/app_password"],
  ["yahoo", "Yahoo Mail", "https://login.yahoo.com/account/security"],
  ["custom", "Other (IMAP/SMTP)", ""],
] as const;

export default function Connections() {
  const { state, call, toast, refresh } = useApp();
  const [busy, setBusy] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [em, setEm] = useState({ provider: "gmail", user: "", pass: "", fromName: "", smtpHost: "", smtpPort: "465", imapHost: "", imapPort: "993" });
  if (!state) return null;
  const { connectors: c, config } = state;
  const provider = PROVIDERS.find((p) => p[0] === em.provider)!;

  async function run(key: string, payload: object, ok: (b: any) => string) {
    setBusy(key);
    const r = await call("/api/connectors", payload);
    setBusy(null);
    if (r.ok) {
      toast(ok(r.body));
      refresh();
    }
    return r.ok;
  }

  return (
    <>
      <PageHead title="Connections" sub="Bring client conversations into Leash and send reminders from your own accounts. Credentials are encrypted and never shown again." />

      <div className="conn-grid">
        {/* Telegram */}
        <section className="card conn">
          <div className="conn-head">
            <span className="conn-ic tg">
              <Telegram size={20} />
            </span>
            <div>
              <h2>Telegram</h2>
              <p className="muted sm-text">Clients message your bot (or you forward their messages to it). Reminders go back in the same chat.</p>
            </div>
            {c.telegram.connected && <span className="pill s-paid">Connected</span>}
          </div>
          {c.telegram.connected ? (
            <>
              <p className="sm-text">
                Bot <b>@{c.telegram.username}</b> · share{" "}
                <a className="link" href={`https://t.me/${c.telegram.username}`} target="_blank" rel="noopener noreferrer">
                  t.me/{c.telegram.username}
                </a>{" "}
                with clients, or forward a client&apos;s messages to it.
              </p>
              <div className="channels">
                <button className="btn primary sm" disabled={!!busy} onClick={() => run("tg-sync", { kind: "telegram", action: "sync" }, (b) => `${b.count} new Telegram message${b.count === 1 ? "" : "s"}.`)}>
                  <Refresh size={14} /> {busy === "tg-sync" ? "Checking…" : "Check messages"}
                </button>
                <Link className="btn sm" href="/inbox">
                  Open inbox
                </Link>
                <button className="btn ghost sm danger" disabled={!!busy} onClick={() => run("tg-off", { kind: "telegram", action: "disconnect" }, () => "Telegram disconnected.")}>
                  Disconnect
                </button>
              </div>
            </>
          ) : (
            <>
              <ol className="steps-list">
                <li>
                  In Telegram, open{" "}
                  <a className="link" href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer">
                    @BotFather
                  </a>{" "}
                  and send <code>/newbot</code>.
                </li>
                <li>Pick a name like “Rivera Studio Billing”. BotFather replies with a token.</li>
                <li>Paste the token here.</li>
              </ol>
              <div className="inline-form">
                <input className="input" placeholder="123456789:AA…" value={token} onChange={(e) => setToken(e.target.value)} aria-label="Telegram bot token" autoComplete="off" />
                <button
                  className="btn primary"
                  disabled={!token.trim() || !!busy}
                  onClick={async () => {
                    if (await run("tg", { kind: "telegram", action: "connect", token }, (b) => `Connected @${b.username}.`)) setToken("");
                  }}
                >
                  {busy === "tg" ? "Connecting…" : "Connect"}
                </button>
              </div>
            </>
          )}
        </section>

        {/* Email */}
        <section className="card conn">
          <div className="conn-head">
            <span className="conn-ic mail">
              <Mail size={20} />
            </span>
            <div>
              <h2>Email</h2>
              <p className="muted sm-text">Send reminders from your own address and pull recent emails (including Upwork, Fiverr and Instagram notifications) into the Inbox.</p>
            </div>
            {c.email.connected && <span className="pill s-paid">Connected</span>}
          </div>
          {c.email.connected ? (
            <>
              <p className="sm-text">
                Sending and reading as <b>{c.email.user}</b>.
              </p>
              <div className="channels">
                <button className="btn primary sm" disabled={!!busy} onClick={() => run("em-sync", { kind: "email", action: "sync" }, (b) => `Checked ${b.count} recent email${b.count === 1 ? "" : "s"}.`)}>
                  <Refresh size={14} /> {busy === "em-sync" ? "Checking…" : "Check inbox"}
                </button>
                <button className="btn sm" disabled={!!busy} onClick={() => run("em-test", { kind: "email", action: "test" }, () => `Test email sent to ${c.email.user}.`)}>
                  Send test email
                </button>
                <button className="btn ghost sm danger" disabled={!!busy} onClick={() => run("em-off", { kind: "email", action: "disconnect" }, () => "Email disconnected.")}>
                  Disconnect
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="form-grid">
                <label>
                  Provider
                  <select className="input" value={em.provider} onChange={(e) => setEm({ ...em, provider: e.target.value })}>
                    {PROVIDERS.map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Your name (shown as sender)
                  <input className="input" value={em.fromName} placeholder={state.profile.yourName} onChange={(e) => setEm({ ...em, fromName: e.target.value })} />
                </label>
                <label>
                  Email address
                  <input className="input" type="email" autoComplete="off" value={em.user} onChange={(e) => setEm({ ...em, user: e.target.value })} placeholder="you@gmail.com" />
                </label>
                <label>
                  App password
                  <input className="input" type="password" autoComplete="new-password" value={em.pass} onChange={(e) => setEm({ ...em, pass: e.target.value })} placeholder="16-character app password" />
                </label>
                {em.provider === "custom" && (
                  <>
                    <label>
                      SMTP server
                      <input className="input" value={em.smtpHost} onChange={(e) => setEm({ ...em, smtpHost: e.target.value })} placeholder="smtp.example.com" />
                    </label>
                    <label>
                      SMTP port
                      <input className="input" value={em.smtpPort} onChange={(e) => setEm({ ...em, smtpPort: e.target.value })} />
                    </label>
                    <label>
                      IMAP server
                      <input className="input" value={em.imapHost} onChange={(e) => setEm({ ...em, imapHost: e.target.value })} placeholder="imap.example.com" />
                    </label>
                    <label>
                      IMAP port
                      <input className="input" value={em.imapPort} onChange={(e) => setEm({ ...em, imapPort: e.target.value })} />
                    </label>
                  </>
                )}
              </div>
              <p className="muted sm-text" style={{ margin: "10px 0 0" }}>
                Use an <b>app password</b>, not your normal password.{" "}
                {provider[2] && (
                  <a className="link" href={provider[2]} target="_blank" rel="noopener noreferrer">
                    Create one for {provider[1]}
                  </a>
                )}
                {em.provider === "gmail" && " (needs 2-Step Verification)."}
              </p>
              <div className="actions-row">
                <button
                  className="btn primary"
                  disabled={!em.user || !em.pass || !!busy}
                  onClick={async () => {
                    if (await run("em", { kind: "email", action: "connect", ...em, fromName: em.fromName || state.profile.yourName }, (b) => `Connected ${b.user}.`))
                      setEm({ ...em, pass: "" });
                  }}
                >
                  {busy === "em" ? "Checking sign-in…" : "Connect email"}
                </button>
              </div>
            </>
          )}
        </section>

        {/* WhatsApp */}
        <section className="card conn">
          <div className="conn-head">
            <span className="conn-ic wa">
              <WhatsApp size={20} />
            </span>
            <div>
              <h2>WhatsApp</h2>
              <p className="muted sm-text">Import a chat to create an invoice. Reminders open WhatsApp with the message ready, one tap to send.</p>
            </div>
            <span className="pill s-paid">Ready</span>
          </div>
          <ol className="steps-list">
            <li>In WhatsApp, open the client chat → ⋮ (or the name) → <b>Export chat</b> → <b>Without media</b>.</li>
            <li>Save the .txt and upload it in the Inbox.</li>
          </ol>
          <Link className="btn sm" href="/inbox">
            <Upload size={14} /> Import a chat
          </Link>
        </section>

        {/* Other platforms */}
        <section className="card conn">
          <div className="conn-head">
            <span className="conn-ic ig">
              <Instagram size={20} />
            </span>
            <div>
              <h2>Instagram, Upwork, Fiverr, LinkedIn</h2>
              <p className="muted sm-text">These platforms don&apos;t let apps read your DMs. Two ways in:</p>
            </div>
          </div>
          <ul className="bullets">
            <li>
              <b>Email notifications</b>: turn on message emails in the platform; with Email connected, they land in your Inbox automatically.
            </li>
            <li>
              <b>Paste</b>: copy the conversation into the Inbox and tag where it came from.
            </li>
            <li>Send the PayPal pay link back in the same DM with Copy.</li>
          </ul>
          <Link className="btn sm" href="/inbox">
            Paste a conversation <ArrowRight size={13} />
          </Link>
        </section>

        {/* Core services */}
        <section className="card conn wide">
          <div className="card-head">
            <h2>Core services</h2>
            <span className="muted sm-text">Set in the server environment (.env.local or Render)</span>
          </div>
          <ul className="status-list">
            <li>
              <span className={`tick ${config.paypal ? "ok" : ""}`}>{config.paypal ? <Check size={12} /> : <PayPalMark size={13} />}</span>
              <div>
                <b>PayPal Invoicing ({config.env})</b>
                <span>
                  {config.paypal ? "Live: invoices are created, sent and reminded through PayPal." : "Simulated. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET from developer.paypal.com (sandbox app)."}
                </span>
              </div>
            </li>
            <li>
              <span className={`tick ${config.ai ? "ok" : ""}`}>{config.ai ? <Check size={12} /> : <Sparkle size={13} />}</span>
              <div>
                <b>Gemini AI ({config.aiModel})</b>
                <span>{config.ai ? "Live: extraction, drafts and the assistant use Gemini." : config.aiProblem ?? "Rule-based fallback. Add a free GEMINI_API_KEY from aistudio.google.com/apikey."}</span>
              </div>
            </li>
            <li>
              <span className={`tick ${config.webhooks ? "ok" : ""}`}>{config.webhooks ? <Check size={12} /> : "–"}</span>
              <div>
                <b>PayPal webhooks</b>
                <span>{config.webhooks ? "Paid invoices update automatically." : "Optional on a public URL: set PAYPAL_WEBHOOK_ID. Without it, use Refresh status."}</span>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
