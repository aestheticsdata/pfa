"use client";

import useExceptionals from "@components/exceptionals/services/useExceptionals";
import ConfirmDeleteDialog from "@components/shared/ConfirmDeleteDialog";
import format from "date-fns/format";
import { fr } from "date-fns/locale";
import parseISO from "date-fns/parseISO";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import type { ExceptionalItem as ExceptionalItemType } from "@src/schemas/exceptionals";

const FALLBACK_COLOR = "#94a3b8";

interface ExceptionalItemProps {
  item: ExceptionalItemType;
  onEdit: (item: ExceptionalItemType) => void;
  monthlyAverage: number;
}

const ExceptionalItem = ({ item, onEdit, monthlyAverage }: ExceptionalItemProps) => {
  const { deleteExceptional } = useExceptionals();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const accent = item.categoryColor ?? FALLBACK_COLOR;
  const dateLabel = format(parseISO(item.date), "dd MMM", { locale: fr });
  const amount = Number(item.amount).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
            {item.categoryName && (
              <span
                className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{
                  color: accent,
                  backgroundColor: `${accent}22`,
                  border: `1px solid ${accent}44`,
                }}
              >
                {item.categoryName}
              </span>
            )}
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
          <button
            type="button"
            className="exc-ic"
            onClick={() => onEdit(item)}
            aria-label="Modifier"
            title="Modifier"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            className="exc-ic exc-ic-del"
            onClick={() => setIsDeleteOpen(true)}
            aria-label="Supprimer"
            title="Supprimer"
          >
            <Trash2 className="size-3.5" />
          </button>
        </span>
      </div>

      <ConfirmDeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={`Supprimer ${item.label} ?`}
        onConfirm={onDelete}
      />
    </>
  );
};

export default ExceptionalItem;
