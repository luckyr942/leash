import { createWorkspace, store, type Store } from "@/lib/server/db";
import { seedSampleMonth } from "@/lib/server/seed";

/** A fresh, empty workspace. */
export const emptyWorkspace = (): Store => store(createWorkspace());

/** A workspace with the sample month (one invoice at every stage). */
export function sampleWorkspace(): Store {
  const s = emptyWorkspace();
  seedSampleMonth(s, "http://localhost:3000");
  return s;
}

export const draftInput = (overrides: Record<string, unknown> = {}) => ({
  client: { name: "Ada Lovelace", email: "ada@example.com" },
  description: "Logo design",
  items: [{ name: "Logo design", quantity: 1, unitPrice: 12.5 }],
  currency: "USD",
  dueDate: "2026-12-01",
  note: "Thanks!",
  ...overrides,
});

type Call = { url: string; method: string; headers: Record<string, string>; body: unknown };

/** Replace global fetch with a scripted fake. The handler sees each call and returns a Response. */
export function mockFetch(handler: (call: Call, n: number) => Response | Promise<Response>) {
  const calls: Call[] = [];
  globalThis.fetch = (async (input: string | URL | Request, init: RequestInit = {}) => {
    const raw = init.body ? String(init.body) : "";
    const call: Call = {
      url: String(input),
      method: init.method ?? "GET",
      headers: Object.fromEntries(new Headers(init.headers).entries()),
      body: raw.startsWith("{") ? JSON.parse(raw) : raw,
    };
    calls.push(call);
    return handler(call, calls.length);
  }) as typeof fetch;
  return calls;
}

export const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
