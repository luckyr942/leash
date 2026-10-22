// PayPal's official Agent Toolkit, plugged into the Gemini assistant (live mode only).
// We expose READ-ONLY invoicing tools so the assistant can answer from your real PayPal account
// (list, get, search, QR code). Anything that moves money or messages a client stays behind Leash's Confirm cards.
import type { FunctionDeclaration } from "@google/genai";
import { paypalConfigured } from "./paypal";

const PREFIX = "paypal_";
type Toolkit = {
  getTools(): { function: { name: string; description?: string; parameters?: Record<string, unknown> } }[];
  handleToolCall(c: { id: string; type: "function"; function: { name: string; arguments: string } }): Promise<{ content: unknown }>;
};
let kit: Promise<Toolkit | null> | null = null;

function load(): Promise<Toolkit | null> {
  if (!paypalConfigured()) return Promise.resolve(null);
  kit ??= import("@paypal/agent-toolkit/openai")
    .then(
      ({ PayPalAgentToolkit }) =>
        new PayPalAgentToolkit({
          clientId: process.env.PAYPAL_CLIENT_ID!,
          clientSecret: process.env.PAYPAL_CLIENT_SECRET!,
          configuration: {
            actions: { invoices: { list: true, get: true, search: true, generateQRC: true } },
            context: { sandbox: process.env.PAYPAL_ENV !== "live" },
          },
        }) as unknown as Toolkit,
    )
    .catch(() => null);
  return kit;
}

/** Gemini function declarations for the toolkit tools (empty when PayPal keys aren't set). */
export async function paypalToolDecls(): Promise<FunctionDeclaration[]> {
  const k = await load();
  if (!k) return [];
  return k.getTools().map((t) => ({
    name: PREFIX + t.function.name,
    description: `[PayPal account, read-only] ${(t.function.description ?? "").trim()}`.slice(0, 900),
    parametersJsonSchema: t.function.parameters ?? { type: "object", properties: {} },
  }));
}

export const isPayPalTool = (name: string) => name.startsWith(PREFIX);

export async function callPayPalTool(name: string, args: unknown): Promise<unknown> {
  const k = await load();
  if (!k) return { error: "PayPal isn't connected (demo mode)." };
  const r = await k.handleToolCall({ id: `call_${Date.now()}`, type: "function", function: { name: name.slice(PREFIX.length), arguments: JSON.stringify(args ?? {}) } });
  const text = typeof r.content === "string" ? r.content : JSON.stringify(r.content);
  return text.length > 6000 ? `${text.slice(0, 6000)}… (truncated)` : text;
}
