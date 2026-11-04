"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { PageHead, Empty, Avatar } from "@/components/UI";
import { EmptyArt } from "@/components/Art";
import { Telegram, Mail, WhatsApp, Instagram, Refresh, Upload, Sparkle, Trash, ArrowRight, Plug } from "@/components/Icons";
import { ago } from "@/lib/format";
import type { InboxItem } from "@/lib/store";

const SRC: Record<InboxItem["source"], { label: string; Icon: typeof Mail; cls: string }> = {
  telegram: { label: "Telegram", Icon: Telegram, cls: "tg" },
  email: { label: "Email", Icon: Mail, cls: "mail" },
  whatsapp: { label: "WhatsApp", Icon: WhatsApp, cls: "wa" },
  paste: { label: "Pasted", Icon: Instagram, cls: "ig" },
};

export default function InboxPage() {
  const { state, call, toast, refresh } = useApp();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [paste, setPaste] = useState({ show: false, source: "Instagram", from: "", text: "" });
  const file = useRef<HTMLInputElement>(null);
  const tg = state?.connectors.telegram.connected;
  const em = state?.connectors.email.connected;

  async function sync(quiet = false) {
    if (!tg && !em) return;
    setBusy("sync");
    let n = 0;
    if (tg) {
      const r = await call("/api/connectors", { kind: "telegram", action: "sync" });
      if (r.ok) n += r.body.count;
    }
    if (em) await call("/api/connectors", { kind: "email", action: "sync" });
    setBusy(null);
    await refresh();
    if (!quiet) toast(tg ? `${n} new Telegram message${n === 1 ? "" : "s"}${em ? "; email checked" : ""}.` : "Email checked.");
  }

  // Check Telegram quietly every 20s while this page is open.
  useEffect(() => {
    if (!tg) return;
    const t = setInterval(() => sync(true), 20_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tg]);

  if (!state) return null;
  const items = state.inbox;

  function toInvoice(item: InboxItem) {
    try {
      sessionStorage.setItem("leash-import", JSON.stringify({ text: item.text, inboxId: item.id, source: item.source, handle: item.handle }));
    } catch {}
    router.push("/new");
  }

  async function importFile(f: File) {
    if (f.size > 500_000) return toast("That file is too big. Export the chat without media.");
    setBusy("wa");
    const r = await call("/api/inbox", { action: "import_whatsapp", text: await f.text() });
    setBusy(null);
    if (r.ok) {
      toast(`Imported chat with ${r.body.item.fromName}.`);
      await refresh();
      setOpen(r.body.item.id);
    }
  }

  async function addPaste() {
    setBusy("paste");
    const r = await call("/api/inbox", { action: "add_paste", text: paste.text, source: paste.source, from: paste.from });
    setBusy(null);
    if (r.ok) {
      setPaste({ show: false, source: paste.source, from: "", text: "" });
      await refresh();
      setOpen(r.body.item.id);
    }
  }

  return (
    <>
      <PageHead title="Inbox" sub="Client conversations from Telegram, email, WhatsApp and pasted DMs. Turn any of them into an invoice in one click.">
        {(tg || em) && (
          <button className="btn" disabled={busy === "sync"} onClick={() => sync()}>
            <Refresh size={15} /> {busy === "sync" ? "Checking…" : "Check now"}
          </button>
        )}
        <button className="btn" disabled={busy === "wa"} onClick={() => file.current?.click()}>
          <Upload size={15} /> {busy === "wa" ? "Importing…" : "Import WhatsApp chat"}
        </button>
        <button className="btn primary" onClick={() => setPaste({ ...paste, show: !paste.show })}>
          Paste a conversation
        </button>
        <input ref={file} type="file" accept=".txt,text/plain" hidden onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} />
      </PageHead>

      {!tg && !em && (
        <Link href="/connections" className="banner">
          <Plug size={15} /> Connect Telegram or email to pull conversations in automatically. <ArrowRight size={14} />
        </Link>
      )}

      {paste.show && (
        <section className="card" style={{ marginBottom: 16 }}>
          <div className="form-grid">
            <label>
              From
              <select className="input" value={paste.source} onChange={(e) => setPaste({ ...paste, source: e.target.value })}>
                {["Instagram", "Upwork", "Fiverr", "LinkedIn", "Facebook", "Slack", "Other"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Client name
              <input className="input" value={paste.from} onChange={(e) => setPaste({ ...paste, from: e.target.value })} placeholder="Optional" />
            </label>
          </div>
          <label className="full">
            Conversation
            <textarea className="input" rows={6} value={paste.text} onChange={(e) => setPaste({ ...paste, text: e.target.value })} placeholder="Paste the messages here…" />
          </label>
          <div className="actions-row">
            <button className="btn ghost" onClick={() => setPaste({ ...paste, show: false })}>
              Cancel
            </button>
            <button className="btn primary" disabled={paste.text.trim().length < 10 || busy === "paste"} onClick={addPaste}>
              Add to inbox
            </button>
          </div>
        </section>
      )}

      <section className="card">
        {items.length === 0 ? (
          <Empty title="No conversations yet" art={<EmptyArt kind="activity" />}>
            Message your Telegram bot, connect email, import a WhatsApp chat or paste a DM.
          </Empty>
        ) : (
          <ul className="inbox-list">
            {items.map((it) => {
              const S = SRC[it.source];
              const lastLine = it.text.split("\n").filter(Boolean).slice(-1)[0] ?? "";
              return (
                <li key={it.id} className={open === it.id ? "open" : ""}>
                  <button className="fu-row" onClick={() => setOpen(open === it.id ? null : it.id)} aria-expanded={open === it.id}>
                    <span className={`src-ic ${S.cls}`} title={S.label}>
                      <S.Icon size={15} />
                    </span>
                    <Avatar name={it.fromName} size={32} />
                    <div className="row-main">
                      <b>
                        {it.fromName} <span className="muted">· {it.subject}</span>
                      </b>
                      <span className="muted sm-text">{lastLine.slice(0, 140)}</span>
                    </div>
                    <div className="row-end">
                      <span className="muted sm-text">{ago(it.at)}</span>
                      {it.invoiceId ? <span className="pill s-paid">Invoiced</span> : <span className="pill a-approve">New</span>}
                    </div>
                  </button>
                  {open === it.id && (
                    <div className="fu-body">
                      <pre className="convo">{it.text}</pre>
                      <div className="channels">
                        {it.invoiceId ? (
                          <Link className="btn primary sm" href={`/invoices/${it.invoiceId}`}>
                            Open invoice <ArrowRight size={13} />
                          </Link>
                        ) : (
                          <button className="btn primary sm" onClick={() => toInvoice(it)}>
                            <Sparkle size={14} /> Create invoice with AI
                          </button>
                        )}
                        <button
                          className="btn ghost sm danger"
                          onClick={async () => {
                            await call("/api/inbox", { action: "delete", id: it.id });
                            refresh();
                          }}
                        >
                          <Trash size={14} /> Remove
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
