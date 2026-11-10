"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/components/layout/AppProvider";
import { PageHead } from "@/components/ui/Primitives";
import { Plus, Search, Download } from "@/components/ui/Icons";
import { displayStatus, money2 } from "@/lib/domain/format";

// AG Grid is the heaviest dependency: load it after the page has painted.
const InvoiceGrid = dynamic(() => import("@/components/invoice/InvoiceGrid"), { ssr: false, loading: () => <div className="grid-wrap sk" /> });

const TABS = [
  ["ALL", "All"],
  ["DRAFT", "Drafts"],
  ["APPROVED", "Approved"],
  ["SENT", "Sent"],
  ["OVERDUE", "Overdue"],
  ["PAID", "Paid"],
  ["CANCELLED", "Cancelled"],
] as const;

export default function Invoices() {
  const { state } = useApp();
  const [tab, setTab] = useState<string>("ALL");
  const [q, setQ] = useState("");
  if (!state) return null;
  const list = state.invoices;
  const count = (k: string) => (k === "ALL" ? list.length : list.filter((i) => displayStatus(i) === k).length);

  function exportCsv() {
    const esc = (v: unknown) => {
      const s = v === undefined || v === null ? "" : String(v);
      return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`; // formula-safe
    };
    const head = ["Invoice", "Client", "Company", "Email", "Amount", "Currency", "Due", "Status", "Sent", "Paid", "Reminders", "PayPal id"];
    const rows = list.map((i) =>
      [
        i.number,
        i.client.name,
        i.client.company,
        i.client.email,
        i.total,
        i.currency,
        i.dueDate,
        displayStatus(i),
        i.sentAt?.slice(0, 10),
        i.paidAt?.slice(0, 10),
        i.reminders.length,
        i.paypalInvoiceId,
      ]
        .map(esc)
        .join(","),
    );
    const url = URL.createObjectURL(new Blob([[head.join(","), ...rows].join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `leash-invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const outstanding = list.filter((i) => i.status === "SENT").reduce((s, i) => s + i.total, 0);
  return (
    <>
      <PageHead title="Invoices" sub={`${list.length} invoices · ${money2(outstanding, state.profile.currency)} outstanding`}>
        <button className="btn ghost" onClick={exportCsv}>
          <Download size={15} /> Export CSV
        </button>
        <Link href="/new" className="btn primary">
          <Plus size={16} /> New invoice
        </Link>
      </PageHead>
      <section className="card flush">
        <div className="toolbar">
          <div className="seg" role="tablist" aria-label="Filter invoices">
            {TABS.map(([k, label]) => (
              <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
                {label} <span>{count(k)}</span>
              </button>
            ))}
          </div>
          <label className="search">
            <Search size={15} />
            <input placeholder="Search clients, numbers…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search invoices" />
          </label>
        </div>
        <InvoiceGrid invoices={list} filter={tab} query={q} />
      </section>
    </>
  );
}
