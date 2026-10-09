"use client";

import { Button } from "@components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@components/ui/dialog";
import useTranslations from "@i18n/useTranslations";
import { useState } from "react";

import type { ReactNode } from "react";

interface BatchModalProps {
  title: string;
  submitLabel: string;
  submitDisabled?: boolean;
  /** Restyles the submit, e.g. to match the bar action that opened the modal (PFA-198). */
  submitClassName?: string;
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

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && close()}
    >
      <DialogContent
        data-testid={testId}
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
            onClick={() => {
              if (onSubmit()) close();
            }}
          >
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchModal;
