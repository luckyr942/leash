// Exchange rates for multi-currency totals (free, keyless: European Central Bank rates via Frankfurter).
// Used only to show approximate totals in your home currency; invoices are always billed in their own currency.
export type Rates = { base: string; date: string; rates: Record<string, number> };

const cache = new Map<string, { at: number; value: Rates }>();
const TTL = 6 * 3_600_000;

export async function getRates(base: string): Promise<Rates | null> {
  const hit = cache.get(base);
  if (hit && Date.now() - hit.at < TTL) return hit.value;
  try {
    const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=${encodeURIComponent(base)}`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return hit?.value ?? null;
    const j = (await res.json()) as { base: string; date: string; rates: Record<string, number> };
    const value = { base: j.base, date: j.date, rates: { ...j.rates, [j.base]: 1 } };
    cache.set(base, { at: Date.now(), value });
    return value;
  } catch {
    return hit?.value ?? null; // offline: totals fall back to per-currency only
  }
}

/** PayPal Invoicing currencies most freelancers use (subset of PayPal's supported list). */
export const CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "INR",
  "CAD",
  "AUD",
  "SGD",
  "JPY",
  "CHF",
  "SEK",
  "NOK",
  "DKK",
  "NZD",
  "HKD",
  "MXN",
  "BRL",
  "PLN",
  "CZK",
  "ILS",
  "MYR",
  "PHP",
  "THB",
  "TWD",
  "HUF",
];
