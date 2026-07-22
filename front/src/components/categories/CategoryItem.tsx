"use client";

import { CategoryColorDot } from "@components/categories/CategoryColorDot";
import CategoryFormModal from "@components/categories/CategoryFormModal";
import ConfirmDeleteDialog from "@components/shared/ConfirmDeleteDialog";
import GlowCard from "@components/shared/GlowCard";
import { IconButton } from "@components/shared/IconButton";
import { interpolate } from "@i18n/interpolate";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
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

const CategoryItem = ({ category, used, share, takenNames, onSave, onDelete }: CategoryItemProps) => {
  const { pct1, numberLocale } = useFormat();
  const categories = useTranslations("categories");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { item: t } = categories;

  return (
    <>
      <GlowCard
        hover
        className="flex flex-col gap-2.5 px-4 pb-3 pt-3.5"
      >
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
              aria-label={t.editAction}
              title={t.editAction}
            >
              <Pencil />
            </IconButton>
            <IconButton
              variant="danger"
              size={6}
              onClick={() => setIsDeleteOpen(true)}
              aria-label={t.deleteAction}
              title={t.deleteAction}
            >
              <Trash2 />
            </IconButton>
          </span>
        </div>

        <span className="font-mono text-2xs text-ink-4">
          {used === 0
            ? t.neverUsed
            : interpolate(t.usage(used), {
                share: <b className="font-medium text-ink-2">{pct1(share)} %</b>,
                dot: <span className="mx-1.5 text-ink-5">·</span>,
                count: <b className="font-medium text-ink-2">{used.toLocaleString(numberLocale)}</b>,
              })}
        </span>
      </GlowCard>

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
        title={t.deleteConfirmTitle(category.name)}
        titleClassName="capitalize"
        description={t.deleteConfirmDescription}
        onConfirm={onDelete}
      />
    </>
  );
};

export default CategoryItem;
