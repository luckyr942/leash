"use client";
import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/components/layout/AppProvider";
import FollowUp from "@/components/invoice/FollowUp";
import { Avatar, PageHead, StagePill, Empty } from "@/components/ui/Primitives";
import { EmptyArt } from "@/components/brand/Art";
import { ArrowRight } from "@/components/ui/Icons";
import { assess, STAGE_LABEL } from "@/lib/domain/rules";
import { money, day } from "@/lib/domain/format";

const RULES = [
  ["Not yet due", "Wait", "wait"],
  ["1–7 days overdue", "Friendly reminder", "friendly"],
  ["8–21 days overdue", "Firm reminder", "firm"],
  ["22–30 days overdue", "Final notice", "final"],
  ["30+ days overdue", "Talk to the client", "escalate"],
];

export default function FollowUps() {
  const { state } = useApp();
  const [open, setOpen] = useState<string | null>(null);
  if (!state) return null;
  const items = state.invoices
    .filter((i) => i.status === "SENT")
    .map((inv) => ({ inv, a: assess(inv) }))
    .sort((x, y) => y.a.severity - x.a.severity || y.a.daysOverdue - x.a.daysOverdue);
  const act = items.filter((x) => x.a.severity >= 3);
  const waiting = items.filter((x) => x.a.severity < 3);

  return (
    <>
      <PageHead
        title="Follow-ups"
        sub="Rules decide when to chase; AI writes the message; you approve every send with one tap. Leash never contacts a client on its own."
      />
      <div className="grid-fu">
        <section className="card">
          <div className="card-head">
            <h2>Ready for your approval {act.length > 0 && <span className="count">{act.length}</span>}</h2>
          </div>
          {act.length === 0 ? (
            <Empty title="Nobody to chase" art={<EmptyArt kind="clear" />}>
              No invoice is overdue enough to need a reminder today.
            </Empty>
          ) : (
            <ul className="fu-list">
              {act.map(({ inv, a }) => (
                <li key={inv.id} className={open === inv.id ? "open" : ""}>
                  <button className="fu-row" onClick={() => setOpen(open === inv.id ? null : inv.id)} aria-expanded={open === inv.id}>
                    <Avatar name={inv.client.name} />
                    <div className="row-main">
                      <b>
                        {inv.client.name}
                        {inv.client.company ? <span className="muted"> · {inv.client.company}</span> : null}
                      </b>
                      <span className="muted sm-text">
                        <span className="num">{inv.number}</span> · due {day(inv.dueDate)} · {inv.reminders.length} reminder
                        {inv.reminders.length === 1 ? "" : "s"} sent
                      </span>
                    </div>
                    <div className="row-end">
                      <span className="amount">{money(inv.total, inv.currency)}</span>
                      <StagePill action={a.action} label={`${a.label} · ${STAGE_LABEL[a.action as "FIRM"]}`} />
                    </div>
                  </button>
                  {open === inv.id && (
                    <div className="fu-body">
                      <FollowUp inv={inv} />
                      <Link className="link" href={`/invoices/${inv.id}`}>
                        Open invoice <ArrowRight size={13} />
                      </Link>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {waiting.length > 0 && (
            <>
              <div className="card-head" style={{ marginTop: 22 }}>
                <h2>Waiting</h2>
              </div>
              <ul className="rows">
                {waiting.map(({ inv, a }) => (
                  <li key={inv.id}>
                    <Link href={`/invoices/${inv.id}`} className="row-link">
                      <Avatar name={inv.client.name} size={30} />
                      <div className="row-main">
                        <b>{inv.client.name}</b>
                        <span className="muted sm-text">{a.reason}</span>
                      </div>
                      <div className="row-end">
                        <span className="amount">{money(inv.total, inv.currency)}</span>
                        <StagePill action={a.action} label={a.label} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <aside className="card rules-card">
          <div className="card-head">
            <h2>How Leash decides</h2>
          </div>
          <table className="rules-table">
            <tbody>
              {RULES.map(([when, what, k]) => (
                <tr key={k}>
                  <td>{when}</td>
                  <td>
                    <span className={`pill a-${k}`}>{what}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="bullets">
            <li>One reminder per stage, at least 3 days apart.</li>
            <li>Plain code picks the step. AI only explains it and drafts the words.</li>
            <li>After 30 days Leash stops emailing and suggests a direct conversation.</li>
            <li>Every suggestion and send is in the Activity log.</li>
          </ul>
        </aside>
      </div>
    </>
  );
}
