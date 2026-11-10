// Leash brand mark: a leash shaped like an "L" — handle loop at the top, a coin clipped to the end.
// The idea of the product in one shape: keep every payment on a lead until it comes home.

export const BRAND = { sky: "#6EC1FF", ink: "#111827" };

type MarkProps = { size?: number; tone?: "sky" | "ink" | "bare"; title?: string };

/** The mark alone. tone="sky" (default) = sky-blue tile, ink leash; "ink" = ink tile, sky-blue leash; "bare" = no tile, currentColor. */
export function LogoMark({ size = 28, tone = "sky", title }: MarkProps) {
  const tile = tone === "sky" ? BRAND.sky : tone === "ink" ? BRAND.ink : "none";
  const line = tone === "sky" ? BRAND.ink : tone === "ink" ? BRAND.sky : "currentColor";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role={title ? "img" : undefined} aria-hidden={title ? undefined : true} className="logo-mark">
      {title && <title>{title}</title>}
      {tone !== "bare" && <rect width="64" height="64" rx="16" fill={tile} />}
      <MarkPaths color={line} />
    </svg>
  );
}

export function MarkPaths({ color }: { color: string }) {
  return (
    <>
      <circle cx="24" cy="15.5" r="6" fill="none" stroke={color} strokeWidth="5.5" />
      <path d="M24 21.5V35.5a9.5 9.5 0 0 0 9.5 9.5H36" fill="none" stroke={color} strokeWidth="5.5" strokeLinecap="round" />
      <circle cx="44.5" cy="45" r="7.5" fill={color} />
    </>
  );
}

/** Mark + wordmark. */
export function Logo({ size = 28, tone = "sky", className = "" }: MarkProps & { className?: string }) {
  return (
    <span className={`logo ${className}`}>
      <LogoMark size={size} tone={tone} />
      <span className="logo-word">Leash</span>
    </span>
  );
}
