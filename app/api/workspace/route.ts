import { withSession, body } from "@/lib/server/session";
import { HttpError } from "@/lib/server/errors";
import { seedSampleMonth } from "@/lib/server/seed";
import { appUrlFrom } from "@/lib/server/url";

// Settings actions for this visitor's workspace.
export const POST = withSession(
  async (req, s) => {
    const { action } = await body<{ action?: unknown }>(req);
    if (action === "sample") {
      s.clearAll();
      seedSampleMonth(s, appUrlFrom(req));
    } else if (action === "clear") {
      s.clearAll();
    } else throw new HttpError(400, "Unknown action");
    return Response.json({ ok: true });
  },
  { limit: [10, 60_000] },
);
