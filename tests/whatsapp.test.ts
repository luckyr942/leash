import { test } from "node:test";
import assert from "node:assert/strict";
import { parseWhatsAppExport } from "@/lib/integrations/connectors/whatsapp";

test("iOS export", () => {
  const p = parseWhatsAppExport(
    "[05/11/2026, 10:15:32] Messages and calls are end-to-end encrypted.\n[05/11/2026, 10:15:40] Sarah Kim: Hi! I need a landing page.\nBudget is $500.\n[05/11/2026, 10:16:02] Alex Rivera: Sure!\n[05/11/2026, 10:17:11] Sarah Kim: Deliver by Nov 10 please",
    "Alex Rivera",
  );
  assert.equal(p.client, "Sarah Kim");
  assert.equal(p.lines.length, 3);
  assert.match(p.lines[0], /Budget is \$500/);
});

test("Android export with a number-only contact", () => {
  const p = parseWhatsAppExport("11/5/26, 10:15 AM - +1 555 0199: need a logo, $300\n11/5/26, 10:16 AM - You: ok!", "");
  assert.equal(p.client, "+1 555 0199");
  assert.equal(p.phone, "+15550199");
});

test("rejects non-exports", () => {
  assert.throws(() => parseWhatsAppExport("just some text"));
});
