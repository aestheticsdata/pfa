"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@components/ui/alert-dialog";
import { cn } from "@lib/utils";

import type { ReactNode } from "react";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  /** Defaults to the standard irreversible-action warning. */
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Extra classes on the title (e.g. `capitalize`). */
  titleClassName?: string;
  onConfirm: () => void;
}

/**
 * Shared delete-confirmation modal: title + irreversible warning + cancel / danger
 * action. Unifies the near-identical AlertDialogs across Catégories, Exceptionnels
 * and the invoice modal so the destructive action reads the same everywhere.
 *
 * The action overrides the AlertDialogAction default variant with the danger tokens
 * (incl. `hover:bg-danger-solid` to cancel the default's `hover:bg-primary`).
 */
const ConfirmDeleteDialog = ({
  open,
  onOpenChange,
  title,
  description = "Cette action est irréversible.",
  confirmLabel = "Supprimer",
  cancelLabel = "Annuler",
  titleClassName,
  onConfirm,
}: ConfirmDeleteDialogProps) => (
  <AlertDialog
    open={open}
    onOpenChange={onOpenChange}
  >
    <AlertDialogContent className="border-line bg-surface-elev">
      <AlertDialogHeader>
        <AlertDialogTitle className={cn("text-ink", titleClassName)}>{title}</AlertDialogTitle>
        <AlertDialogDescription className="text-ink-3">{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          className="bg-danger-solid text-on-danger hover:bg-danger-solid hover:brightness-110"
        >
          {confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default ConfirmDeleteDialog;
