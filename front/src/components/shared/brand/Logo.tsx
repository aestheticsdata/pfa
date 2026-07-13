import { cn } from "@lib/utils";

const CURVE = "M10 28.5h6.5l4.5-11 5.5 15 4-9H38";

type LogoProps = {
  /** Rendered width/height in px (SVG is a 48×48 square). */
  size?: number;
  /** Large "hero" variant: gradient tile fill, pulsed under-glow, end dot. */
  glow?: boolean;
  className?: string;
};

/**
 * pfa brand mark — rounded tile + cyan→green "spending curve" stroke.
 * Extracted from the design handoff (Login 2026.html).
 *
 * Gradient ids are deterministic per-variant (glow vs plain) so SSR and client
 * agree (no hydration mismatch). The two variants never collide on a page; two
 * same-variant logos would share identical gradients, so a shared id is
 * visually harmless.
 */
export default function Logo({ size = 26, glow = false, className }: LogoProps) {
  const strokeId = glow ? "pfaStrokeGlow" : "pfaStrokePlain";
  const tileId = "pfaTileGlow";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="pfa"
      className={cn("block", className)}
    >
      <defs>
        <linearGradient
          id={strokeId}
          x1="0"
          y1="1"
          x2="1"
          y2="0"
        >
          <stop
            offset="0"
            stopColor="oklch(0.80 0.13 210)"
          />
          <stop
            offset="1"
            stopColor="oklch(0.85 0.15 150)"
          />
        </linearGradient>
        {glow && (
          <linearGradient
            id={tileId}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0"
              stopColor="oklch(0.22 0.015 240)"
            />
            <stop
              offset="1"
              stopColor="oklch(0.13 0.010 250)"
            />
          </linearGradient>
        )}
      </defs>

      <rect
        x="1.5"
        y="1.5"
        width="45"
        height="45"
        rx="13"
        fill={glow ? `url(#${tileId})` : "oklch(0.16 0.01 245)"}
        stroke={`url(#${strokeId})`}
        strokeWidth={glow ? 1.5 : 2}
      />

      {glow && (
        <path
          className="pfa-logo-pulse"
          d={CURVE}
          fill="none"
          stroke="oklch(0.85 0.15 165)"
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      <path
        d={CURVE}
        fill="none"
        stroke={`url(#${strokeId})`}
        strokeWidth={glow ? 2.6 : 3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {glow && (
        <circle
          cx="38"
          cy="23.5"
          r="2.6"
          fill="oklch(0.85 0.15 150)"
        />
      )}
    </svg>
  );
}
