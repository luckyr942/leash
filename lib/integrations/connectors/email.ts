// Email connector: your own mailbox (Gmail, Outlook, Zoho or any IMAP/SMTP) with an app password.
// Sends reminders from your address and pulls recent emails (incl. Upwork/Fiverr/Instagram notifications) into the Inbox.
import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import type { Store } from "@/lib/server/db";

export type EmailConfig = {
  provider: string;
  user: string;
  pass: string;
  fromName: string;
  smtpHost: string;
  smtpPort: number;
  imapHost: string;
  imapPort: number;
  connectedAt: string;
};

export const PRESETS: Record<string, { smtpHost: string; smtpPort: number; imapHost: string; imapPort: number; help: string }> = {
  gmail: {
    smtpHost: "smtp.gmail.com",
    smtpPort: 465,
    imapHost: "imap.gmail.com",
    imapPort: 993,
    help: "Google Account → Security → 2-Step Verification → App passwords",
  },
  outlook: {
    smtpHost: "smtp.office365.com",
    smtpPort: 587,
    imapHost: "outlook.office365.com",
    imapPort: 993,
    help: "Microsoft account → Security → App passwords",
  },
  zoho: { smtpHost: "smtp.zoho.com", smtpPort: 465, imapHost: "imap.zoho.com", imapPort: 993, help: "Zoho Mail → Security → App passwords" },
  yahoo: {
    smtpHost: "smtp.mail.yahoo.com",
    smtpPort: 465,
    imapHost: "imap.mail.yahoo.com",
    imapPort: 993,
    help: "Yahoo account → Security → Generate app password",
  },
};

const transport = (c: EmailConfig) =>
  nodemailer.createTransport({
    host: c.smtpHost,
    port: c.smtpPort,
    secure: c.smtpPort === 465,
    auth: { user: c.user, pass: c.pass },
    connectionTimeout: 15_000,
  });

const imap = (c: EmailConfig) =>
  new ImapFlow({ host: c.imapHost, port: c.imapPort, secure: true, auth: { user: c.user, pass: c.pass }, logger: false, socketTimeout: 30_000 });

export async function connectEmail(
  s: Store,
  input: { provider: string; user: string; pass: string; fromName: string; smtpHost?: string; smtpPort?: number; imapHost?: string; imapPort?: number },
): Promise<EmailConfig> {
  const preset = PRESETS[input.provider];
  const cfg: EmailConfig = {
    provider: input.provider,
    user: input.user.trim(),
    pass: input.pass.replace(/\s+/g, ""), // Google shows app passwords in groups of 4
    fromName: input.fromName.trim().slice(0, 80),
    smtpHost: preset?.smtpHost ?? String(input.smtpHost ?? ""),
    smtpPort: preset?.smtpPort ?? Number(input.smtpPort ?? 465),
    imapHost: preset?.imapHost ?? String(input.imapHost ?? ""),
    imapPort: preset?.imapPort ?? Number(input.imapPort ?? 993),
    connectedAt: new Date().toISOString(),
  };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cfg.user)) throw new Error("Enter your full email address.");
  if (!cfg.pass) throw new Error("Enter an app password (not your normal password).");
  if (!cfg.smtpHost || !cfg.imapHost) throw new Error("Enter the SMTP and IMAP servers.");
  try {
    await transport(cfg).verify();
  } catch (e) {
    throw new Error(`Couldn't sign in to send mail: ${e instanceof Error ? e.message : e}. Use an app password.`);
  }
  const client = imap(cfg);
  try {
    await client.connect();
    await client.logout();
  } catch (e) {
    throw new Error(`Sending works, but reading the inbox failed: ${e instanceof Error ? e.message : e}. Is IMAP enabled?`);
  }
  s.setConnector("email", cfg);
  s.log({ type: "status", actor: "you", message: `You connected email ${cfg.user}` });
  return cfg;
}

export async function sendEmail(s: Store, to: string, subject: string, text: string) {
  const c = s.getConnector<EmailConfig>("email");
  if (!c) throw new Error("Email isn't connected.");
  await transport(c).sendMail({ from: { name: c.fromName || c.user, address: c.user }, to, subject, text, replyTo: c.user });
}

/** Import the latest emails from INBOX. Returns how many were added or updated. */
export async function syncEmail(s: Store, limit = 25): Promise<number> {
  const c = s.getConnector<EmailConfig>("email");
  if (!c) throw new Error("Email isn't connected.");
  const client = imap(c);
  await client.connect();
  let count = 0;
  try {
    const box = await client.mailboxOpen("INBOX", { readOnly: true });
    if (!box.exists) return 0;
    const from = Math.max(1, box.exists - limit + 1);
    for await (const msg of client.fetch(`${from}:*`, { envelope: true, source: true, internalDate: true })) {
      if (!msg.source) continue;
      const parsed = await simpleParser(msg.source);
      const sender = parsed.from?.value?.[0];
      if (!sender?.address || sender.address.toLowerCase() === c.user.toLowerCase()) continue;
      // Keep the new part of the message, drop long quoted history.
      const body = (parsed.text ?? "")
        .split(/\n(?:On .+wrote:|-{2,} ?Original Message|From: .+\nSent:)/)[0]
        .trim()
        .slice(0, 4000);
      s.upsertInbox({
        source: "email",
        externalId: parsed.messageId ?? `${sender.address}-${msg.uid}`,
        at: (parsed.date ?? (msg.internalDate instanceof Date ? msg.internalDate : new Date())).toISOString(),
        fromName: sender.name || sender.address,
        handle: sender.address,
        subject: parsed.subject ?? "(no subject)",
        text: `From: ${sender.name ? `${sender.name} <${sender.address}>` : sender.address}\nSubject: ${parsed.subject ?? ""}\n\n${body}`,
      });
      count++;
    }
  } finally {
    await client.logout().catch(() => {});
  }
  return count;
}
