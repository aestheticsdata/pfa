"use client";

import useThemeRoot from "@components/hooks/useThemeRoot";
import { TOOLTIP_SURFACE } from "@components/ui/tooltipSurface";
import { cx } from "@lib/classNames/cx";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import type { ComponentProps } from "react";

/**
 * shadcn's tooltip (as in PFA's `components/ui/tooltip.tsx`), on the back-office's tokens: anchored
 * to its trigger, open on hover and on keyboard focus, closed by Escape. Mounted in the app's theme
 * root. For a chart that follows the pointer, `CursorTooltip` wears the same surface.
 */
export function TooltipProvider({ delayDuration = 0, ...props }: ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

export function Tooltip(props: ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root
        data-slot="tooltip"
        {...props}
      />
    </TooltipProvider>
  );
}

export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({
  className,
  sideOffset = 6,
  children,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Content>) {
  const root = useThemeRoot();
  return (
    <TooltipPrimitive.Portal container={root ?? undefined}>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        data-motion="tooltip"
        sideOffset={sideOffset}
        className={cx(
          TOOLTIP_SURFACE,
          "data-[state=closed]:animate-tooltip-out data-[state=delayed-open]:animate-tooltip-in data-[state=instant-open]:animate-tooltip-in",
          className,
        )}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}
