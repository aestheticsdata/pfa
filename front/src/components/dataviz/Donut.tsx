"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@lib/utils";
import { wedgePath } from "@components/dataviz/svg";

import type { DonutSegment } from "@components/dataviz/types";

interface DonutProps {
  segments: DonutSegment[];
  /** Rendered box size in px (square). */
  size?: number;
  /** Ring stroke width in viewBox units (ring variant only). */
  thickness?: number;
  variant?: "ring" | "pie";
  /** Gap between wedges in degrees (pie variant). */
  gap?: number;
  /** Round the ring segment ends. */
  rounded?: boolean;
  /** Grow each ring segment from zero on mount (ring variant). Remount (via a
   *  `key`) to replay — e.g. on a month change. */
  animate?: boolean;
  trackColor?: string;
  /** Center overlay (e.g. a big % for a gauge). */
  children?: ReactNode;
  className?: string;
  ariaLabel?: string;
}

const CX = 50;
const CY = 50;

/**
 * Donut / gauge / camembert. `ring` (default) draws stroked arcs — ideal for a
 * budget gauge with several segments; `pie` draws filled wedges.
 */
const Donut = ({
  segments,
  size = 160,
  thickness = 14,
  variant = "ring",
  gap = 0,
  rounded = false,
  animate = false,
  trackColor = "var(--bg-hi)",
  children,
  className,
  ariaLabel,
}: DonutProps) => {
  const total =
    segments.reduce((sum, seg) => sum + Math.max(0, seg.value), 0) || 1;

  // cumulative geometry computed imperatively (no reassignment inside JSX)
  let body: ReactNode;
  if (variant === "pie") {
    const r = 50;
    const wedges: { d: string; color: string }[] = [];
    let angle = 0;
    for (const seg of segments) {
      const sweep = (Math.max(0, seg.value) / total) * 360;
      const start = angle + gap / 2;
      const end = angle + sweep - gap / 2;
      angle += sweep;
      if (end > start) {
        wedges.push({ d: wedgePath(CX, CY, r, start, end), color: seg.color });
      }
    }
    body = wedges.map((w, i) => <path key={i} d={w.d} fill={w.color} />);
  } else {
    const r = 50 - thickness / 2;
    const circumference = 2 * Math.PI * r;
    const arcs: { dash: number; offset: number; color: string }[] = [];
    let offset = 0;
    for (const seg of segments) {
      const dash = (Math.max(0, seg.value) / total) * circumference;
      arcs.push({ dash, offset, color: seg.color });
      offset += dash;
    }
    body = (
      <g transform={`rotate(-90 ${CX} ${CY})`}>
        <circle
          cx={CX}
          cy={CY}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={thickness}
        />
        {arcs.map((a, i) => (
          <circle
            key={i}
            cx={CX}
            cy={CY}
            r={r}
            fill="none"
            stroke={a.color}
            strokeWidth={thickness}
            strokeDasharray={`${a.dash} ${circumference - a.dash}`}
            strokeDashoffset={-a.offset}
            strokeLinecap={rounded ? "round" : "butt"}
            className={animate ? "pfa-anim-donut" : undefined}
            style={
              animate
                ? ({
                    "--pfa-circ": circumference,
                    "--pfa-dash": a.dash,
                    "--pfa-gap": circumference - a.dash,
                  } as CSSProperties)
                : undefined
            }
          />
        ))}
      </g>
    );
  }

  return (
    <div
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        role="img"
        aria-label={ariaLabel}
      >
        {body}
      </svg>
      {children && (
        <div className="absolute inset-0 grid place-content-center text-center">
          {children}
        </div>
      )}
    </div>
  );
};

export default Donut;
