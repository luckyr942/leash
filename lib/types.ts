import type { Invoice, Activity, Profile, InboxItem } from "./store";

/** Shape of GET /api/state. */
export type State = {
  workspace: string;
  fx: { base: string; date: string; rates: Record<string, number> } | null;
  profile: Profile;
  invoices: Invoice[];
  activity: Activity[];
  inbox: InboxItem[];
  connectors: {
    telegram: { connected: boolean; username?: string };
    email: { connected: boolean; user?: string; provider?: string };
  };
  config: { paypal: boolean; ai: boolean; aiModel: string; aiProblem: string | null; env: string; webhooks: boolean };
};
