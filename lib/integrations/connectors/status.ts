import type { TelegramConfig } from "./telegram";
import type { EmailConfig } from "./email";

/** Public status for the UI (never includes tokens or passwords). */
export function connectorStatus(s: { getConnector<T>(k: string): T | null }) {
  const tg = s.getConnector<TelegramConfig>("telegram");
  const em = s.getConnector<EmailConfig>("email");
  return {
    telegram: tg ? { connected: true, username: tg.username } : { connected: false },
    email: em ? { connected: true, user: em.user, provider: em.provider } : { connected: false },
  };
}
