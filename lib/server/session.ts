// Sessions, CSRF and rate limiting for the route handlers.
import { createHmac, timingSafeEqual } from "node:crypto";
import { createWorkspace, workspaceExists, store, type Store } from "./db";
import { seedSampleMonth } from "./seed";
import { appUrlFrom } from "./url";
import { SECRET } from "./crypto";
import { env, isProduction } from "./env";
import { log } from "./logger";
import { HttpError } from "./errors";

const COOKIE = "leash_ws";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const sign = (id: string) => createHmac("sha256", SECRET).update(id).digest("base64url");

function readCookie(req: Request): string | undefined {
  const raw = req.headers.get("cookie") ?? "";
  const m = raw.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!m) return undefined;
  const [id, sig] = decodeURIComponent(m[1]).split(".");
  if (!id || !sig) return undefined;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(id));
  return a.length === b.length && timingSafeEqual(a, b) ? id : undefined;
}

function cookieHeader(id: string, req: Request) {
  const secure = new URL(req.url).protocol === "https:" || isProduction();
  return `${COOKIE}=${encodeURIComponent(`${id}.${sign(id)}`)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}${secure ? "; Secure" : ""}`;
}

/** Reject cross-site writes: the Origin header must match this app. */
function sameOrigin(req: Request): boolean {
  if (req.method === "GET" || req.method === "HEAD") return true;
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const allowed = new Set([new URL(req.url).origin]);
  const appUrl = env().APP_URL;
  if (appUrl) allowed.add(new URL(appUrl).origin);
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  if (host) allowed.add(`${proto}://${host}`);
  return allowed.has(origin);
}

// Fixed-window limiter; fine for one instance. Use Redis when running several.
const hits = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, limit: number, windowMs: number): number | null {
  const t = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < t) {
    hits.set(key, { count: 1, reset: t + windowMs });
    if (hits.size > 50_000) for (const [k, v] of hits) if (v.reset < t) hits.delete(k);
    return null;
  }
  h.count += 1;
  return h.count > limit ? Math.ceil((h.reset - t) / 1000) : null;
}

type Opts = { limit?: [number, number]; create?: boolean };

/**
 * Wrap a route handler with: same-origin check, signed workspace session, optional rate limit,
 * consistent JSON errors. `create` makes a new (sample-seeded) workspace for first-time visitors.
 */
export function withSession<C>(handler: (req: Request, ws: Store, ctx: C) => Promise<Response> | Response, opts: Opts = {}) {
  return async (req: Request, ctx: C): Promise<Response> => {
    try {
      if (!sameOrigin(req)) throw new HttpError(403, "Cross-site request blocked");
      let id = readCookie(req);
      let setCookie: string | undefined;
      if (!id || !workspaceExists(id)) {
        if (!opts.create) throw new HttpError(401, "Your session expired. Reload the page.");
        id = createWorkspace();
        seedSampleMonth(store(id), appUrlFrom(req));
        setCookie = cookieHeader(id, req);
      }
      if (opts.limit) {
        const wait = rateLimit(`${id}:${new URL(req.url).pathname}`, opts.limit[0], opts.limit[1]);
        if (wait) throw new HttpError(429, `Slow down a little. Try again in ${wait}s.`);
      }
      const res = await handler(req, store(id), ctx);
      if (setCookie) res.headers.append("Set-Cookie", setCookie);
      return res;
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500;
      const message = e instanceof Error ? e.message : String(e);
      if (status === 500) log.error("Unhandled error in route handler", { method: req.method, path: new URL(req.url).pathname, error: e });
      return Response.json({ error: status === 500 ? "Something went wrong on our side." : message }, { status });
    }
  };
}

/** Parse a JSON body with a size cap. */
export async function body<T>(req: Request, maxBytes = 8_000): Promise<T> {
  const text = await req.text();
  if (text.length > maxBytes) throw new HttpError(413, "Request too large");
  try {
    return (text ? JSON.parse(text) : {}) as T;
  } catch {
    throw new HttpError(400, "Invalid JSON");
  }
}
