import { withSession, body } from "@/lib/server/session";
import { HttpError } from "@/lib/server/errors";
import { connectTelegram, syncTelegram } from "@/lib/integrations/connectors/telegram";
import { connectEmail, syncEmail, sendEmail, type EmailConfig } from "@/lib/integrations/connectors/email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const fail = (e: unknown) => new HttpError(400, e instanceof Error ? e.message : String(e));

// connect | disconnect | sync | test for "telegram" and "email". Secrets never leave the server.
export const POST = withSession(
  async (req, s) => {
    const b = await body<Record<string, unknown>>(req, 10_000);
    const kind = String(b.kind);
    const action = String(b.action);
    if (kind !== "telegram" && kind !== "email") throw new HttpError(400, "Unknown connector");

    if (action === "disconnect") {
      s.removeConnector(kind);
      s.log({ type: "status", actor: "you", message: `You disconnected ${kind === "email" ? "email" : "Telegram"}` });
      return Response.json({ ok: true });
    }
    try {
      if (kind === "telegram") {
        if (action === "connect") {
          const c = await connectTelegram(s, String(b.token ?? ""));
          return Response.json({ ok: true, username: c.username });
        }
        if (action === "sync") return Response.json({ ok: true, count: await syncTelegram(s, s.getProfile().business || s.getProfile().yourName) });
      }
      if (kind === "email") {
        if (action === "connect") {
          const c = await connectEmail(s, {
            provider: String(b.provider ?? "gmail"),
            user: String(b.user ?? ""),
            pass: String(b.pass ?? ""),
            fromName: String(b.fromName ?? s.getProfile().yourName),
            smtpHost: b.smtpHost ? String(b.smtpHost) : undefined,
            smtpPort: b.smtpPort ? Number(b.smtpPort) : undefined,
            imapHost: b.imapHost ? String(b.imapHost) : undefined,
            imapPort: b.imapPort ? Number(b.imapPort) : undefined,
          });
          return Response.json({ ok: true, user: c.user });
        }
        if (action === "sync") return Response.json({ ok: true, count: await syncEmail(s) });
        if (action === "test") {
          const c = s.getConnector<EmailConfig>("email");
          if (!c) throw new Error("Email isn't connected.");
          await sendEmail(s, c.user, "Leash test email", "It works! Leash can send reminders from this address.");
          return Response.json({ ok: true });
        }
      }
    } catch (e) {
      throw fail(e);
    }
    throw new HttpError(400, "Unknown action");
  },
  { limit: [20, 60_000] },
);
