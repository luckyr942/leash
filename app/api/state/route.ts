import { withSession } from "@/lib/server/session";
import { paypalConfigured } from "@/lib/integrations/paypal/client";
import { aiConfigured, activeModel, aiKeyProblem } from "@/lib/ai/client";
import { connectorStatus } from "@/lib/integrations/connectors/status";
import { getRates } from "@/lib/integrations/fx";
import { env } from "@/lib/server/env";

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
          env: env().PAYPAL_ENV,
          webhooks: Boolean(env().PAYPAL_WEBHOOK_ID),
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    ),
  { create: true, limit: [120, 60_000] },
);
