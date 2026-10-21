// Server secret (signs sessions, encrypts connector credentials) + AES-256-GCM helpers.
import fs from "node:fs";
import path from "node:path";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function load(): string {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  // No env secret: generate one once and keep it beside the database (mode 600) so restarts keep sessions.
  const dir = process.env.LEASH_DATA_DIR ?? path.join(process.cwd(), "data");
  const file = path.join(dir, ".session-secret");
  try {
    return fs.readFileSync(file, "utf8").trim();
  } catch {
    fs.mkdirSync(dir, { recursive: true });
    const s = randomBytes(32).toString("hex");
    fs.writeFileSync(file, s, { mode: 0o600 });
    return s;
  }
}

export const SECRET = load();
const KEY = createHash("sha256").update(`leash-connectors:${SECRET}`).digest();

/** Encrypt a JSON value for storage. */
export function seal(value: unknown): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", KEY, iv);
  const enc = Buffer.concat([c.update(JSON.stringify(value), "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64url")).join(".");
}

export function open<T>(sealed: string): T | null {
  try {
    const [iv, tag, enc] = sealed.split(".").map((p) => Buffer.from(p, "base64url"));
    const d = createDecipheriv("aes-256-gcm", KEY, iv);
    d.setAuthTag(tag);
    return JSON.parse(Buffer.concat([d.update(enc), d.final()]).toString("utf8")) as T;
  } catch {
    return null;
  }
}
