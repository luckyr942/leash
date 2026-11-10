// Import this FIRST in a test file. It gives the test process its own empty data directory and
// clears every key, so tests always start in demo mode and never touch real PayPal or Gemini.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "leash-test-"));
const KEYS = [
  "GEMINI_API_KEY",
  "GOOGLE_API_KEY",
  "GEMINI_MODEL",
  "PAYPAL_CLIENT_ID",
  "PAYPAL_CLIENT_SECRET",
  "PAYPAL_WEBHOOK_ID",
  "PAYPAL_ENV",
  "APP_URL",
  "SESSION_SECRET",
];
for (const k of KEYS) delete process.env[k];
Object.assign(process.env, { NODE_ENV: "test", LEASH_DATA_DIR: dir });

process.on("exit", () => fs.rmSync(dir, { recursive: true, force: true }));
