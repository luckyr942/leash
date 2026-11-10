import { withSession, body } from "@/lib/server/session";
import { HttpError } from "@/lib/server/errors";
import type { Profile } from "@/lib/domain/models";

// Your business profile: used to sign messages and on invoices.
export const POST = withSession(
  async (req, s) => {
    const b = await body<Partial<Profile>>(req);
    const s2 = (v: unknown, max: number) =>
      String(v ?? "")
        .trim()
        .slice(0, max);
    const email = s2(b.email, 200);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "That email doesn't look right.");
    const currency = s2(b.currency, 3).toUpperCase() || "USD";
    if (!/^[A-Z]{3}$/.test(currency)) throw new HttpError(400, "Currency should be a 3-letter code like USD.");
    const profile: Profile = {
      yourName: s2(b.yourName, 80),
      business: s2(b.business, 120),
      email,
      currency,
      defaultDueDays: Math.min(Math.max(Math.round(Number(b.defaultDueDays) || 14), 1), 120),
    };
    s.setProfile(profile);
    s.log({ type: "status", actor: "you", message: "You updated your business profile" });
    return Response.json({ profile });
  },
  { limit: [20, 60_000] },
);
