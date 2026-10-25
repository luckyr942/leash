// Telegram connector (free Bot API).
// Clients can message your bot, or you can forward a client's messages to it; Leash pulls them into the Inbox.
// Reminders can then be sent back to that client's chat with one tap.
import type { Store } from "../store";

export type TelegramConfig = { token: string; username: string; offset: number; connectedAt: string };

const api = async <T = any>(token: string, method: string, body?: object): Promise<T> => {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; result?: T; description?: string };
  if (!json.ok) throw new Error(json.description ? `Telegram: ${json.description}` : `Telegram error ${res.status}`);
  return json.result as T;
};

export async function connectTelegram(s: Store, token: string): Promise<TelegramConfig> {
  if (!/^\d{5,}:[A-Za-z0-9_-]{30,}$/.test(token.trim())) throw new Error("That doesn't look like a bot token. Get one from @BotFather in Telegram.");
  const me = await api<{ username: string }>(token.trim(), "getMe");
  await api(token.trim(), "deleteWebhook", { drop_pending_updates: false }); // we poll; a leftover webhook would block polling
  const cfg: TelegramConfig = { token: token.trim(), username: me.username, offset: 0, connectedAt: new Date().toISOString() };
  s.setConnector("telegram", cfg);
  s.log({ type: "status", actor: "you", message: `You connected Telegram bot @${me.username}` });
  return cfg;
}

type TgUser = { id: number; first_name?: string; last_name?: string; username?: string };
type TgMessage = {
  message_id: number;
  date: number;
  chat: { id: number; type: string; first_name?: string; last_name?: string; username?: string; title?: string };
  from?: TgUser;
  text?: string;
  caption?: string;
  forward_origin?: { type: string; sender_user?: TgUser; sender_user_name?: string; chat?: { title?: string } };
};

const nameOf = (u?: { first_name?: string; last_name?: string; username?: string }) =>
  [u?.first_name, u?.last_name].filter(Boolean).join(" ") || (u?.username ? `@${u.username}` : "Unknown");

/** Pull new messages into the Inbox. Returns how many messages arrived. */
export async function syncTelegram(s: Store, profileName: string): Promise<number> {
  const cfg = s.getConnector<TelegramConfig>("telegram");
  if (!cfg) throw new Error("Telegram isn't connected.");
  const updates = await api<{ update_id: number; message?: TgMessage }[]>(cfg.token, "getUpdates", {
    offset: cfg.offset,
    timeout: 0,
    allowed_updates: ["message"],
  });
  let count = 0;
  for (const u of updates) {
    const m = u.message;
    if (!m) continue;
    const text = (m.text ?? m.caption ?? "").trim();
    if (!text) continue;
    if (text === "/start") {
      // A client opened your bot: greet them and record the chat so reminders can reach them.
      await api(cfg.token, "sendMessage", {
        chat_id: m.chat.id,
        text: `Hi ${m.from?.first_name ?? "there"}! You're connected to ${profileName}. Invoices and payment links will arrive here.`,
      }).catch(() => {});
    }
    const forwarded = m.forward_origin;
    // If you forwarded a client's message, attribute it to them; otherwise it's the chat partner.
    const speaker = forwarded ? forwarded.sender_user ? nameOf(forwarded.sender_user) : forwarded.sender_user_name ?? forwarded.chat?.title ?? "Client" : nameOf(m.from);
    const key = forwarded ? `fwd-${m.chat.id}-${speaker}` : String(m.chat.id);
    const prev = s.inbox(200).find((i) => i.source === "telegram" && i.externalId === key);
    const lines = [...(prev?.text ? prev.text.split("\n") : []), `${speaker}: ${text === "/start" ? "(started the chat)" : text}`].slice(-60);
    s.upsertInbox({
      source: "telegram",
      externalId: key,
      at: new Date(m.date * 1000).toISOString(),
      fromName: speaker,
      handle: forwarded ? "forwarded to your bot" : String(m.chat.id),
      subject: forwarded ? "Forwarded conversation" : m.from?.username ? `@${m.from.username}` : "Telegram chat",
      text: lines.join("\n"),
    });
    count++;
  }
  if (updates.length) s.setConnector("telegram", { ...cfg, offset: updates[updates.length - 1].update_id + 1 });
  return count;
}

export async function sendTelegram(s: Store, chatId: string, text: string) {
  const cfg = s.getConnector<TelegramConfig>("telegram");
  if (!cfg) throw new Error("Telegram isn't connected.");
  if (!/^-?\d+$/.test(chatId)) throw new Error("This client hasn't messaged your Telegram bot yet.");
  await api(cfg.token, "sendMessage", { chat_id: Number(chatId), text: text.slice(0, 4000), disable_web_page_preview: false });
}
