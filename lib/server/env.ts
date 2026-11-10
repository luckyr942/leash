// The single place that reads process.env. Every setting is validated once, on first use,
// so a bad value fails loudly with a clear message instead of misbehaving at runtime.
// Everything is optional: with no keys at all, Leash runs in demo mode.
import { z } from "zod";

const blank = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const optional = <T extends z.ZodTypeAny>(schema: T) => z.preprocess(blank, schema.optional());

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // App
  APP_URL: optional(z.string().url("APP_URL must be a full URL, e.g. https://leash.onrender.com")),
  SESSION_SECRET: optional(z.string().min(32, "SESSION_SECRET must be at least 32 characters (openssl rand -hex 32)")),
  LEASH_DATA_DIR: optional(z.string()),

  // PayPal
  PAYPAL_ENV: z.preprocess(blank, z.enum(["sandbox", "live"]).default("sandbox")),
  PAYPAL_CLIENT_ID: optional(z.string()),
  PAYPAL_CLIENT_SECRET: optional(z.string()),
  PAYPAL_WEBHOOK_ID: optional(z.string()),

  // Google Gemini
  GEMINI_API_KEY: optional(z.string()),
  GOOGLE_API_KEY: optional(z.string()),
  GEMINI_MODEL: optional(z.string()),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${problems}\nFix these in .env.local (see .env.example).`);
  }
  cached = parsed.data;
  return cached;
}

/** Test helper: forget the parsed values so a test can change process.env. */
export function resetEnvForTests() {
  cached = null;
}

export const isProduction = () => env().NODE_ENV === "production";
