import { createHash } from "node:crypto";
import { withSession, body } from "@/lib/server/session";
import { HttpError } from "@/lib/server/errors";
import { parseWhatsAppExport } from "@/lib/integrations/connectors/whatsapp";

export const dynamic = "force-dynamic";

export const GET = withSession((_req, s) => Response.json({ inbox: s.inbox(100) }));

// import_whatsapp | add_paste | delete
export const POST = withSession(
  async (req, s) => {
    const b = await body<{ action?: string; text?: string; id?: string; source?: string; from?: string }>(req, 600_000);
    if (b.action === "delete") {
      s.deleteInbox(String(b.id ?? ""));
      return Response.json({ ok: true });
    }
    const text = String(b.text ?? "");
    if (text.trim().length < 10) throw new HttpError(400, "Nothing to import.");
    const hash = createHash("sha256").update(text).digest("hex").slice(0, 16);

    if (b.action === "import_whatsapp") {
      let chat;
      try {
        chat = parseWhatsAppExport(text, s.getProfile().yourName);
      } catch (e) {
        throw new HttpError(400, e instanceof Error ? e.message : "Couldn't read that file");
      }
      const item = s.upsertInbox({
        source: "whatsapp",
        externalId: hash,
        at: new Date().toISOString(),
        fromName: chat.client,
        handle: chat.phone,
        subject: `WhatsApp chat · ${chat.lines.length} messages`,
        text: chat.lines.join("\n"),
      });
      s.log({ type: "status", actor: "you", message: `You imported a WhatsApp chat with ${chat.client}` });
      return Response.json({ item });
    }
    if (b.action === "add_paste") {
      // Instagram, Upwork, Fiverr, LinkedIn… (no public DM APIs): paste the conversation and tag where it came from.
      const label = String(b.source ?? "Pasted").slice(0, 30);
      const item = s.upsertInbox({
        source: "paste",
        externalId: hash,
        at: new Date().toISOString(),
        fromName: String(b.from ?? "").slice(0, 80) || "Client",
        handle: "",
        subject: `${label} conversation`,
        text: text.slice(0, 12_000),
      });
      return Response.json({ item });
    }
    throw new HttpError(400, "Unknown action");
  },
  { limit: [30, 60_000] },
);
