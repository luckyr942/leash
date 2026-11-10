import { env } from "./env";

/** Public base URL of the app (for pay links and PayPal redirects). */
export function appUrlFrom(req: Request) {
  const { APP_URL } = env();
  if (APP_URL) return APP_URL.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "");
  return host ? `${proto}://${host}` : new URL(req.url).origin;
}
