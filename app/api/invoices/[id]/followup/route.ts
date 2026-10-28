import { withSession, HttpError } from "@/lib/session";
import { draftMessage } from "@/lib/followup";
import { STAGE_LABEL } from "@/lib/rules";

type Ctx = { params: Promise<{ id: string }> };

// Rules decide the step; AI drafts the wording. Returned for review only; nothing is sent here.
export const POST = withSession<Ctx>(
  async (_req, s, { params }) => {
    const { id } = await params;
    const inv = /^[a-f0-9]{8}$/.test(id) ? s.getInvoice(id) : undefined;
    if (!inv) throw new HttpError(404, "No such invoice");
    const draft = await draftMessage(inv, s.getProfile());
    // Log each suggestion once per invoice and stage per 12 hours, so opening the composer doesn't spam the log.
    const since = Date.now() - 12 * 3_600_000;
    const already = s
      .activity(100)
      .some((e) => e.type === "reminder_suggested" && e.invoiceId === inv.id && new Date(e.at).getTime() > since && e.message.includes(STAGE_LABEL[draft.stage as "FIRM"]?.toLowerCase() ?? "~"));
    if (draft.stage !== "SEND" && !already) {
      s.log({
        type: "reminder_suggested",
        actor: "ai",
        message: `AI suggested a ${STAGE_LABEL[draft.stage].toLowerCase()} for ${inv.number} (${draft.assessment.label})`,
        invoiceId: inv.id,
        invoiceNumber: inv.number,
      });
    }
    return Response.json({ draft });
  },
  { limit: [20, 60_000] },
);
