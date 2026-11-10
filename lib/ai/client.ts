// Google Gemini (free tier works). Set GEMINI_API_KEY; optionally GEMINI_MODEL.
import { GoogleGenAI, type GenerateContentParameters, type GenerateContentResponse } from "@google/genai";
import { env } from "@/lib/server/env";

// Older models (2.5) are closed to new keys. If Google is overloaded or a model isn't available
// to this key, Leash moves down this list and remembers the one that worked.
const FALLBACKS = ["gemini-3.5-flash", "gemini-3.8-flash", "gemini-3.5-flash-lite"];
const MODELS = [...new Set([env().GEMINI_MODEL, ...FALLBACKS].filter(Boolean) as string[])];
let current = 0;
export const AI_MODEL = MODELS[0];
export const activeModel = () => MODELS[current];
const key = () => env().GEMINI_API_KEY || env().GOOGLE_API_KEY || "";

// If Google rejects the key, fall back to the built-in rule-based mode until the server restarts.
let keyRejected = false;
export const aiConfigured = () => Boolean(key()) && !keyRejected;
export const aiKeyProblem = () => (keyRejected ? "Google rejected GEMINI_API_KEY. Create a new key at aistudio.google.com/apikey." : null);

type GeminiClient = Pick<GoogleGenAI, "models">;
let client: GeminiClient | null = null;
export function gemini(): GeminiClient {
  client ??= new GoogleGenAI({ apiKey: key() });
  return client;
}

/** Test helper: swap in a fake Gemini client and start again from the first model. */
export function setGeminiClientForTests(fake: GeminiClient | null) {
  client = fake;
  current = 0;
  keyRejected = false;
}

export const MODEL_ORDER: readonly string[] = MODELS;

export class AIError extends Error {}

const retryable = (e: unknown) =>
  /\b(503|429|404)\b|UNAVAILABLE|RESOURCE_EXHAUSTED|NOT_FOUND|no longer available|high demand/i.test(e instanceof Error ? e.message : String(e));

/** generateContent with automatic model fallback. Pass everything except `model`. */
export async function generate(req: Omit<GenerateContentParameters, "model">): Promise<GenerateContentResponse> {
  let last: unknown;
  for (let tries = 0; tries < MODELS.length; tries++) {
    const i = (current + tries) % MODELS.length;
    try {
      const res = await gemini().models.generateContent({ ...req, model: MODELS[i] });
      current = i;
      return res;
    } catch (e) {
      last = e;
      if (!retryable(e)) throw e;
    }
  }
  throw last;
}

function explain(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/API key not valid|API_KEY_INVALID|API key expired/i.test(msg)) {
    keyRejected = true;
    return "Gemini rejected the API key, so Leash switched to basic mode. Add a valid GEMINI_API_KEY.";
  }
  if (/PERMISSION_DENIED/i.test(msg)) return "This Gemini key isn't allowed to use that model. Check GEMINI_MODEL or the key's project.";
  if (/RESOURCE_EXHAUSTED|quota|429/i.test(msg)) return "Gemini's free-tier limit was reached. Wait a minute and try again.";
  if (/not found|NOT_FOUND|is not supported/i.test(msg))
    return `Model "${AI_MODEL}" isn't available for this key. Set GEMINI_MODEL to a model your key can use.`;
  return "Gemini couldn't complete that request. Please try again.";
}

/** Ask Gemini for JSON matching `schema` (a JSON Schema object). */
export async function askJSON<T>(system: string, user: string, schema: object): Promise<T> {
  try {
    const res = await generate({
      contents: user,
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        responseJsonSchema: schema,
        temperature: 0.2,
      },
    });
    const text = res.text ?? "";
    return JSON.parse(text) as T;
  } catch (e) {
    if (e instanceof SyntaxError) throw new AIError("Gemini returned an unreadable answer. Please try again.");
    throw new AIError(explain(e));
  }
}

export { explain as explainAIError };
