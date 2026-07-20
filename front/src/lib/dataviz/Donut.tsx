"use client";

import { angleFromCenter, annularSectorPath, wedgePath } from "@lib/dataviz/arcPaths";
import { cn } from "@lib/utils";
import { useId, useState } from "react";

import type { DonutSegment } from "@lib/dataviz/dataVizTypes";
import type { CSSProperties, MouseEvent, ReactNode } from "react";

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
  /** Fires on pointer move over a ring segment, with its index and the event —
   *  mirrors `StackedBar` so a caller can drive a follow-cursor tooltip. The empty
   *  "available" band reports `index === segments.length` (when `capacity` leaves a
   *  leftover); the center hole and outside the band report a leave. */
  onSegmentHover?: (index: number, event: MouseEvent) => void;
  /** Fires when the pointer leaves the ring band (or lands where no segment is). */
  onSegmentLeave?: () => void;
  /** Opt-in: emphasize the ring segment under the cursor (soft glow in its own
   *  colour) and dim the others, driven by the same hit-test as `onSegmentHover`.
   *  Ring variant only. */
  emphasizeOnHover?: boolean;
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
/** Radial slack (viewBox units) around the ring band when hit-testing the cursor,
 *  so the thin stroke stays comfortably hoverable. */
const HIT_TOL = 4;
/** Hover emphasis (opt-in via `emphasizeOnHover`): the segment under the cursor
 *  thickens symmetrically — it grows on both edges with its centre-line fixed, so
 *  it stays aligned with its neighbours — while the others are left untouched.
 *  Extra ring thickness in viewBox units. */
const EMPHASIS_GROW = 2;
const EMPHASIS_TRANSITION = "stroke-width 150ms ease, d 150ms ease, r 150ms ease";

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
  onSegmentHover,
  onSegmentLeave,
  emphasizeOnHover = false,
  children,
  className,
  ariaLabel,
}: DonutProps) => {
  const segmentsTotal = segments.reduce((sum, seg) => sum + Math.max(0, seg.value), 0);
  // Gauge full-scale denominator (ring): segments + the leftover "available" band,
  // so a segment's angular share = value / ringTotal — the same fraction the arc
  // is drawn with, and what the hover hit-test maps the cursor angle against.
  const isRing = variant !== "pie";
  const leftover = isRing && capacity != null ? Math.max(0, capacity - segmentsTotal) : 0;
  const ringTotal = segmentsTotal + leftover || 1;
  // Stable prefix for the reveal-mask id (unique across mounted Donuts).
  const uid = useId();
  // Which segment the cursor is over (segments.length === the empty "available"
  // band). Only tracked when `emphasizeOnHover` — feeds the arc highlight.
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Report a hovered segment to the caller (e.g. a tooltip) and, when emphasis is
  // on, track it internally to drive the arc highlight — one hit-test feeds both.
  const reportHover = (index: number, event: MouseEvent<SVGSVGElement>) => {
    onSegmentHover?.(index, event);
    if (emphasizeOnHover) {
      setHoveredIndex(index);
    }
  };
  const reportLeave = () => {
    onSegmentLeave?.();
    if (emphasizeOnHover) {
      setHoveredIndex(null);
    }
  };

  // Hit-test the cursor against the ring band: resolve its angle to a segment
  // (clockwise from 12 o'clock, same as the arcs), reporting the segment with the
  // event so the caller can drive a follow-cursor tooltip — no per-arc handlers,
  // so the SVG stays a single labelled image. The center hole, the empty
  // "available" band, and outside the band all report a leave (no tooltip).
  const handleMove = (event: MouseEvent<SVGSVGElement>) => {
    if ((!onSegmentHover && !emphasizeOnHover) || !isRing) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const scale = (rect.width || 1) / 100; // viewBox spans 100 units
    const dx = (event.clientX - (rect.left + CX * scale)) / scale;
    const dy = (event.clientY - (rect.top + CY * scale)) / scale;
    const radius = Math.hypot(dx, dy);
    if (radius < 50 - thickness - HIT_TOL || radius > 50 + HIT_TOL) {
      reportLeave();
      return;
    }
    const fraction = angleFromCenter(dx, dy) / 360;
    let acc = 0;
    for (let i = 0; i < segments.length; i++) {
      acc += Math.max(0, segments[i].value) / ringTotal;
      if (fraction <= acc) {
        reportHover(i, event);
        return;
      }
    }
    // Past the solid segments: the empty "available" band (index === segments.length)
    // when there is a leftover, else no target.
    if (leftover > 0) {
      reportHover(segments.length, event);
    } else {
      reportLeave();
    }
  };

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
    const growStyle = (dash: number) =>
      ({ "--pfa-circ": circumference, "--pfa-dash": dash, "--pfa-gap": circumference - dash }) as CSSProperties;

    // Keep each arc's original segment index: zero-value segments are skipped here
    // but the hover hit-test still reports positions against the full `segments`
    // array, so the highlight must match on that index, not the arc's position.
    const solidArcs: { dash: number; offset: number; color: string; index: number }[] = [];
    let offset = 0;
    for (let si = 0; si < segments.length; si++) {
      const dash = (Math.max(0, segments[si].value) / ringTotal) * circumference;
      if (dash > 0) {
        solidArcs.push({ dash, offset, color: segments[si].color, index: si });
      }
      offset += dash;
    }

    // The empty "available" band — a hollow band, same width as the solid arcs but
    // only traced by a fine dotted outline (annularSectorPath), interior see-through.
    // Its own dash array carries the dot pattern, so it can't grow via that; instead
    // it's revealed through a mask whose band grows with the same pfa-donut-grow
    // keyframe — the empty band fills in lockstep with the solid arcs.
    const emptyDash = (leftover / ringTotal) * circumference;
    const emptyFull = emptyDash >= circumference - 0.01;
    const rInner = 50 - thickness + REMAINING_INSET;
    const rOuter = 50 - REMAINING_INSET;
    // When the empty "available" band is the hovered segment, widen it on both edges
    // (the same symmetric grow as the solid arcs) so its dotted outline reads thicker.
    const bandActive = emphasizeOnHover && hoveredIndex === segments.length;
    const bandGrow = bandActive ? EMPHASIS_GROW / 2 : 0;
    const rInnerHover = rInner - bandGrow;
    const rOuterHover = rOuter + bandGrow;
    const bandStyle: CSSProperties | undefined = emphasizeOnHover ? { transition: EMPHASIS_TRANSITION } : undefined;
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
          {solidArcs.map((a, i) => {
            const active = emphasizeOnHover && hoveredIndex === a.index;
            const arcStyle: CSSProperties = {
              ...(animate ? growStyle(a.dash) : {}),
              ...(emphasizeOnHover
                ? {
                    // thicken in place (centre-line stays at r) → grows on both edges
                    // and stays aligned with the neighbouring arc at their junction
                    strokeWidth: active ? thickness + EMPHASIS_GROW : thickness,
                    transition: EMPHASIS_TRANSITION,
                  }
                : {}),
            };
            return (
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
                style={arcStyle}
              />
            );
          })}
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
                  r={rOuterHover}
                  {...dotProps}
                  style={bandStyle}
                />
                <circle
                  cx={CX}
                  cy={CY}
                  r={rInnerHover}
                  {...dotProps}
                  style={bandStyle}
                />
              </g>
            ) : (
              <path
                d={annularSectorPath(
                  CX,
                  CY,
                  rInnerHover,
                  rOuterHover,
                  (offset / circumference) * 360,
                  ((offset + emptyDash) / circumference) * 360,
                )}
                {...dotProps}
                {...maskProps}
                style={bandStyle}
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
      {/* Hover lives on the <svg> (the labelled graphic) so it stays a single
          role="img" for assistive tech; the center overlay is pointer-transparent
          so the cursor reaches the ring underneath it. */}
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        role="img"
        aria-label={ariaLabel}
        // overflow visible so the hovered arc's zoom isn't clipped by the viewBox edge
        style={emphasizeOnHover ? { overflow: "visible" } : undefined}
        onMouseMove={onSegmentHover || emphasizeOnHover ? handleMove : undefined}
        onMouseLeave={onSegmentHover || emphasizeOnHover ? reportLeave : undefined}
      >
        {body}
      </svg>
      {children && (
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">{children}</div>
      )}
    </div>
  );
};

export default Donut;
