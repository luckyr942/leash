"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, themeQuartz, colorSchemeLight, colorSchemeDark, type ColDef, type ICellRendererParams } from "ag-grid-community";
import type { Invoice } from "@/lib/store";
import { displayStatus, money2, shortDay, CHANNEL_TEXT } from "@/lib/format";
import { assess } from "@/lib/rules";
import { StatusPill, Avatar } from "./UI";

ModuleRegistry.registerModules([AllCommunityModule]);

type Row = Invoice & { display: ReturnType<typeof displayStatus>; next: string; lastReminder: string };

export default function InvoiceGrid({ invoices, filter, query }: { invoices: Invoice[]; filter: string; query: string }) {
  const router = useRouter();
  const grid = useRef<AgGridReact<Row>>(null);
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const read = () => setDark(el.dataset.theme === "dark");
    read();
    const mo = new MutationObserver(read);
    mo.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

  const rows = useMemo<Row[]>(
    () =>
      invoices.map((i) => {
        const last = [...i.reminders].sort((a, b) => b.at.localeCompare(a.at))[0];
        return { ...i, display: displayStatus(i), next: assess(i).label, lastReminder: last ? `${shortDay(last.at)} · ${CHANNEL_TEXT[last.channel]}` : "—" };
      }),
    [invoices],
  );

  const filterRef = useRef(filter);
  filterRef.current = filter;
  useEffect(() => grid.current?.api?.onFilterChanged(), [filter]);
  const isExternalFilterPresent = useCallback(() => filterRef.current !== "ALL", []);
  const doesExternalFilterPass = useCallback((n: { data?: Row }) => n.data?.display === filterRef.current, []);

  const theme = useMemo(
    () =>
      themeQuartz.withPart(dark ? colorSchemeDark : colorSchemeLight).withParams({
        fontFamily: "inherit",
        fontSize: 13.5,
        accentColor: "#111827",
        backgroundColor: dark ? "#161a22" : "#ffffff",
        headerBackgroundColor: dark ? "#161a22" : "#ffffff",
        headerTextColor: dark ? "#9ca3af" : "#6b7280",
        headerFontWeight: 500,
        borderColor: dark ? "#262b36" : "#eef0f3",
        rowBorder: { style: "solid", width: 1, color: dark ? "#262b36" : "#f1f2f4" },
        wrapperBorder: false,
        headerColumnBorder: false,
        rowHoverColor: dark ? "rgba(110, 193, 255,.06)" : "#F7FAFD",
        rowHeight: 56,
        headerHeight: 42,
        spacing: 8,
      }),
    [dark],
  );

  const cols = useMemo<ColDef<Row>[]>(
    () => [
      {
        headerName: "Client",
        field: "client.name",
        flex: 1.6,
        minWidth: 220,
        cellRenderer: (p: ICellRendererParams<Row>) =>
          p.data ? (
            <div className="cell-client">
              <Avatar name={p.data.client.name} size={30} />
              <span>
                <b>{p.data.client.name}</b>
                <small>{p.data.client.company || p.data.client.email}</small>
              </span>
            </div>
          ) : null,
      },
      { headerName: "Invoice", field: "number", width: 140, cellClass: "num" },
      { headerName: "Amount", field: "total", width: 130, type: "rightAligned", cellClass: "amount", valueFormatter: (p) => (p.data ? money2(p.data.total, p.data.currency) : "") },
      { headerName: "Due", field: "dueDate", width: 110, sort: "asc", valueFormatter: (p) => shortDay(p.value) },
      { headerName: "Status", field: "display", width: 125, cellRenderer: (p: ICellRendererParams<Row>) => (p.value ? <StatusPill status={p.value} /> : null) },
      { headerName: "Next step", field: "next", flex: 1, minWidth: 170 },
      { headerName: "Last reminder", field: "lastReminder", width: 160 },
      { headerName: "Source", field: "source", width: 100, valueFormatter: (p) => (p.value === "chat" ? "AI · chat" : "Manual") },
    ],
    [],
  );

  return (
    <div className="grid-wrap">
      <AgGridReact<Row>
        ref={grid}
        theme={theme}
        rowData={rows}
        columnDefs={cols}
        getRowId={(p) => p.data.id}
        defaultColDef={{ sortable: true, resizable: true }}
        quickFilterText={query}
        isExternalFilterPresent={isExternalFilterPresent}
        doesExternalFilterPass={doesExternalFilterPass}
        onRowClicked={(e) => e.data && router.push(`/invoices/${e.data.id}`)}
        rowClass="clickable"
        pagination
        paginationPageSize={20}
        paginationPageSizeSelector={false}
        overlayNoRowsTemplate="No invoices here yet."
      />
    </div>
  );
}
