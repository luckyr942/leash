import { withSession, body } from "@/lib/server/session";
import { createDraft, validate, type InvoiceInput } from "@/lib/services/invoices";

export const dynamic = "force-dynamic";

// Save a reviewed invoice as a DRAFT. Approval (and PayPal) is a separate, explicit step.
export const POST = withSession(
  async (req, s) => {
    const { invoice, source, inboxId } = await body<{ invoice?: Partial<InvoiceInput>; source?: string; inboxId?: string }>(req, 30_000);
    const inv = createDraft(s, validate(invoice ?? {}), source === "chat" ? "chat" : "manual", typeof inboxId === "string" ? inboxId.slice(0, 16) : undefined);
    return Response.json({ invoice: inv }, { status: 201 });
  },
  { limit: [30, 60_000] },
);
