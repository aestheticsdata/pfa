"use client";

import { CategoryTag } from "@components/categories/CategoryTag";
import useExceptionals from "@components/exceptionals/services/useExceptionals";
import ConfirmDeleteDialog from "@components/shared/ConfirmDeleteDialog";
import { IconButton } from "@components/shared/IconButton";
import { interpolate } from "@i18n/interpolate";
import useDateLocale from "@i18n/useDateLocale";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import format from "date-fns/format";
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
  const { euro, pct1 } = useFormat();
  const exceptionals = useTranslations("exceptionals");
  const dateLocale = useDateLocale();
  const { deleteExceptional } = useExceptionals();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { actions } = exceptionals;

  const dateLabel = format(parseISO(item.date), "dd MMM", { locale: dateLocale });
  const amount = euro(item.amount);
  const budgetMonths = monthlyAverage > 0 ? pct1(Number(item.amount) / monthlyAverage) : null;

  const onDelete = () => {
    deleteExceptional.mutate({ id: item.ID });
    setIsDeleteOpen(false);
  };

  return (
    <>
      <div className="group grid grid-cols-[76px_minmax(0,1fr)_auto_auto] items-center gap-x-4.5 gap-y-4.5 border-b border-line-soft px-5 py-4 last:border-b-0 max-md:grid-cols-[64px_1fr_auto] max-md:grid-rows-[auto_auto] max-md:gap-x-3 max-md:gap-y-2.5 max-md:px-4 max-md:py-3.5">
        <span className="rounded-sm border border-line-soft bg-surface-hi py-1.5 text-center font-mono text-xs capitalize tabular-nums text-ink-3 max-md:col-start-1 max-md:row-start-1 max-md:self-start">
          {dateLabel}
        </span>

        <div className="flex min-w-0 flex-col gap-0.75 max-md:col-start-2 max-md:col-end-4 max-md:row-start-1 max-md:row-end-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="truncate text-sm font-medium text-ink"
              title={item.label}
            >
              {item.label}
            </span>
            {item.categoryName && <CategoryTag color={item.categoryColor}>{item.categoryName}</CategoryTag>}
          </div>
          {item.description && (
            <span
              className="truncate text-xs text-ink-3"
              title={item.description}
            >
              {item.description}
            </span>
          )}
          {budgetMonths && (
            <span className="text-xs text-ink-3">
              {interpolate(exceptionals.item.budgetMonths, {
                months: <b className="font-medium text-ink-2">{budgetMonths}</b>,
              })}
            </span>
          )}
        </div>

        <span className="whitespace-nowrap font-mono text-base font-medium tabular-nums text-ink max-md:col-start-2 max-md:row-start-2 max-md:justify-self-start max-md:self-center">
          {amount} €
        </span>

        <span className="flex gap-1.5 opacity-0 transition-opacity duration-100 group-hover:opacity-100 max-md:col-start-3 max-md:row-start-2 max-md:justify-self-end max-md:opacity-100 [@media(hover:none)]:opacity-100">
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
