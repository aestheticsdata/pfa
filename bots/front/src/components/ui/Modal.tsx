"use client";

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@components/ui/Dialog";
import { cx } from "@lib/classNames/cx";
import { PANEL_TEXT } from "@text/panel";

import type { ModalProps } from "@components/ui/interfaces/uiTypes";

/**
 * The back-office's generic modal (PFA-206), on the model of PFA's: a header (title, optional
 * sub-line, close button), a free body that scrolls on its own, an optional footer for the buttons.
 * Any content goes in the body; `className` widens the box when a screen needs more room.
 */
const Modal = ({ open, onClose, title, sub, footer, testId, className, children }: ModalProps) => (
  <Dialog
    open={open}
    onOpenChange={(isOpen) => !isOpen && onClose()}
  >
    <DialogContent
      data-testid={testId}
      // No sub-line: Radix is told there is no description, rather than warning about a missing one.
      {...(sub ? {} : { "aria-describedby": undefined })}
      className={className}
    >
      <div className="flex items-start gap-3 border-b border-line-soft px-gut py-3.5 before:absolute before:top-1.5 before:left-1/2 before:h-1 before:w-9 before:-translate-x-1/2 before:rounded-xs before:bg-line tablet:px-5.5 tablet:before:hidden">
        <div className="min-w-0 flex-1">
          <DialogTitle className="m-0 text-base font-semibold">{title}</DialogTitle>
          {sub && <DialogDescription className="m-0 mt-1 font-mono text-xs text-dim">{sub}</DialogDescription>}
        </div>
        <DialogClose
          aria-label={PANEL_TEXT.close}
          className="-mr-1.5 grid size-8 shrink-0 cursor-pointer place-items-center rounded-ctl text-dim hover:bg-hover hover:text-text"
        >
          <svg
            viewBox="0 0 16 16"
            className="size-4"
            aria-hidden="true"
          >
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </DialogClose>
      </div>
      <div
        className={cx(
          "min-h-0 flex-1 overflow-y-auto px-gut py-4 tablet:px-5.5",
          !footer && "pb-sheet-bottom tablet:pb-5",
        )}
      >
        {children}
      </div>
      {footer && (
        <div className="flex justify-end gap-2.5 border-t border-line-soft px-gut pt-3 pb-sheet-bottom tablet:px-5.5 tablet:pb-3">
          {footer}
        </div>
      )}
    </DialogContent>
  </Dialog>
);

export default Modal;
