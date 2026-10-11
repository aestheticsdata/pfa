"use client";

import { cx } from "@lib/classNames/cx";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import type { ComponentProps } from "react";

/**
 * shadcn's dialog (as in PFA's `components/ui/dialog.tsx`), on the back-office's tokens: Radix
 * handles focus trap, Escape, outside click and scroll lock. A bottom sheet on a phone, centred
 * from 700px. Compose it through `Modal` unless a screen needs the raw parts.
 */
export const Dialog = DialogPrimitive.Root;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({ className, children, ...props }: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-12 bg-scrim-strong" />
      <DialogPrimitive.Content
        className={cx(
          "fixed inset-x-0 bottom-0 z-12 flex max-h-sheet-max flex-col overflow-hidden rounded-t-card border border-b-0 border-line bg-panel shadow-float focus:outline-none",
          "tablet:inset-x-auto tablet:bottom-auto tablet:top-1/2 tablet:left-1/2 tablet:w-[calc(100%-3rem)] tablet:max-w-modal tablet:-translate-x-1/2 tablet:-translate-y-1/2 tablet:rounded-card tablet:border-b",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
