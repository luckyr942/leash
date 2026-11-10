"use client";
import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/components/layout/AppProvider";
import { PageHead, Empty } from "@/components/ui/Primitives";
import { EmptyArt } from "@/components/brand/Art";

const FILTERS = [
  ["all", "Everything"],
  ["you", "Your approvals"],
  ["ai", "AI suggestions"],
  ["paypal", "PayPal events"],
] as const;

export default function ActivityPage() {
  const { state } = useApp();
  const [f, setF] = useState<string>("all");
  if (!state) return null;
  const list = state.activity.filter((a) => f === "all" || a.actor === f);
  const fmt = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <>
      <PageHead title="Activity" sub="Every AI suggestion, every approval and every PayPal event, in order. The AI can't act without leaving a trace here." />
      <section className="card">
        <div className="seg" role="tablist" aria-label="Filter activity">
          {FILTERS.map(([k, label]) => (
            <button key={k} role="tab" aria-selected={f === k} className={f === k ? "on" : ""} onClick={() => setF(k)}>
              {label}
            </button>
          ))}
        </div>
        {list.length === 0 ? (
          <Empty title="Nothing yet" art={<EmptyArt kind="activity" />} />
        ) : (
          <ul className="log">
            {list.map((e) => (
              <li key={e.id}>
                <span className={`who w-${e.actor}`}>{e.actor === "ai" ? "AI" : e.actor === "paypal" ? "PayPal" : e.actor === "you" ? "You" : "System"}</span>
                <p>{e.message}</p>
                {e.invoiceId ? (
                  <Link href={`/invoices/${e.invoiceId}`} className="mono log-ref">
                    {e.invoiceNumber}
                  </Link>
                ) : (
                  <span />
                )}
                <time dateTime={e.at} className="muted sm-text">
                  {fmt(e.at)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
