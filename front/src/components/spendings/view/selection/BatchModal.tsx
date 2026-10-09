"use client";

import { Button } from "@components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@components/ui/dialog";
import useTranslations from "@i18n/useTranslations";
import { useState } from "react";

import type { KeyboardEvent, ReactNode } from "react";

interface BatchModalProps {
  title: string;
  submitLabel: string;
  submitDisabled?: boolean;
  /** Restyles the submit, e.g. to match the bar action that opened the modal (PFA-198). */
  submitClassName?: string;
  /** Enter anywhere in the modal submits it, like the button (PFA-199). */
  submitOnEnter?: boolean;
  testId: string;
  /** Returns false to keep the modal open (validation failed). */
  onSubmit: () => boolean;
  onClose: () => void;
  children: ReactNode;
}

/** Shell of the "Group N spendings" and "Shared receipt" modals (PFA-189). */
const BatchModal = ({
  title,
  submitLabel,
  submitDisabled,
  submitClassName,
  submitOnEnter,
  testId,
  onSubmit,
  onClose,
  children,
}: BatchModalProps) => {
  const spendings = useTranslations("spendings");
  const [open, setOpen] = useState(true);
  const close = () => {
    setOpen(false);
    setTimeout(onClose, 200);
  };
  const submit = () => {
    // Once closing, a second Enter (or a key repeat) must not send it again.
    if (!open || submitDisabled) return;
    if (onSubmit()) close();
  };
  // A focused button keeps its own Enter (Cancel, close, browse); an IME
  // composition keeps its Enter too.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!submitOnEnter || event.key !== "Enter" || event.nativeEvent.isComposing) return;
    if (event.target instanceof HTMLButtonElement) return;
    event.preventDefault();
    submit();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && close()}
    >
      <DialogContent
        data-testid={testId}
        onKeyDown={onKeyDown}
        className="gap-0 overflow-hidden border-line bg-surface-elev p-0 sm:max-w-135"
      >
        <DialogHeader className="border-b border-line-soft px-5.5 py-4.5 text-left">
          <DialogTitle className="pr-8 text-base font-semibold tracking-normal text-ink">{title}</DialogTitle>
        </DialogHeader>
        <div className="flex max-h-[min(78vh,720px)] flex-col gap-4.5 overflow-y-auto px-5.5 py-5.5">{children}</div>
        <DialogFooter className="gap-2.5 border-t border-line-soft px-5.5 py-4 sm:gap-2.5">
          <Button
            type="button"
            variant="muted"
            onClick={close}
          >
            {spendings.actions.cancel}
          </Button>
          <Button
            type="button"
            variant="primary"
            data-testid={`${testId}-submit`}
            disabled={submitDisabled}
            className={submitClassName}
            onClick={submit}
          >
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchModal;
