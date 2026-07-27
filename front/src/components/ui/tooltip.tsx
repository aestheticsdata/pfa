"use client";

import { cn } from "@lib/utils";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { CursorPoint } from "@lib/dataviz/interfaces/dataVizTypes";
import type { ComponentProps, CSSProperties, ReactNode } from "react";

// Measure-then-position must run before paint to clamp the tooltip at the
// viewport edge without a flash; fall back to useEffect on the server.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Tooltip appear/disappear fade duration (ms). Tune here — both modes read it. */
const TOOLTIP_FADE_MS = 150;

/** Cursor mode geometry: gap kept from the pointer, margin kept from the viewport. */
const CURSOR_GAP = 16;
const VIEWPORT_EDGE = 12;

/**
 * The bubble — the single definition of what a tooltip looks like, worn by both
 * modes: translucent elevated surface, hairline border, mono type, tooltip
 * elevation. Colours come from tokens and are overridable per tooltip (skin).
 */
// `rounded-lg`, not `rounded-md`: on the Tailwind scale `lg` is the 10px the
// bubble has always had (`--r-md`), while `md` would shave it to 8px (§5 of
// docs/design-system.md — the two radius scales do not agree name for name).
const SURFACE =
  "num z-60 w-fit max-w-60 rounded-lg border border-line bg-surface-elev/92 px-2.5 py-2 text-xs leading-snug text-ink shadow-tooltip";

interface TooltipSkin {
  /** Full CSS background — defaults to the elevated surface token. */
  background?: string;
  /** Text colour, for use on a coloured background. */
  color?: string;
  /** Border colour — defaults to the hairline token. Pass a light tint of the
   *  background for coloured tooltips so the edge stays coherent and visible. */
  borderColor?: string;
  /** Max width in px (default 240) — widen for tooltips with longer rows. */
  maxWidth?: number;
}

/** Skin → inline overrides. Anything left undefined falls back to {@link SURFACE}. */
const surfaceStyle = ({ background, color, borderColor, maxWidth }: TooltipSkin): CSSProperties => ({
  background,
  color,
  borderColor,
  maxWidth,
});

interface CursorModeProps extends TooltipSkin {
  /** Follows the pointer (mouse-only by nature) — for charts and dense rows. */
  mode: "cursor";
  /** Cursor position, or null when hidden (triggers the fade-out). */
  point: CursorPoint | null;
  /** Bubble content. Guard it with the same hover state that feeds `point`. */
  children: ReactNode;
}

interface AnchorModeProps
  extends TooltipSkin,
    Pick<ComponentProps<typeof TooltipPrimitive.Content>, "side" | "sideOffset" | "align" | "avoidCollisions"> {
  /** Anchored to its trigger, keyboard/focus/Escape accessible (Radix). */
  mode: "anchor";
  /** The trigger — rendered `asChild`, so it must be a single element that
   *  forwards props and ref. */
  children: ReactNode;
  /** Bubble content. */
  content: ReactNode;
  /** Open on mount, without hover (static captures). */
  defaultOpen?: boolean;
}

type TooltipProps = CursorModeProps | AnchorModeProps;

/** What the cursor tooltip last showed — kept so it can fade out after `point`
 *  goes null and the consumer has already stopped rendering its body. */
interface Snapshot {
  point: CursorPoint;
  children: ReactNode;
  background?: string;
  color?: string;
  borderColor?: string;
}

/**
 * Mouse-following engine: portals to <body>, follows the cursor and clamps
 * inside the viewport. Fades in on appear and out on disappear (opacity
 * transition + delayed unmount) so it is never abrupt. It snapshots the last
 * shown content, so consumers can render it unconditionally and pass
 * `point={hover}` (null to hide) with the body guarded by the same hover.
 */
const CursorModeTooltip = ({ point, children, background, color, borderColor, maxWidth }: CursorModeProps) => {
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
    let left = snapshot.point.x + CURSOR_GAP;
    if (left + width + VIEWPORT_EDGE > window.innerWidth) {
      left = snapshot.point.x - CURSOR_GAP - width;
    }
    let top = snapshot.point.y + CURSOR_GAP;
    if (top + height + VIEWPORT_EDGE > window.innerHeight) {
      top = snapshot.point.y - CURSOR_GAP - height;
    }
    setPos({ left: Math.max(VIEWPORT_EDGE, left), top: Math.max(VIEWPORT_EDGE, top) });
  }, [snapshot]);

  if (!snapshot) {
    return null;
  }

  return createPortal(
    <div
      ref={ref}
      className={cn(
        SURFACE,
        "pointer-events-none fixed transition-opacity ease-out",
        visible ? "opacity-100" : "opacity-0",
      )}
      style={{
        left: pos ? pos.left : snapshot.point.x + CURSOR_GAP,
        top: pos ? pos.top : snapshot.point.y + CURSOR_GAP,
        transitionDuration: `${TOOLTIP_FADE_MS}ms`,
        ...surfaceStyle({
          background: snapshot.background,
          color: snapshot.color,
          borderColor: snapshot.borderColor,
          maxWidth,
        }),
      }}
    >
      {snapshot.children}
    </div>,
    document.body,
  );
};

/**
 * Anchored engine (Radix): positions itself against its trigger and keeps the
 * keyboard/focus/Escape behaviour a hover-only tooltip cannot offer. Radix
 * drives the same fade as the cursor mode, as a CSS animation — it waits for
 * the exit animation before unmounting, which a transition would not do.
 */
const AnchorModeTooltip = ({
  children,
  content,
  side,
  sideOffset = 6,
  align,
  avoidCollisions,
  defaultOpen,
  ...skin
}: AnchorModeProps) => (
  <TooltipPrimitive.Provider delayDuration={0}>
    <TooltipPrimitive.Root defaultOpen={defaultOpen}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          data-slot="tooltip-content"
          side={side}
          sideOffset={sideOffset}
          align={align}
          avoidCollisions={avoidCollisions}
          className={cn(SURFACE, "animate-in fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0")}
          // The duration goes through tw-animate-css's own custom property, not
          // `animationDuration`: Radix's popper rewrites the `animation` shorthand
          // on this node (it suppresses the animation until it is positioned),
          // which would wipe an inline longhand and silently strand the fade at
          // the library default.
          style={{ "--tw-animation-duration": `${TOOLTIP_FADE_MS}ms`, ...surfaceStyle(skin) } as CSSProperties}
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  </TooltipPrimitive.Provider>
);

/**
 * The app's only tooltip. One surface, two positioning engines picked by `mode`
 * — they are two interaction models (follow the pointer vs sit on an element),
 * so the component routes between them rather than merging them:
 *
 * - `mode="cursor"` — follows the mouse, driven by a `point` (see `useCursorHover`).
 * - `mode="anchor"` — pinned to its trigger, accessible to keyboard users.
 */
const Tooltip = (props: TooltipProps) =>
  props.mode === "cursor" ? <CursorModeTooltip {...props} /> : <AnchorModeTooltip {...props} />;

export { Tooltip };
