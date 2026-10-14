"use client";

import useFadingSnapshot from "@components/hooks/useFadingSnapshot";
import useThemeRoot from "@components/hooks/useThemeRoot";
import useViewportClamp from "@components/hooks/useViewportClamp";
import { TOOLTIP_SURFACE } from "@components/ui/tooltipSurface";
import { cx } from "@lib/classNames/cx";
import { useRef } from "react";
import { createPortal } from "react-dom";

import type { CursorTooltipProps } from "@components/ui/interfaces/uiTypes";

/**
 * The tooltip that follows the pointer over a chart (PFA's cursor mode), on the shadcn tooltip's
 * surface: fades in and out, stays inside the viewport. Render it unconditionally with
 * `point={hover}`; its content is guarded by the same hover.
 */
const CursorTooltip = ({ point, children }: CursorTooltipProps) => {
  const root = useThemeRoot();
  const ref = useRef<HTMLDivElement>(null);
  const { snapshot, visible } = useFadingSnapshot(point, children);
  const position = useViewportClamp(ref, snapshot?.point ?? null);
  if (!snapshot || !position || !root) return null;
  return createPortal(
    <div
      ref={ref}
      role="tooltip"
      data-testid="cursor-tooltip"
      className={cx(TOOLTIP_SURFACE, "fixed transition-opacity duration-150", visible ? "opacity-100" : "opacity-0")}
      style={{ left: position.x, top: position.y }}
    >
      {snapshot.content}
    </div>,
    root,
  );
};

export default CursorTooltip;
