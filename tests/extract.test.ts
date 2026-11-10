import { test } from "node:test";
import assert from "node:assert/strict";
import { demoExtract } from "@/lib/ai/extract-fallback";

const today = new Date("2026-11-05T12:00:00Z");

test("the reference example: landing page, $500, due on delivery Nov 10", () => {
  const e = demoExtract(
    "Sarah: Hi! I need a website landing page. Budget is $500. Please deliver by November 10. Payment due after delivery.\nMe: Sounds good!\nSarah: Great, my email is sarah@brightlabs.example",
    today,
  );
  assert.equal(e.clientName, "Sarah");
  assert.equal(e.clientEmail, "sarah@brightlabs.example");
  assert.equal(e.items[0].unitPrice, 500);
  assert.equal(e.currency, "USD");
  assert.equal(e.dueDate, "2026-11-10");
  assert.deepEqual(e.missing, []);
});

test("missing info is flagged instead of invented", () => {
  const e = demoExtract("Can you design a logo for us? We can talk price later.", today);
  assert.equal(e.clientEmail, "");
  assert.ok(e.missing.includes("Client email"));
  assert.ok(e.missing.includes("Amount"));
  assert.ok(e.missing.includes("Due date"));
});

test("net terms, k amounts, other currencies, past dates roll to next year", () => {
  const e = demoExtract("From: Tom Hale <tom@hale.example>\nQuote for the app redesign is €2.5k, invoice on 3 Jan, net 30.", today);
  assert.equal(e.clientName, "Tom Hale");
  assert.equal(e.currency, "EUR");
  assert.equal(e.items[0].unitPrice, 2500);
  assert.equal(e.dueDate, "2027-02-02");
});

test('introductions like "it\'s Jess from Bloom Cafe"', () => {
  const e = demoExtract("Hi, it's Jess from Bloom Cafe (jess@bloom.example). Can you design our menu? $350, due Dec 1.", today);
  assert.equal(e.clientName, "Jess");
  assert.equal(e.clientCompany, "Bloom Cafe");
  assert.equal(e.items[0].unitPrice, 350);
  assert.equal(e.dueDate, "2026-12-01");
});

test("Upwork notification email: real client, not the platform", () => {
  const e = demoExtract(
    'From: Upwork <donotreply@upwork.example>\nSubject: New message from Marco Silva\n\nMarco Silva (Silva Logistics) wrote:\n"Thanks for the great work on the dashboard mockups. Please invoice us $1,200 for milestone 2. Payment terms net 15 from today. Billing email: ap@silvalogistics.example"',
    today,
  );
  assert.equal(e.clientName, "Marco Silva");
  assert.equal(e.clientCompany, "Silva Logistics");
  assert.equal(e.clientEmail, "ap@silvalogistics.example");
  assert.equal(e.items[0].unitPrice, 1200);
  assert.equal(e.dueDate, "2026-11-20");
  assert.match(e.items[0].name, /milestone 2/i);
});
