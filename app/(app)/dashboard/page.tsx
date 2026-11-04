"use client";
import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import { Avatar, PageHead, StagePill, Empty } from "@/components/UI";
import { EmptyArt } from "@/components/Art";
import { ArrowRight, Plus, Sparkle } from "@/components/Icons";
import { assess, daysOverdue, isOverdue } from "@/lib/rules";
import { money, ago, sumByCurrency, toBase } from "@/lib/format";

const ACTION_BTN: Record<string, string> = {
  APPROVE: "Review & approve",
  SEND: "Send",
  FRIENDLY: "Review reminder",
  FIRM: "Review reminder",
  FINAL: "Review notice",
  ESCALATE: "Decide next step",
};

const BUCKETS = [
  { key: "current", label: "Not due", test: (d: number) => d <= 0 },
  { key: "b1", label: "1–7 days", test: (d: number) => d >= 1 && d <= 7 },
  { key: "b2", label: "8–21", test: (d: number) => d >= 8 && d <= 21 },
  { key: "b3", label: "22–30", test: (d: number) => d >= 22 && d <= 30 },
  { key: "b4", label: "30+", test: (d: number) => d > 30 },
];

export default function Overview() {
  const { state } = useApp();
  if (!state) return null;
  const { invoices, activity, profile, config } = state;
  const cur = profile.currency;
  const sent = invoices.filter((i) => i.status === "SENT");
  const overdue = sent.filter((i) => isOverdue(i));
  const fx = state.fx;
  const outS = sumByCurrency(sent, cur, fx);
  const overS = sumByCurrency(overdue, cur, fx);
  const colS = sumByCurrency(invoices.filter((i) => i.status === "PAID"), cur, fx);
  const outstanding = outS.home;
  const drafts = invoices.filter((i) => i.status === "DRAFT" || i.status === "APPROVED");

  const attention = invoices
    .map((i) => ({ inv: i, a: assess(i) }))
    .filter((x) => x.a.severity >= 2)
    .sort((x, y) => y.a.severity - x.a.severity || y.a.daysOverdue - x.a.daysOverdue);

  const aging = BUCKETS.map((b) => ({
    ...b,
    amount: sent.filter((i) => b.test(daysOverdue(i.dueDate))).reduce((s, i) => s + (i.currency === cur ? i.total : toBase(i.total, i.currency, fx) ?? 0), 0),
  }));
  const agingTotal = aging.reduce((s, b) => s + b.amount, 0) || 1;
  const first = profile.yourName.split(" ")[0];
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const demo = !config.paypal || !config.ai;

  return (
    <>
      <PageHead title={first ? `${hello}, ${first}` : "Overview"} sub={`${today} · ${attention.length ? `${attention.length} thing${attention.length === 1 ? " needs" : "s need"} your attention` : "You're all caught up"}`}>
        <Link href="/new" className="btn primary">
          <Plus size={16} /> New invoice
        </Link>
      </PageHead>

      {demo && (
        <Link href="/settings" className="banner">
          <Sparkle size={15} /> You&apos;re in demo mode: {!config.ai && "rule-based drafting"}
          {!config.ai && !config.paypal && " and "}
          {!config.paypal && "simulated PayPal"}. Add your keys in Settings to go live.
          <ArrowRight size={14} />
        </Link>
      )}

      <section className="kpis">
        <Kpi label="Outstanding" sum={outS} cur={cur} note={`${sent.length} sent`} />
        <Kpi label="Overdue" sum={overS} cur={cur} note={`${overdue.length} invoice${overdue.length === 1 ? "" : "s"}`} tone={overdue.length ? "bad" : ""} />
        <Kpi label="Collected" sum={colS} cur={cur} note={`${invoices.filter((i) => i.status === "PAID").length} paid`} tone="good" />
        <div className="kpi">
          <span>Waiting on you</span>
          <b>{drafts.length}</b>
          <em>to approve or send</em>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Receivables by age</h2>
          <span className="muted sm-text">
            {outS.converted ? "≈ " : ""}
            {money(outstanding, cur)} outstanding{outS.converted && fx ? ` · in ${cur} at ${fx.date} rates` : ""}
          </span>
        </div>
        <div className="aging" role="img" aria-label="Outstanding amount by days overdue">
          {aging.map((b) =>
            b.amount > 0 ? <div key={b.key} className={`seg-${b.key}`} style={{ flexGrow: b.amount / agingTotal }} title={`${b.label}: ${money(b.amount, cur)}`} /> : null,
          )}
        </div>
        <div className="aging-legend">
          {aging.map((b) => (
            <span key={b.key}>
              <i className={`seg-${b.key}`} /> {b.label} <b>{money(b.amount, cur)}</b>
            </span>
          ))}
        </div>
      </section>

      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <h2>Needs your attention</h2>
            <Link href="/followups" className="link">
              All follow-ups <ArrowRight size={14} />
            </Link>
          </div>
          {attention.length === 0 ? (
            <Empty title="All clear" art={<EmptyArt kind="clear" />}>
              Nothing to approve and nobody to chase.
            </Empty>
          ) : (
            <ul className="rows">
              {attention.slice(0, 6).map(({ inv, a }) => (
                <li key={inv.id}>
                  <Link href={`/invoices/${inv.id}`} className="row-link">
                    <Avatar name={inv.client.name} />
                    <div className="row-main">
                      <b>
                        {inv.client.name}
                        {inv.client.company ? <span className="muted"> · {inv.client.company}</span> : null}
                      </b>
                      <span className="muted sm-text">
                        <span className="num">{inv.number}</span> · {a.label}
                      </span>
                    </div>
                    <div className="row-end">
                      <span className="amount">{money(inv.total, inv.currency)}</span>
                      <StagePill action={a.action} label={ACTION_BTN[a.action] ?? a.label} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Recent activity</h2>
            <Link href="/activity" className="link">
              View log <ArrowRight size={14} />
            </Link>
          </div>
          <ul className="timeline">
            {activity.slice(0, 7).map((e) => (
              <li key={e.id} className={`t-${e.actor}`}>
                <i />
                <div>
                  <p>{e.message}</p>
                  <span className="muted sm-text">
                    {e.actor === "ai" ? "AI" : e.actor === "paypal" ? "PayPal" : e.actor === "you" ? "You" : "System"} · {ago(e.at)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

function Kpi({ label, sum, cur, note, tone = "" }: { label: string; sum: ReturnType<typeof sumByCurrency>; cur: string; note: string; tone?: string }) {
  const others = sum.parts.filter(([c]) => c !== cur);
  return (
    <div className={`kpi ${tone}`}>
      <span>{label}</span>
      <b>
        {sum.converted ? <small className="approx">≈</small> : null}
        {money(sum.home, cur)}
      </b>
      <em>
        {note}
        {others.length > 0 && (
          <span className="cur-parts" title="Exact amounts per currency">
            {sum.parts.map(([c, a]) => (
              <i key={c}>{money(a, c)}</i>
            ))}
          </span>
        )}
      </em>
    </div>
  );
}
