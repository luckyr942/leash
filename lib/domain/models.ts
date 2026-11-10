// Domain model: the entities Leash works with. Pure types (plus one default), safe for client and server.
import type { Stage } from "./rules";

export type InvoiceItem = { name: string; quantity: number; unitPrice: number };

/** Stored status. "Overdue" is derived: SENT and past its due date. */
export type InvoiceStatus = "DRAFT" | "APPROVED" | "SENT" | "PAID" | "CANCELLED";

export type Channel = "paypal" | "email" | "whatsapp" | "sms" | "telegram" | "copy";
export type { Stage };

export type Reminder = { at: string; stage: Stage; channel: Channel };

export type Client = { name: string; email: string; phone?: string; company?: string; telegramChatId?: string; telegramHandle?: string };

export type Invoice = {
  id: string;
  number: string;
  createdAt: string;
  updatedAt: string;
  status: InvoiceStatus;
  client: Client;
  description: string;
  items: InvoiceItem[];
  currency: string;
  total: number;
  dueDate: string; // YYYY-MM-DD
  note: string;
  source: "chat" | "manual";
  simulated?: boolean;
  paypalInvoiceId?: string;
  payUrl?: string;
  approvedAt?: string;
  sentAt?: string;
  paidAt?: string;
  reminders: Reminder[];
  escalatedAt?: string;
  payToken?: string; // demo mode: secret for the simulated client pay page
  error?: string;
};

export type Actor = "you" | "ai" | "paypal" | "system";

export type Activity = {
  id: string;
  at: string;
  type: string; // created | approved | sent | reminder_suggested | reminder_sent | paid | status | cancelled | escalated | extracted
  actor: Actor;
  message: string;
  invoiceId?: string;
  invoiceNumber?: string;
};

export type InboxSource = "telegram" | "email" | "whatsapp" | "paste";

export type InboxItem = {
  id: string;
  source: InboxSource;
  externalId: string; // telegram chat id, email message-id, import hash
  at: string;
  fromName: string;
  handle: string; // email address, telegram @user / chat id, phone
  subject: string;
  text: string; // the conversation (latest messages, oldest first)
  invoiceId?: string; // set once an invoice was drafted from it
};

export type Profile = { yourName: string; business: string; email: string; currency: string; defaultDueDays: number };

export const DEFAULT_PROFILE: Profile = { yourName: "Alex Rivera", business: "Rivera Studio", email: "", currency: "USD", defaultDueDays: 14 };
