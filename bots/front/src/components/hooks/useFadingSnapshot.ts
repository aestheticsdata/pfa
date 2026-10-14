"use client";

import { TOOLTIP_FADE_MS } from "@components/ui/tooltipSurface";
import { useEffect, useState } from "react";

import type { CursorPoint } from "@components/hooks/interfaces/cursorTypes";
import type { ReactNode } from "react";

interface Snapshot {
  point: CursorPoint;
  content: ReactNode;
}

/**
 * What the cursor tooltip last showed, kept through its fade-out after `point` goes null (the
 * caller has stopped rendering the content by then). Reveals on the next frame, so a fresh mount
 * fades in from 0.
 */
export default function useFadingSnapshot(point: CursorPoint | null, content: ReactNode) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (point) {
      setSnapshot({ point, content });
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    setVisible(false);
    const timer = setTimeout(() => setSnapshot(null), TOOLTIP_FADE_MS + 40);
    return () => clearTimeout(timer);
  }, [point, content]);
  return { snapshot, visible };
}
