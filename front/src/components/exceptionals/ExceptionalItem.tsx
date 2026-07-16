"use client";

import { CategoryTag } from "@components/categories/CategoryTag";
import useExceptionals from "@components/exceptionals/services/useExceptionals";
import ConfirmDeleteDialog from "@components/shared/ConfirmDeleteDialog";
import { IconButton } from "@components/shared/IconButton";
import { euro } from "@lib/format";
import exceptionals from "@text/exceptionals";
import format from "date-fns/format";
import { fr } from "date-fns/locale";
import parseISO from "date-fns/parseISO";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import type { ExceptionalItem as ExceptionalItemType } from "@src/schemas/exceptionals";

interface ExceptionalItemProps {
  item: ExceptionalItemType;
  onEdit: (item: ExceptionalItemType) => void;
  monthlyAverage: number;
}

const ExceptionalItem = ({ item, onEdit, monthlyAverage }: ExceptionalItemProps) => {
  const { deleteExceptional } = useExceptionals();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { actions } = exceptionals;

  const dateLabel = format(parseISO(item.date), "dd MMM", { locale: fr });
  const amount = euro(item.amount);
  const budgetMonths = monthlyAverage > 0 ? (Number(item.amount) / monthlyAverage).toFixed(1) : null;

  const onDelete = () => {
    deleteExceptional.mutate({ id: item.ID });
    setIsDeleteOpen(false);
  };

  return (
    <>
      <div className="exc-item">
        <span className="exc-date">{dateLabel}</span>

        <div className="exc-main">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="exc-label truncate"
              title={item.label}
            >
              {item.label}
            </span>
            {item.categoryName && <CategoryTag color={item.categoryColor}>{item.categoryName}</CategoryTag>}
          </div>
          {item.description && (
            <span
              className="exc-impact truncate"
              title={item.description}
            >
              {item.description}
            </span>
          )}
          {budgetMonths && (
            <span className="exc-impact">
              ≈ <b>{budgetMonths}</b> mois de budget régulier
            </span>
          )}
        </div>

        <span className="exc-amt">{amount} €</span>

        <span className="exc-acts">
          <IconButton
            variant="bordered"
            size={7}
            onClick={() => onEdit(item)}
            aria-label={actions.edit}
            title={actions.edit}
          >
            <Pencil />
          </IconButton>
          <IconButton
            variant="danger"
            size={7}
            onClick={() => setIsDeleteOpen(true)}
            aria-label={actions.delete}
            title={actions.delete}
          >
            <Trash2 />
          </IconButton>
        </span>
      </div>

      <ConfirmDeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={exceptionals.item.deleteConfirmTitle(item.label)}
        onConfirm={onDelete}
      />
    </>
  );
};

export default ExceptionalItem;
