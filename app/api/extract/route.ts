import { withSession, body, HttpError } from "@/lib/session";
import { extractInvoice } from "@/lib/extract";

// Paste a client conversation, get invoice fields back for review. Nothing is saved or sent.
export const POST = withSession(
  async (req, s) => {
    const { conversation } = await body<{ conversation?: unknown }>(req, 20_000);
    if (typeof conversation !== "string" || conversation.trim().length < 10) throw new HttpError(400, "Paste the conversation with your client first.");
    if (conversation.length > 12_000) throw new HttpError(400, "That's a long conversation. Paste just the messages about the work and price.");
    try {
      const extracted = await extractInvoice(conversation.trim());
      s.log({ type: "extracted", actor: "ai", message: `AI read a conversation and suggested an invoice for ${extracted.clientName || "a client"}` });
      return Response.json({ extracted, defaultDueDays: s.getProfile().defaultDueDays });
    } catch (e) {
      throw new HttpError(502, e instanceof Error ? e.message : "Couldn't read that conversation");
    }
  },
  { limit: [12, 60_000] },
);
