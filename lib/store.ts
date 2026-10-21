// SQLite storage (Node's built-in node:sqlite). Every visitor gets an isolated workspace.
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { seal, open } from "./secret";

export type InvoiceItem = { name: string; quantity: number; unitPrice: number };

/** Stored status. "Overdue" is derived: SENT and past its due date. */
export type InvoiceStatus = "DRAFT" | "APPROVED" | "SENT" | "PAID" | "CANCELLED";

export type Channel = "paypal" | "email" | "whatsapp" | "sms" | "telegram" | "copy";
export type Stage = "FRIENDLY" | "FIRM" | "FINAL" | "ESCALATE";

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

const DIR = process.env.LEASH_DATA_DIR ?? path.join(process.cwd(), "data");
let conn: DatabaseSync | null = null;

function db(): DatabaseSync {
  if (conn) return conn;
  fs.mkdirSync(DIR, { recursive: true });
  conn = new DatabaseSync(path.join(DIR, "leash.sqlite"));
  conn.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 3000;
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY, created_at TEXT NOT NULL, last_seen TEXT NOT NULL, profile TEXT NOT NULL DEFAULT '{}'
    );
    CREATE TABLE IF NOT EXISTS invoices2 (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL,
      paypal_invoice_id TEXT,
      data TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS inv2_ws ON invoices2(workspace_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS inv2_pp ON invoices2(paypal_invoice_id);
    CREATE TABLE IF NOT EXISTS activity (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      at TEXT NOT NULL,
      invoice_id TEXT,
      data TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS act_ws ON activity(workspace_id, at DESC);
    CREATE TABLE IF NOT EXISTS connectors (
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      sealed TEXT NOT NULL,          -- AES-256-GCM encrypted JSON (tokens, app passwords)
      updated_at TEXT NOT NULL,
      PRIMARY KEY (workspace_id, kind)
    );
    CREATE TABLE IF NOT EXISTS inbox (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      source TEXT NOT NULL,
      external_id TEXT NOT NULL,
      at TEXT NOT NULL,
      data TEXT NOT NULL,
      UNIQUE (workspace_id, source, external_id)
    );
    CREATE INDEX IF NOT EXISTS inbox_ws ON inbox(workspace_id, at DESC);
  `);
  return conn;
}

const now = () => new Date().toISOString();
const uid = () => randomUUID().replace(/-/g, "").slice(0, 8);

export function createWorkspace(): string {
  const id = randomUUID();
  db().prepare("INSERT INTO workspaces (id, created_at, last_seen, profile) VALUES (?, ?, ?, ?)").run(id, now(), now(), JSON.stringify(DEFAULT_PROFILE));
  return id;
}

export function workspaceExists(id: string): boolean {
  const row = db().prepare("SELECT 1 AS ok FROM workspaces WHERE id = ?").get(id);
  if (row) db().prepare("UPDATE workspaces SET last_seen = ? WHERE id = ?").run(now(), id);
  return Boolean(row);
}

export function findInvoiceByPayPalId(paypalId: string): { workspaceId: string; invoice: Invoice } | undefined {
  const row = db().prepare("SELECT workspace_id, data FROM invoices2 WHERE paypal_invoice_id = ?").get(paypalId) as
    | { workspace_id: string; data: string }
    | undefined;
  return row ? { workspaceId: row.workspace_id, invoice: JSON.parse(row.data) } : undefined;
}

/** Public pay page lookup (demo mode). The caller must also check the secret token. */
export function findInvoiceById(id: string): { workspaceId: string; invoice: Invoice } | undefined {
  const row = db().prepare("SELECT workspace_id, data FROM invoices2 WHERE id = ?").get(id) as { workspace_id: string; data: string } | undefined;
  return row ? { workspaceId: row.workspace_id, invoice: JSON.parse(row.data) } : undefined;
}

export function pruneWorkspaces(olderThanDays = 30) {
  const cutoff = new Date(Date.now() - olderThanDays * 86_400_000).toISOString();
  db().prepare("DELETE FROM workspaces WHERE last_seen < ?").run(cutoff);
}

export type Store = ReturnType<typeof store>;

export function store(workspaceId: string) {
  const d = db();
  return {
    id: workspaceId,

    getProfile(): Profile {
      const row = d.prepare("SELECT profile FROM workspaces WHERE id = ?").get(workspaceId) as { profile: string } | undefined;
      return { ...DEFAULT_PROFILE, ...(row ? JSON.parse(row.profile) : {}) };
    },
    setProfile(p: Profile) {
      d.prepare("UPDATE workspaces SET profile = ? WHERE id = ?").run(JSON.stringify(p), workspaceId);
    },

    invoices(limit = 300): Invoice[] {
      const rows = d
        .prepare("SELECT data FROM invoices2 WHERE workspace_id = ? ORDER BY created_at DESC LIMIT ?")
        .all(workspaceId, limit) as { data: string }[];
      return rows.map((r) => JSON.parse(r.data));
    },
    getInvoice(id: string): Invoice | undefined {
      const row = d.prepare("SELECT data FROM invoices2 WHERE id = ? AND workspace_id = ?").get(id, workspaceId) as { data: string } | undefined;
      return row ? JSON.parse(row.data) : undefined;
    },
    saveInvoice(inv: Invoice): Invoice {
      d.prepare(
        `INSERT INTO invoices2 (id, workspace_id, created_at, status, paypal_invoice_id, data) VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET status = excluded.status, paypal_invoice_id = excluded.paypal_invoice_id, data = excluded.data`,
      ).run(inv.id, workspaceId, inv.createdAt, inv.status, inv.paypalInvoiceId ?? null, JSON.stringify(inv));
      return inv;
    },
    newInvoiceId: uid,
    nextInvoiceNumber(): string {
      const row = d.prepare("SELECT COUNT(*) AS n FROM invoices2 WHERE workspace_id = ?").get(workspaceId) as { n: number };
      return `LSH-${new Date().getFullYear()}-${String(row.n + 1).padStart(4, "0")}`;
    },

    log(a: Omit<Activity, "id" | "at"> & { at?: string }): Activity {
      const entry: Activity = { ...a, id: uid(), at: a.at ?? now() };
      d.prepare("INSERT INTO activity (id, workspace_id, at, invoice_id, data) VALUES (?, ?, ?, ?, ?)").run(
        entry.id,
        workspaceId,
        entry.at,
        entry.invoiceId ?? null,
        JSON.stringify(entry),
      );
      return entry;
    },
    activity(limit = 200): Activity[] {
      const rows = d.prepare("SELECT data FROM activity WHERE workspace_id = ? ORDER BY at DESC LIMIT ?").all(workspaceId, limit) as {
        data: string;
      }[];
      return rows.map((r) => JSON.parse(r.data));
    },

    // ---------- connectors (encrypted) ----------
    getConnector<T>(kind: string): T | null {
      const row = d.prepare("SELECT sealed FROM connectors WHERE workspace_id = ? AND kind = ?").get(workspaceId, kind) as { sealed: string } | undefined;
      return row ? open<T>(row.sealed) : null;
    },
    setConnector(kind: string, value: unknown) {
      d.prepare(
        `INSERT INTO connectors (workspace_id, kind, sealed, updated_at) VALUES (?, ?, ?, ?)
         ON CONFLICT(workspace_id, kind) DO UPDATE SET sealed = excluded.sealed, updated_at = excluded.updated_at`,
      ).run(workspaceId, kind, seal(value), now());
    },
    removeConnector(kind: string) {
      d.prepare("DELETE FROM connectors WHERE workspace_id = ? AND kind = ?").run(workspaceId, kind);
    },

    // ---------- inbox ----------
    upsertInbox(item: Omit<InboxItem, "id"> & { id?: string }): InboxItem {
      const existing = d
        .prepare("SELECT data FROM inbox WHERE workspace_id = ? AND source = ? AND external_id = ?")
        .get(workspaceId, item.source, item.externalId) as { data: string } | undefined;
      const prev = existing ? (JSON.parse(existing.data) as InboxItem) : undefined;
      const full: InboxItem = { ...prev, ...item, id: prev?.id ?? item.id ?? uid(), invoiceId: item.invoiceId ?? prev?.invoiceId };
      d.prepare(
        `INSERT INTO inbox (id, workspace_id, source, external_id, at, data) VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(workspace_id, source, external_id) DO UPDATE SET at = excluded.at, data = excluded.data`,
      ).run(full.id, workspaceId, full.source, full.externalId, full.at, JSON.stringify(full));
      return full;
    },
    inbox(limit = 100): InboxItem[] {
      const rows = d.prepare("SELECT data FROM inbox WHERE workspace_id = ? ORDER BY at DESC LIMIT ?").all(workspaceId, limit) as { data: string }[];
      return rows.map((r) => JSON.parse(r.data));
    },
    getInbox(id: string): InboxItem | undefined {
      const row = d.prepare("SELECT data FROM inbox WHERE id = ? AND workspace_id = ?").get(id, workspaceId) as { data: string } | undefined;
      return row ? JSON.parse(row.data) : undefined;
    },
    deleteInbox(id: string) {
      d.prepare("DELETE FROM inbox WHERE id = ? AND workspace_id = ?").run(id, workspaceId);
    },

    clearAll() {
      d.prepare("DELETE FROM invoices2 WHERE workspace_id = ?").run(workspaceId);
      d.prepare("DELETE FROM activity WHERE workspace_id = ?").run(workspaceId);
      d.prepare("DELETE FROM inbox WHERE workspace_id = ?").run(workspaceId);
    },
  };
}
