import { withSession, body, HttpError } from "@/lib/session";
import { runAgent, type ChatTurn } from "@/lib/agent";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const POST = withSession(
  async (req, s) => {
    const { messages } = await body<{ messages?: ChatTurn[] }>(req, 60_000);
    if (!Array.isArray(messages) || !messages.length) throw new HttpError(400, "Say something to the assistant.");
    const history = messages
      .slice(-12)
      .map((m) => ({ role: m.role === "model" ? ("model" as const) : ("user" as const), text: String(m.text ?? "").slice(0, 8000) }))
      .filter((m) => m.text.trim());
    if (history[history.length - 1]?.role !== "user") throw new HttpError(400, "The last message must be yours.");
    return Response.json(await runAgent(s, history));
  },
  { limit: [20, 60_000] },
);
