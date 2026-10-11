"use client";

import useThemeRoot from "@components/hooks/useThemeRoot";
import { cx } from "@lib/classNames/cx";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import type { ComponentProps } from "react";

/**
 * shadcn's dialog (as in PFA's `components/ui/dialog.tsx`), on the back-office's tokens: Radix
 * handles focus trap, Escape, outside click and scroll lock. A bottom sheet that slides up on a
 * phone, centred with a fade + zoom from 700px; mounted in the app's theme root. Compose it
 * through `Modal` unless a screen needs the raw parts.
 */
export const Dialog = DialogPrimitive.Root;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({ className, children, ...props }: ComponentProps<typeof DialogPrimitive.Content>) {
  const root = useThemeRoot();
  return (
    <DialogPrimitive.Portal container={root ?? undefined}>
      <DialogPrimitive.Overlay
        data-motion="dialog"
        className="fixed inset-0 z-12 bg-scrim-strong backdrop-blur-xs data-[state=closed]:animate-overlay-out data-[state=open]:animate-overlay-in"
      />
      <DialogPrimitive.Content
        data-motion="dialog"
        className={cx(
          "fixed inset-x-0 bottom-0 z-12 flex max-h-sheet-max flex-col overflow-hidden rounded-t-card border border-b-0 border-line bg-panel text-text shadow-float focus:outline-none",
          "data-[state=closed]:animate-sheet-out data-[state=open]:animate-sheet-in",
          "tablet:inset-x-auto tablet:bottom-auto tablet:top-1/2 tablet:left-1/2 tablet:w-full tablet:max-w-modal tablet:-translate-x-1/2 tablet:-translate-y-1/2 tablet:rounded-card tablet:border-b",
          "tablet:data-[state=closed]:animate-dialog-out tablet:data-[state=open]:animate-dialog-in",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
