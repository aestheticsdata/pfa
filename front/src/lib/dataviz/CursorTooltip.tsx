"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { ReactNode } from "react";

// Measure-then-position must run before paint to clamp the tooltip at the
// viewport edge without a flash; fall back to useEffect on the server.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Tooltip appear/disappear fade duration (ms). Tune here — applies everywhere. */
export const TOOLTIP_FADE_MS = 150;

export interface CursorPoint {
  /** Cursor X in viewport coords (clientX). */
  x: number;
  /** Cursor Y in viewport coords (clientY). */
  y: number;
}

interface CursorTooltipProps {
  /** Cursor position, or null when hidden (triggers the fade-out). */
  point: CursorPoint | null;
  children: ReactNode;
  /** Full CSS background — defaults to the elevated surface skin (matches CategoryBarTooltip). */
  background?: string;
  /** Text colour, for use on a coloured background. */
  color?: string;
  /** Border colour — defaults to the hairline token. Pass a light tint of the
   *  background for coloured tooltips so the edge stays coherent and visible. */
  borderColor?: string;
  /** Max width in px (default 240) — widen for tooltips with longer rows. */
  maxWidth?: number;
}

interface Snapshot {
  point: CursorPoint;
  children: ReactNode;
  background?: string;
  color?: string;
  borderColor?: string;
}

/**
 * Generic mouse-following tooltip: portals to <body>, follows the cursor and
 * clamps inside the viewport. Fades in on appear and out on disappear (opacity
 * transition + delayed unmount) so it is never abrupt. It snapshots the last
 * shown content, so consumers can render it unconditionally and pass
 * `point={hover}` (null to hide) with the body guarded by the same hover.
 */
const CursorTooltip = ({ point, children, background, color, borderColor, maxWidth }: CursorTooltipProps) => {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Shown → capture the latest content and reveal on the next frame (so a fresh
  // mount transitions from opacity 0). Hidden → fade out, then unmount.
  useEffect(() => {
    if (point) {
      setSnapshot({ point, children, background, color, borderColor });
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const id = setTimeout(() => setSnapshot(null), TOOLTIP_FADE_MS + 40);
    return () => clearTimeout(id);
  }, [point, children, background, color, borderColor]);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!snapshot || !el) {
      return;
    }
    const { width, height } = el.getBoundingClientRect();
    const GAP = 16;
    const EDGE = 12;
    let left = snapshot.point.x + GAP;
    if (left + width + EDGE > window.innerWidth) {
      left = snapshot.point.x - GAP - width;
    }
    let top = snapshot.point.y + GAP;
    if (top + height + EDGE > window.innerHeight) {
      top = snapshot.point.y - GAP - height;
    }
    setPos({ left: Math.max(EDGE, left), top: Math.max(EDGE, top) });
  }, [snapshot]);

  if (!snapshot) {
    return null;
  }

  return createPortal(
    <div
      ref={ref}
      className="num"
      style={{
        position: "fixed",
        zIndex: 60,
        pointerEvents: "none",
        left: pos ? pos.left : snapshot.point.x + 16,
        top: pos ? pos.top : snapshot.point.y + 16,
        opacity: visible ? 1 : 0,
        transition: `opacity ${TOOLTIP_FADE_MS}ms ease-out`,
        maxWidth: maxWidth ?? 240,
        padding: "8px 10px",
        fontSize: "12px",
        lineHeight: 1.35,
        background:
          snapshot.background ?? "color-mix(in oklch, var(--surface-elev, oklch(0.185 0.006 250)) 92%, transparent)",
        color: snapshot.color ?? "var(--ink)",
        border: `1px solid ${snapshot.borderColor ?? "var(--line, oklch(0.27 0.008 250))"}`,
        borderRadius: "var(--r-md, 10px)",
        boxShadow: "0 16px 40px oklch(0 0 0 / 0.5), inset 0 1px 0 oklch(1 0 0 / 0.05)",
      }}
    >
      {snapshot.children}
    </div>,
    document.body,
  );
};

export default CursorTooltip;
