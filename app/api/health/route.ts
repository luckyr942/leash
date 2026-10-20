import { pruneWorkspaces } from "@/lib/store";

export const dynamic = "force-dynamic";

// Health check for Render; also prunes workspaces nobody has opened in 30 days.
let lastPrune = 0;
export function GET() {
  if (Date.now() - lastPrune > 3_600_000) {
    pruneWorkspaces(30);
    lastPrune = Date.now();
  }
  return Response.json({ ok: true });
}
