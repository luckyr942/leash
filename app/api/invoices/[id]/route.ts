import { withSession, body, HttpError } from "@/lib/session";
import { invoiceAction, updateDraft, validate, type InvoiceInput } from "@/lib/invoices";
import { appUrlFrom } from "@/lib/url";
import type { Channel } from "@/lib/store";
import type { Stage } from "@/lib/rules";

type Ctx = { params: Promise<{ id: string }> };
const ok = (id: string) => /^[a-f0-9]{8}$/.test(id);
const strip = <T extends { payToken?: string }>({ payToken: _t, ...rest }: T) => rest;

// Edit a draft.
export const PUT = withSession<Ctx>(
  async (req, s, { params }) => {
    const { id } = await params;
    if (!ok(id)) throw new HttpError(400, "Bad id");
    const { invoice } = await body<{ invoice?: Partial<InvoiceInput> }>(req, 30_000);
    return Response.json({ invoice: strip(updateDraft(s, id, validate(invoice ?? {}))) });
  },
  { limit: [30, 60_000] },
);

// approve | send | remind | escalate | mark_paid | cancel | sync
export const POST = withSession<Ctx>(
  async (req, s, { params }) => {
    const { id } = await params;
    if (!ok(id)) throw new HttpError(400, "Bad id");
    const b = await body<{ action?: unknown; channel?: unknown; stage?: unknown; subject?: unknown; message?: unknown }>(req, 20_000);
    const inv = await invoiceAction(s, id, String(b.action), {
      appUrl: appUrlFrom(req),
      channel: typeof b.channel === "string" ? (b.channel as Channel) : undefined,
      stage: typeof b.stage === "string" && ["FRIENDLY", "FIRM", "FINAL", "ESCALATE"].includes(b.stage) ? (b.stage as Stage) : undefined,
      subject: typeof b.subject === "string" ? b.subject.slice(0, 300) : undefined,
      message: typeof b.message === "string" ? b.message.slice(0, 4000) : undefined,
    });
    return Response.json({ invoice: strip(inv) });
  },
  { limit: [40, 60_000] },
);
