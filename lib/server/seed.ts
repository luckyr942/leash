// Sample freelancer workspace: one invoice at every point of the collections journey.
// Everything is marked simulated and uses SIM- ids and example.com addresses.
import { randomBytes } from "node:crypto";
import { type Store } from "./db";
import { DEFAULT_PROFILE, type Invoice, type Reminder } from "@/lib/domain/models";

const sim = () => `SIM-INV2-${randomBytes(5).toString("hex").toUpperCase()}`;
const DAY = 86_400_000;

type Row = {
  name: string;
  company: string;
  email: string;
  phone?: string;
  work: string;
  amount: number;
  status: Invoice["status"];
  createdAgo: number;
  dueIn: number; // negative = overdue by N days
  reminders?: [number, Reminder["stage"], Reminder["channel"]][]; // [daysAgo, stage, channel]
  paidAgo?: number;
  source?: "chat" | "manual";
  cur?: string;
};

const ROWS: Row[] = [
  {
    name: "Maya Chen",
    company: "Northwind Studio",
    email: "maya@northwind.example",
    work: "Brand refresh: logo and style guide",
    amount: 1200,
    cur: "EUR",
    status: "PAID",
    createdAgo: 30,
    dueIn: -10,
    paidAgo: 12,
  },
  {
    name: "Leo Park",
    company: "Globex",
    email: "leo@globex.example",
    phone: "+15550100",
    work: "Landing page design and build",
    amount: 800,
    status: "SENT",
    createdAgo: 8,
    dueIn: 6,
  },
  {
    name: "Sarah Kim",
    company: "Acme Corp",
    email: "sarah@acme.example",
    phone: "+15550111",
    work: "Website landing page",
    amount: 500,
    status: "SENT",
    createdAgo: 18,
    dueIn: -4,
  },
  {
    name: "Priya Nair",
    company: "Initech",
    email: "priya@initech.example",
    phone: "+15550122",
    work: "Mobile app UI, 12 screens",
    amount: 1750,
    status: "SENT",
    createdAgo: 30,
    dueIn: -12,
    reminders: [[6, "FRIENDLY", "email"]],
  },
  {
    name: "Tom Hale",
    company: "Umbrella Co",
    email: "tom@umbrella.example",
    work: "Product photography, 20 shots",
    amount: 650,
    cur: "GBP",
    status: "SENT",
    createdAgo: 45,
    dueIn: -25,
    reminders: [
      [18, "FRIENDLY", "paypal"],
      [9, "FIRM", "email"],
    ],
  },
  {
    name: "Dana Ortiz",
    company: "Stark Studio",
    email: "dana@stark.example",
    phone: "+15550133",
    work: "Pitch deck design",
    amount: 2400,
    status: "SENT",
    createdAgo: 60,
    dueIn: -40,
    reminders: [
      [33, "FRIENDLY", "email"],
      [25, "FIRM", "paypal"],
      [12, "FINAL", "email"],
    ],
  },
  {
    name: "Bruce Lin",
    company: "Wayne Co",
    email: "bruce@wayne.example",
    work: "Logo design, 3 concepts",
    amount: 900,
    status: "DRAFT",
    createdAgo: 0,
    dueIn: 14,
    source: "chat",
  },
];

export function seedSampleMonth(s: Store, baseUrl = "") {
  s.setProfile(DEFAULT_PROFILE);
  seedSampleInbox(s);
  const now = Date.now();
  const iso = (daysAgo: number) => new Date(now - daysAgo * DAY).toISOString();
  const date = (daysFromNow: number) => new Date(now + daysFromNow * DAY).toISOString().slice(0, 10);
  const fmt = (n: number, c = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: c }).format(n);

  // Oldest first so invoice numbers ascend with time.
  for (const r of [...ROWS].sort((a, b) => b.createdAgo - a.createdAgo)) {
    const created = iso(r.createdAgo);
    const sentAgo = Math.max(r.createdAgo - 1, 0);
    const inv: Invoice = {
      id: s.newInvoiceId(),
      number: s.nextInvoiceNumber(),
      createdAt: created,
      updatedAt: created,
      status: r.status,
      client: { name: r.name, email: r.email, phone: r.phone, company: r.company },
      description: `${r.work}.`,
      items: [{ name: r.work, quantity: 1, unitPrice: r.amount }],
      currency: r.cur ?? "USD",
      total: r.amount,
      dueDate: date(r.dueIn),
      note: "Thank you for your business!",
      source: r.source ?? "chat",
      simulated: true,
      reminders: (r.reminders ?? []).map(([ago, stage, channel]) => ({ at: iso(ago), stage, channel })),
    };
    const ref = { invoiceId: inv.id, invoiceNumber: inv.number };
    s.log({
      ...ref,
      at: created,
      type: "created",
      actor: "ai",
      message: `AI drafted ${inv.number} for ${r.name} from a pasted conversation · ${fmt(r.amount, r.cur)}`,
    });
    if (r.status !== "DRAFT") {
      inv.paypalInvoiceId = sim();
      inv.approvedAt = iso(sentAgo);
      inv.sentAt = iso(sentAgo);
      inv.payToken = randomBytes(12).toString("base64url");
      inv.payUrl = `${baseUrl}/pay/${inv.id}?t=${inv.payToken}`;
      s.log({
        ...ref,
        at: inv.approvedAt,
        type: "approved",
        actor: "you",
        message: `You approved ${inv.number}; created in PayPal (simulated) as ${inv.paypalInvoiceId}`,
      });
      s.log({ ...ref, at: inv.sentAt, type: "sent", actor: "you", message: `You sent ${inv.number} to ${r.email} via PayPal (simulated)` });
    }
    for (const rem of inv.reminders) {
      const via = {
        paypal: "PayPal email (simulated)",
        email: "your email app",
        whatsapp: "WhatsApp",
        sms: "SMS",
        telegram: "your Telegram bot",
        copy: "copied text",
      }[rem.channel];
      s.log({
        ...ref,
        at: rem.at,
        type: "reminder_sent",
        actor: "you",
        message: `You approved a ${rem.stage.toLowerCase()} reminder for ${inv.number} · sent via ${via}`,
      });
    }
    if (r.paidAgo !== undefined) {
      inv.paidAt = iso(r.paidAgo);
      s.log({ ...ref, at: inv.paidAt, type: "paid", actor: "paypal", message: `PayPal (simulated): ${r.name} paid ${inv.number} · ${fmt(r.amount, r.cur)}` });
    }
    s.saveInvoice(inv);
  }
}

/** Sample conversations so the Inbox shows how connectors feed it. */
export function seedSampleInbox(s: Store) {
  const at = (minsAgo: number) => new Date(Date.now() - minsAgo * 60_000).toISOString();
  s.upsertInbox({
    source: "whatsapp",
    externalId: "sample-wa-1",
    at: at(25),
    fromName: "Jess Moreno",
    handle: "+15550144",
    subject: "WhatsApp chat · 4 messages",
    text: "Jess Moreno: Hi! It's Jess from Bloom Cafe 🌸\nJess Moreno: Could you design our new menu? Two pages, print-ready.\nAlex Rivera: Sure! For two pages it's $350.\nJess Moreno: Perfect. Need it by December 1. My email is jess@bloom.example",
  });
  s.upsertInbox({
    source: "email",
    externalId: "sample-email-1",
    at: at(90),
    fromName: "Upwork",
    handle: "donotreply@upwork.example",
    subject: "New message from Marco Silva",
    text: 'From: Upwork <donotreply@upwork.example>\nSubject: New message from Marco Silva\n\nMarco Silva (Silva Logistics) wrote:\n"Thanks for the great work on the dashboard mockups. Please invoice us $1,200 for milestone 2. Payment terms net 15 from today. Billing email: ap@silvalogistics.example"',
  });
  s.upsertInbox({
    source: "paste",
    externalId: "sample-ig-1",
    at: at(240),
    fromName: "Nina Okafor",
    handle: "",
    subject: "Instagram conversation",
    text: "Nina Okafor: love your portfolio! can you shoot product photos for my candle brand?\nAlex Rivera: Thanks! 15 edited shots for $480?\nNina Okafor: deal 🙌 shoot next Friday, pay after delivery",
  });
}
