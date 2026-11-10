import "./helpers/isolated-env";
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { activeModel, askJSON, AIError, generate, MODEL_ORDER, setGeminiClientForTests } from "@/lib/ai/client";

// A fake Gemini client: `plan` decides, per model, whether the call fails and with what.
function fake(plan: Record<string, string | null>) {
  const seen: string[] = [];
  const client = {
    models: {
      generateContent: async ({ model }: { model: string }) => {
        seen.push(model);
        const err = plan[model];
        if (err) throw new Error(err);
        return { text: JSON.stringify({ ok: true, model }) };
      },
    },
  };
  setGeminiClientForTests(client as never);
  return seen;
}

beforeEach(() => setGeminiClientForTests(null));

test("uses the first model when it works", async () => {
  const seen = fake({});
  await generate({ contents: "hi" });
  assert.deepEqual(seen, [MODEL_ORDER[0]]);
});

test("falls back on overload (503) and remembers the model that worked", async () => {
  const [first, second] = MODEL_ORDER;
  const seen = fake({ [first]: "503 UNAVAILABLE: high demand" });
  await generate({ contents: "hi" });
  assert.deepEqual(seen, [first, second]);
  assert.equal(activeModel(), second);

  await generate({ contents: "again" });
  assert.deepEqual(seen, [first, second, second], "the next call starts from the working model");
});

test("falls back when a model is closed to this key (404)", async () => {
  const [first, second] = MODEL_ORDER;
  const seen = fake({ [first]: "404 NOT_FOUND: no longer available to new users" });
  await generate({ contents: "hi" });
  assert.deepEqual(seen, [first, second]);
});

test("does not retry errors another model can't fix (bad request)", async () => {
  const seen = fake(Object.fromEntries(MODEL_ORDER.map((m) => [m, "400 INVALID_ARGUMENT"])));
  await assert.rejects(generate({ contents: "hi" }), /INVALID_ARGUMENT/);
  assert.equal(seen.length, 1);
});

test("gives up after every model is overloaded", async () => {
  const seen = fake(Object.fromEntries(MODEL_ORDER.map((m) => [m, "503 UNAVAILABLE"])));
  await assert.rejects(generate({ contents: "hi" }), /503/);
  assert.equal(seen.length, MODEL_ORDER.length);
});

test("askJSON turns a rejected key into a friendly AIError", async () => {
  fake(Object.fromEntries(MODEL_ORDER.map((m) => [m, "API key not valid. API_KEY_INVALID"])));
  await assert.rejects(askJSON("sys", "user", {}), (e: unknown) => e instanceof AIError && /rejected the API key/.test(e.message));
});
