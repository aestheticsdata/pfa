"use client";

import { useState } from "react";
import format from "date-fns/format";
import parseISO from "date-fns/parseISO";
import { Edit2, Trash2 } from "lucide-react";
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
import { SurfaceCard } from "@components/ui/surface-card";
import useExceptionals from "@components/exceptionals/services/useExceptionals";

import type { ExceptionalItem as ExceptionalItemType } from "@src/schemas/exceptionals";

interface ExceptionalItemProps {
  item: ExceptionalItemType;
  onEdit: (item: ExceptionalItemType) => void;
  monthlyAverage: number;
}

const ExceptionalItem = ({ item, onEdit, monthlyAverage }: ExceptionalItemProps) => {
  const { deleteExceptional } = useExceptionals();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const accent = item.categoryColor ?? "#94a3b8";
  const dateLabel = format(parseISO(item.date), "dd/MM/yyyy");
  const amount = Number(item.amount).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const onDelete = () => {
    deleteExceptional.mutate({ id: item.ID });
    setIsDeleteOpen(false);
  };

  return (
    <>
      <SurfaceCard padding="md" className="group relative pl-6">
        <div
          className="absolute top-3 bottom-3 left-3 w-1 rounded-full"
          style={{ backgroundColor: accent }}
        />
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="text-gray-100 font-medium truncate">
              {item.label}
            </div>
            <div className="text-gray-500 text-xs tabular-nums">
              {dateLabel}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="text-gray-100 text-lg font-semibold tabular-nums">
              {amount} €
            </div>
            {item.categoryName && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                style={{
                  backgroundColor: `${accent}33`,
                  color: accent,
                  border: `1px solid ${accent}66`,
                }}
              >
                {item.categoryName}
              </span>
            )}
          </div>
        </div>

        {item.description && (
          <div className="mt-2 text-gray-400 text-sm">{item.description}</div>
        )}

        {monthlyAverage > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-800/60 text-gray-500 text-xs">
            Impact budget : {(Number(item.amount) / monthlyAverage).toFixed(1)} mois de budget régulier
          </div>
        )}

        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="w-7 h-7 bg-gray-700/80 hover:bg-gray-600 rounded flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Modifier"
            title="Modifier"
          >
            <Edit2 className="w-3.5 h-3.5 text-gray-300" />
          </button>
          <button
            type="button"
            onClick={() => setIsDeleteOpen(true)}
            className="w-7 h-7 bg-gray-700/80 hover:bg-red-600 rounded flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Supprimer"
            title="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5 text-gray-300 hover:text-white" />
          </button>
        </div>
      </SurfaceCard>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="bg-gradient-to-br from-[#121212] via-[#0a0a0a] to-black border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-100">
              Supprimer {item.label} ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700/50 bg-[#0c0c0c] text-gray-200 hover:bg-[#151515]">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ExceptionalItem;
