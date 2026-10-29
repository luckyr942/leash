import { withSession } from "@/lib/session";
import { paypalConfigured } from "@/lib/paypal";
import { aiConfigured, activeModel, aiKeyProblem } from "@/lib/ai";
import { connectorStatus } from "@/lib/connectors/status";
import { getRates } from "@/lib/fx";

export const dynamic = "force-dynamic";

export const GET = withSession(
  async (_req, s) =>
    Response.json(
      {
        fx: await getRates(s.getProfile().currency),
        workspace: s.id.slice(0, 8),
        profile: s.getProfile(),
        invoices: s.invoices().map(({ payToken: _t, ...inv }) => inv), // never expose the pay-page secret
        activity: s.activity(150),
        inbox: s.inbox(100),
        connectors: connectorStatus(s),
        config: {
          paypal: paypalConfigured(),
          ai: aiConfigured(),
          aiModel: activeModel(),
          aiProblem: aiKeyProblem(),
          env: process.env.PAYPAL_ENV === "live" ? "live" : "sandbox",
          webhooks: Boolean(process.env.PAYPAL_WEBHOOK_ID),
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    ),
  { create: true, limit: [120, 60_000] },
);
