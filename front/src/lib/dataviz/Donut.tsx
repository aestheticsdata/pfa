"use client";

import { annularSectorPath, wedgePath } from "@lib/dataviz/arcPaths";
import { cn } from "@lib/utils";
import { useId } from "react";

import type { DonutSegment } from "@lib/dataviz/dataVizTypes";
import type { CSSProperties, ReactNode } from "react";

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
  /** Ring gauge full-scale. When it exceeds the sum of segment values, the
   *  leftover (capacity − sum) renders as an empty dotted "available" band that
   *  completes the ring. Omit to let the segments fill the whole ring. */
  capacity?: number;
  /** Stroke color of the dotted "available" band (ring gauge, when `capacity`
   *  is set). */
  availableColor?: string;
  /** Center overlay (e.g. a big % for a gauge). */
  children?: ReactNode;
  className?: string;
  ariaLabel?: string;
}

const CX = 50;
const CY = 50;
/** Empty "remaining / available" arc: a hollow band the same width as the solid
 *  arcs, traced by a fine dotted outline (the projection curve's rhythm — "3 4"
 *  dash, ~1.5px non-scaling stroke, round caps) with a see-through interior. */
const REMAINING_DASHARRAY = "3 4";
const REMAINING_STROKE = 1.5;
/** Inset the dotted outline just inside the band so its stroke stays within the
 *  dark track and clear of the viewBox edge (the outer band edge sits at r=50). */
const REMAINING_INSET = 0.75;
/** Reveal-mask padding — a touch wider than the band, radially and at each
 *  angular end, so the growing mask never clips the dotted outline. */
const REMAINING_MASK_PAD = 3;
const REMAINING_MASK_ARC = 1.5;

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
  trackColor = "var(--surface-hi)",
  capacity,
  availableColor = "var(--accent-strong)",
  children,
  className,
  ariaLabel,
}: DonutProps) => {
  const segmentsTotal = segments.reduce((sum, seg) => sum + Math.max(0, seg.value), 0);
  // Stable prefix for the reveal-mask id (unique across mounted Donuts).
  const uid = useId();

  // cumulative geometry computed imperatively (no reassignment inside JSX)
  let body: ReactNode;
  if (variant === "pie") {
    const r = 50;
    const total = segmentsTotal || 1;
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
    body = wedges.map((w, i) => (
      <path
        // biome-ignore lint/suspicious/noArrayIndexKey: fixed positional pie wedges with no stable unique field
        key={i}
        d={w.d}
        fill={w.color}
      />
    ));
  } else {
    const r = 50 - thickness / 2;
    const circumference = 2 * Math.PI * r;
    // Optional gauge leftover: capacity beyond the summed segments renders as the
    // empty dotted "available" band that completes the ring.
    const leftover = capacity != null ? Math.max(0, capacity - segmentsTotal) : 0;
    const total = segmentsTotal + leftover || 1;
    const growStyle = (dash: number) =>
      ({ "--pfa-circ": circumference, "--pfa-dash": dash, "--pfa-gap": circumference - dash }) as CSSProperties;

    const solidArcs: { dash: number; offset: number; color: string }[] = [];
    let offset = 0;
    for (const seg of segments) {
      const dash = (Math.max(0, seg.value) / total) * circumference;
      if (dash > 0) {
        solidArcs.push({ dash, offset, color: seg.color });
      }
      offset += dash;
    }

    // The empty "available" band — a hollow band, same width as the solid arcs but
    // only traced by a fine dotted outline (annularSectorPath), interior see-through.
    // Its own dash array carries the dot pattern, so it can't grow via that; instead
    // it's revealed through a mask whose band grows with the same pfa-donut-grow
    // keyframe — the empty band fills in lockstep with the solid arcs.
    const emptyDash = (leftover / total) * circumference;
    const emptyFull = emptyDash >= circumference - 0.01;
    const rInner = 50 - thickness + REMAINING_INSET;
    const rOuter = 50 - REMAINING_INSET;
    const maskId = `${uid}-available`;
    // Mask arc runs a touch longer than the band so its butt ends never clip the
    // outline's end caps; the mask stroke is a touch wider for the radial edges.
    const maskDash = Math.min(circumference, emptyDash + 2 * REMAINING_MASK_ARC);
    const maskProps = animate ? { mask: `url(#${maskId})` } : {};
    const dotProps = {
      fill: "none",
      stroke: availableColor,
      strokeWidth: REMAINING_STROKE,
      strokeDasharray: REMAINING_DASHARRAY,
      strokeLinecap: "round" as const,
      vectorEffect: "non-scaling-stroke" as const,
    };

    body = (
      <>
        <g transform={`rotate(-90 ${CX} ${CY})`}>
          <circle
            cx={CX}
            cy={CY}
            r={r}
            fill="none"
            stroke={trackColor}
            strokeWidth={thickness}
          />
          {solidArcs.map((a, i) => (
            <circle
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed positional ring arcs with no stable unique field
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
              style={animate ? growStyle(a.dash) : undefined}
            />
          ))}
        </g>
        {emptyDash > 0 && (
          <g>
            {animate && (
              <mask
                id={maskId}
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="100"
                height="100"
              >
                <g transform={`rotate(-90 ${CX} ${CY})`}>
                  <circle
                    cx={CX}
                    cy={CY}
                    r={r}
                    fill="none"
                    stroke="#fff"
                    strokeWidth={thickness + REMAINING_MASK_PAD}
                    strokeDasharray={`${maskDash} ${circumference - maskDash}`}
                    strokeDashoffset={-(offset - REMAINING_MASK_ARC)}
                    className="pfa-anim-donut"
                    style={growStyle(maskDash)}
                  />
                </g>
              </mask>
            )}
            {emptyFull ? (
              // Whole ring empty (nothing spent yet): two concentric dotted circles.
              <g {...maskProps}>
                <circle
                  cx={CX}
                  cy={CY}
                  r={rOuter}
                  {...dotProps}
                />
                <circle
                  cx={CX}
                  cy={CY}
                  r={rInner}
                  {...dotProps}
                />
              </g>
            ) : (
              <path
                d={annularSectorPath(
                  CX,
                  CY,
                  rInner,
                  rOuter,
                  (offset / circumference) * 360,
                  ((offset + emptyDash) / circumference) * 360,
                )}
                {...dotProps}
                {...maskProps}
              />
            )}
          </g>
        )}
      </>
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
      {children && <div className="absolute inset-0 grid place-content-center text-center">{children}</div>}
    </div>
  );
};

export default Donut;
