"use client";
// Shared client state for the app pages: workspace data, toasts and a JSON POST helper.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { State } from "@/lib/domain/state";

type Ctx = {
  state: State | null;
  refresh: () => Promise<void>;
  toast: (msg: string) => void;
  // JSON from our own API routes; each page reads the fields its route returns.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  call: (url: string, data?: unknown, method?: string) => Promise<{ ok: boolean; body: any }>;
};

const AppCtx = createContext<Ctx | null>(null);

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp must be used inside AppProvider");
  return c;
}

export default function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toast = useCallback((m: string) => setToastMsg(m), []);

  const refresh = useCallback(async () => {
    const r = await fetch("/api/state", { cache: "no-store" });
    if (r.ok) setState(await r.json());
    else setToastMsg((await r.json().catch(() => ({}))).error ?? "Couldn't load your workspace");
  }, []);

  // JSON helper; if the session expired, re-open the workspace and retry once.
  const call = useCallback(
    async (url: string, data?: unknown, method = "POST") => {
      const send = () => fetch(url, { method, headers: { "Content-Type": "application/json" }, body: data === undefined ? undefined : JSON.stringify(data) });
      let r = await send();
      if (r.status === 401) {
        await refresh();
        r = await send();
      }
      const body = await r.json().catch(() => ({}));
      if (!r.ok && body.error) setToastMsg(body.error);
      return { ok: r.ok, body };
    },
    [refresh],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 4000);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const value = useMemo(() => ({ state, refresh, toast, call }), [state, refresh, toast, call]);
  return (
    <AppCtx.Provider value={value}>
      {children}
      {toastMsg && (
        <div className="toast" role="status" aria-live="polite">
          {toastMsg}
        </div>
      )}
    </AppCtx.Provider>
  );
}
