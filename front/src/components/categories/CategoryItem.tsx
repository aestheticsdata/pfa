"use client";

import { CategoryColorDot } from "@components/categories/CategoryColorDot";
import CategoryFormModal from "@components/categories/CategoryFormModal";
import ConfirmDeleteDialog from "@components/shared/ConfirmDeleteDialog";
import { IconButton } from "@components/shared/IconButton";
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

const pct1 = (value: number): string => value.toFixed(1).replace(".", ",");

const CategoryItem = ({ category, used, share, takenNames, onSave, onDelete }: CategoryItemProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <>
      <div className="pfa-card pfa-card-hover flex flex-col gap-2.5 rounded-lg px-4 pb-3 pt-3.5">
        <div className="flex items-center gap-2.5">
          <CategoryColorDot
            color={category.color}
            className="h-5 w-1 flex-none"
          />
          <span className="min-w-0 flex-1 truncate text-sm font-medium capitalize text-ink">{category.name}</span>
          <span className="flex flex-none gap-1.5">
            <IconButton
              variant="bordered"
              size={6}
              onClick={() => setIsEditOpen(true)}
              aria-label="Modifier le nom et la couleur"
              title="Modifier le nom et la couleur"
            >
              <Pencil />
            </IconButton>
            <IconButton
              variant="danger"
              size={6}
              onClick={() => setIsDeleteOpen(true)}
              aria-label="Supprimer la catégorie"
              title="Supprimer la catégorie"
            >
              <Trash2 />
            </IconButton>
          </span>
        </div>

        <span className="font-mono text-2xs text-ink-4">
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

      <ConfirmDeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={`Supprimer la catégorie « ${category.name} » ?`}
        titleClassName="capitalize"
        description="Cette action est irréversible. Les dépenses associées n'auront plus de catégorie."
        onConfirm={onDelete}
      />
    </>
  );
};

export default CategoryItem;
