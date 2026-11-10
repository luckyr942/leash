// Leash feature icons: two-tone (ink outline in currentColor + sky-blue fill), 48px grid.
// Drawn to match the logo's round, heavy line. Used on the landing page and in the brand kit.
type P = { size?: number };
const Y = "var(--brand-accent, #6EC1FF)";
const K = "#111827"; // details drawn on the blue fill stay ink in light and dark

const icon = (body: React.ReactNode) =>
  function BrandIcon({ size = 44 }: P) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className="brand-ic"
      >
        {body}
      </svg>
    );
  };

/** Capture: conversations from every channel drop into one inbox tray. */
export const BiCapture = icon(
  <>
    <path d="M8 30h9l2.5 4h9l2.5-4h9v8a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3Z" fill={Y} />
    <path d="M8 30l4-9h24l4 9" />
    <path d="M17 7h12a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-7l-4 3v-3h-1a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3Z" />
    <path d="M24 21v6m-3-3 3 3 3-3" />
  </>,
);

/** Extract: a chat becomes an invoice. */
export const BiExtract = icon(
  <>
    <path d="M6 9a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-6l-4 3.5V18a3 3 0 0 1-3-3Z" />
    <path d="M24 16h12l6 6v19a2 2 0 0 1-2 2H24a2 2 0 0 1-2-2V18a2 2 0 0 1 2-2Z" fill={Y} />
    <path d="M36 16v6h6" />
    <path d="M27 28h10M27 33h10M27 38h6" stroke={K} />
    <path d="M9 22v6a3 3 0 0 0 3 3h5m-3-3 3 3-3 3" />
  </>,
);

/** Approve: the invoice gets your check, then goes to PayPal. */
export const BiApprove = icon(
  <>
    <path d="M10 5h18l8 8v26a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
    <path d="M28 5v8h8M14 18h12M14 23h8" />
    <circle cx="33" cy="34" r="9" fill={Y} />
    <path d="m29 34 3 3 5.5-6" stroke={K} />
  </>,
);

/** Chase: a bell that climbs the follow-up ladder. */
export const BiChase = icon(
  <>
    <path d="M6 42h9v-6h9v-6h9v-6h9" />
    <path d="M14 18a8 8 0 0 1 16 0c0 6 3 8 3 8H11s3-2 3-8Z" fill={Y} />
    <path d="M19.5 30a2.5 2.5 0 0 0 5 0M22 6v2" />
  </>,
);

/** Ask: an assistant that answers from your numbers. */
export const BiAsk = icon(
  <>
    <path d="M8 12a5 5 0 0 1 5-5h22a5 5 0 0 1 5 5v14a5 5 0 0 1-5 5H22l-8 7v-7h-1a5 5 0 0 1-5-5Z" fill={Y} />
    <path stroke={K} d="M24 12.5c.8 3.6 2 4.8 5.5 5.5-3.5.7-4.7 1.9-5.5 5.5-.8-3.6-2-4.8-5.5-5.5 3.5-.7 4.7-1.9 5.5-5.5Z" />
  </>,
);

/** Paid: the coin comes home. */
export const BiPaid = icon(
  <>
    <circle cx="24" cy="24" r="16" fill={Y} />
    <circle cx="24" cy="24" r="11" stroke={K} />
    <path d="m19 24 3.5 3.5L29 21" stroke={K} />
  </>,
);

/** Multi-currency: bill each client in their own money. */
export const BiCurrency = icon(
  <>
    <circle cx="30" cy="28" r="12" fill={Y} />
    <circle cx="18" cy="20" r="12" />
    <path d="M21 15.5c-1-.8-2-1-3-1-2 0-3.3 1.1-3.3 2.6 0 3.4 6.6 2 6.6 5.6 0 1.6-1.4 2.8-3.4 2.8-1.3 0-2.5-.4-3.4-1.3M18 12.5v2M18 25.5v2" strokeWidth={2.2} />
    <path d="M35 23.5a5 5 0 1 0 0 9M25.5 26.5h6M25.5 29.5h6" strokeWidth={2.2} stroke={K} />
  </>,
);

/** QR pay: scan with any phone camera. */
export const BiQR = icon(
  <>
    <rect x="7" y="7" width="14" height="14" rx="3" fill={Y} />
    <rect x="27" y="7" width="14" height="14" rx="3" />
    <rect x="7" y="27" width="14" height="14" rx="3" />
    <g stroke="none">
      <rect x="11.5" y="11.5" width="5" height="5" rx="1.2" fill={K} />
      <rect x="31.5" y="11.5" width="5" height="5" rx="1.2" fill="currentColor" />
      <rect x="11.5" y="31.5" width="5" height="5" rx="1.2" fill="currentColor" />
      <rect x="27" y="27" width="5.5" height="5.5" rx="1.4" fill="currentColor" />
      <rect x="35.5" y="35.5" width="5.5" height="5.5" rx="1.4" fill="currentColor" />
      <rect x="27" y="35.5" width="5.5" height="5.5" rx="1.4" fill={Y} />
      <rect x="35.5" y="27" width="5.5" height="5.5" rx="1.4" fill={Y} />
    </g>
  </>,
);

/** Confirm: the assistant prepares it; you tap to send. */
export const BiConfirm = icon(
  <>
    <rect x="5" y="7" width="38" height="27" rx="6" />
    <path d="M11 14h17M11 19h11" />
    <rect x="19" y="23" width="19" height="7" rx="3.5" fill={Y} />
    <path d="m24.5 26.5 1.5 1.5 3-3" stroke={K} strokeWidth={2} />
    <path d="M33 29v13l3.4-3.3 2.8 5.6 2.6-1.3-2.8-5.5H44Z" fill="var(--bi-bg, #fff)" strokeWidth={2.2} />
  </>,
);

/** Connect: your channels, plugged in. */
export const BiConnect = icon(
  <>
    <circle cx="24" cy="24" r="7" fill={Y} />
    <circle cx="10" cy="10" r="4" />
    <circle cx="38" cy="10" r="4" />
    <circle cx="10" cy="38" r="4" />
    <circle cx="38" cy="38" r="4" />
    <path d="m13 13 6 6m16-6-6 6M13 35l6-6m16 6-6-6" />
  </>,
);

/** Secure: money stays with PayPal, secrets stay encrypted. */
export const BiSecure = icon(
  <>
    <path d="M24 5 9 10v11c0 10 6.5 17.5 15 21 8.5-3.5 15-11 15-21V10Z" fill={Y} />
    <rect x="17" y="21" width="14" height="11" rx="2.5" stroke={K} />
    <path d="M20 21v-3a4 4 0 0 1 8 0v3" stroke={K} />
  </>,
);

/** Log: every step, in order. */
export const BiLog = icon(
  <>
    <path d="M12 8v32" />
    <circle cx="12" cy="11" r="4" fill={Y} />
    <circle cx="12" cy="24" r="4" fill="var(--bi-bg, #fff)" />
    <circle cx="12" cy="37" r="4" fill="var(--bi-bg, #fff)" />
    <path d="M21 11h19M21 24h15M21 37h17" />
  </>,
);

export const BRAND_ICONS = [
  ["Capture", BiCapture],
  ["Extract", BiExtract],
  ["Approve", BiApprove],
  ["Chase", BiChase],
  ["Ask", BiAsk],
  ["Paid", BiPaid],
  ["Multi-currency", BiCurrency],
  ["QR pay", BiQR],
  ["Confirm", BiConfirm],
  ["Connect", BiConnect],
  ["Secure", BiSecure],
  ["Log", BiLog],
] as const;
