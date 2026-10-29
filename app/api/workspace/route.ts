import { withSession, body, HttpError } from "@/lib/session";
import { seedSampleMonth } from "@/lib/sample";
import { appUrlFrom } from "@/lib/url";

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
