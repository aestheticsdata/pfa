"use client";

import { useState } from "react";
import { Edit2, Trash2 } from "lucide-react";
import useCategories from "@components/spendings/services/useCategories";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Button } from "@components/ui/button";
import { cn } from "@lib/utils";

import type { Category } from "@src/schemas/categories";

interface CategoryItemProps {
  category: Category;
}

const PRESET_COLORS = [
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#fbbf24",
  "#ef4444",
  "#64748b",
];

const CategoryItem = ({ category }: CategoryItemProps) => {
  const { deleteCategory, updateCategory } = useCategories();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [draft, setDraft] = useState(category);

  const onDelete = () => {
    deleteCategory.mutate({ categoryID: category.ID });
    setIsDeleteOpen(false);
  };

  const onCommit = () => {
    updateCategory.mutate({ singleCategory: draft });
    setIsEditOpen(false);
  };

  return (
    <>
      <div className="group bg-gradient-to-br from-[#121212] via-[#0a0a0a] to-black rounded-lg border-2 border-gray-800/50 hover:border-cyan-500/50 transition-all p-3 flex items-center gap-3 shadow-xl">
        <button
          type="button"
          onClick={() => {
            setDraft(category);
            setIsEditOpen(true);
          }}
          className="w-1 h-8 rounded-full flex-shrink-0 hover:w-2 transition-all"
          style={{ backgroundColor: category.color ?? "#94a3b8" }}
          aria-label="Modifier la couleur"
        />

        <div className="flex-1 min-w-0">
          <div className="px-3 py-1.5 bg-gray-700/50 rounded text-gray-200 text-sm text-center truncate">
            {category.name}
          </div>
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => {
              setDraft(category);
              setIsEditOpen(true);
            }}
            className="w-7 h-7 bg-gray-700/80 hover:bg-gray-600 rounded flex items-center justify-center transition-colors"
            aria-label="Modifier"
          >
            <Edit2 className="w-3.5 h-3.5 text-gray-300" />
          </button>
          <button
            type="button"
            onClick={() => setIsDeleteOpen(true)}
            className="w-7 h-7 bg-gray-700/80 hover:bg-red-600 rounded flex items-center justify-center transition-colors"
            aria-label="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5 text-gray-300 hover:text-white" />
          </button>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-gradient-to-br from-[#121212] via-[#0a0a0a] to-black border-gray-800 sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-gray-100">
              Modifier la catégorie
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`name-${category.ID}`} className="text-gray-300">
                Nom
              </Label>
              <Input
                id={`name-${category.ID}`}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onCommit();
                }}
                className="bg-[#0c0c0c] border-gray-700/50 text-gray-100 focus-visible:border-cyan-500"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-gray-300">Couleur</Label>
              <div className="grid grid-cols-9 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setDraft({ ...draft, color })}
                    className={cn(
                      "w-7 h-7 rounded-md transition-transform",
                      draft.color === color &&
                        "ring-2 ring-offset-2 ring-offset-background ring-cyan-500 scale-110",
                    )}
                    style={{ backgroundColor: color }}
                    aria-label={color}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Label
                  htmlFor={`color-${category.ID}`}
                  className="text-gray-400 text-xs"
                >
                  Personnalisée
                </Label>
                <input
                  id={`color-${category.ID}`}
                  type="color"
                  value={draft.color ?? "#94a3b8"}
                  onChange={(e) =>
                    setDraft({ ...draft, color: e.target.value })
                  }
                  className="w-10 h-8 rounded-md bg-transparent border border-gray-700/50 cursor-pointer"
                />
                <span className="text-gray-500 text-xs">{draft.color}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              className="border-gray-700/50 bg-[#0c0c0c] text-gray-200 hover:bg-[#151515]"
            >
              Annuler
            </Button>
            <Button type="button" variant="cyan" onClick={onCommit}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="bg-gradient-to-br from-[#121212] via-[#0a0a0a] to-black border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-100">
              Supprimer la catégorie {category.name} ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Cette action est irréversible. Les dépenses associées
              n&apos;auront plus de catégorie.
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

export default CategoryItem;
