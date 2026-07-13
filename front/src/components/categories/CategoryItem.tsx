"use client";

import CategoryFormModal from "@components/categories/CategoryFormModal";
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
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import type { Category } from "@src/schemas/categories";

interface CategoryItemProps {
  category: Category;
  /** number of spendings in this category (all history) */
  used: number;
  /** share of total spending, already computed (percent) */
  share: number;
  /** other category names (lowercased) for the edit clash-check */
  takenNames: string[];
  onSave: (name: string, color: string) => void;
  onDelete: () => void;
}

const IC =
  "grid size-[26px] place-items-center rounded-[6px] border border-line bg-bg text-ink-4 transition-colors hover:border-ink-4 hover:bg-bg-hi hover:text-ink";

const pct1 = (value: number): string => value.toFixed(1).replace(".", ",");

const CategoryItem = ({ category, used, share, takenNames, onSave, onDelete }: CategoryItemProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <>
      <div className="pfa-card pfa-card-hover flex flex-col gap-2.5 rounded-[10px] px-[15px] pb-3 pt-[13px]">
        <div className="flex items-center gap-2.5">
          <span
            className="h-5 w-1 flex-none rounded-[2px]"
            style={{ background: category.color || "#94a3b8" }}
          />
          <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium capitalize text-ink">{category.name}</span>
          <span className="flex flex-none gap-1.5">
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className={IC}
              aria-label="Modifier le nom et la couleur"
              title="Modifier le nom et la couleur"
            >
              <Pencil className="size-3" />
            </button>
            <button
              type="button"
              onClick={() => setIsDeleteOpen(true)}
              className={cn(IC, "hover:border-neg hover:bg-[oklch(0.72_0.17_25/0.10)] hover:text-neg")}
              aria-label="Supprimer la catégorie"
              title="Supprimer la catégorie"
            >
              <Trash2 className="size-3" />
            </button>
          </span>
        </div>

        <span className="font-mono text-[11.5px] text-ink-4">
          {used === 0 ? (
            "nouvelle catégorie · jamais utilisée"
          ) : (
            <>
              <b className="font-medium text-ink-2">{pct1(share)} %</b> des dépenses{" "}
              <span className="mx-1.5 text-ink-5">·</span>
              <b className="font-medium text-ink-2">{used.toLocaleString("fr-FR")}</b> fois
            </>
          )}
        </span>
      </div>

      <CategoryFormModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        mode="edit"
        initialName={category.name}
        initialColor={category.color}
        takenNames={takenNames}
        onSubmit={onSave}
      />

      <AlertDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="capitalize">Supprimer la catégorie « {category.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les dépenses associées n&apos;auront plus de catégorie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CategoryItem;
