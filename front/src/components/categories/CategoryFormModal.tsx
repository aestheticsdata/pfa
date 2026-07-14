"use client";

import { cssColorToHex, paletteHex } from "@components/categories/helpers/categoryColors";
import { Overline, overlineClass } from "@components/shared/Overline";
import { Button } from "@components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { cn } from "@lib/utils";
import { useMemo, useState } from "react";

const LABEL = overlineClass;
const INPUT =
  "w-full rounded-[6px] border border-line bg-bg px-3 py-2.5 text-[14px] text-ink outline-none transition focus:border-accent-d";

interface CategoryFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialName?: string;
  initialColor?: string;
  /** Lowercased names already taken (excluding the one being edited). */
  takenNames?: string[];
  onSubmit: (name: string, color: string) => void;
}

/**
 * Inner form — mounted fresh each time the dialog opens (Radix unmounts
 * DialogContent when closed), so its state initializes from props with no reset
 * effect.
 */
const CategoryFormBody = ({
  mode,
  initialName = "",
  initialColor,
  takenNames = [],
  onSubmit,
  onCancel,
}: Omit<CategoryFormModalProps, "open" | "onOpenChange"> & {
  onCancel: () => void;
}) => {
  const swatches = useMemo(() => paletteHex(), []);
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(() => cssColorToHex(initialColor ?? swatches[7] ?? "#84c4f5"));
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) {
      setError("Le nom est requis.");
      return;
    }
    if (takenNames.includes(trimmed)) {
      setError("Cette catégorie existe déjà.");
      return;
    }
    onSubmit(trimmed, color);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{mode === "create" ? "Nouvelle catégorie" : "Modifier la catégorie"}</DialogTitle>
      </DialogHeader>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="cat-name"
            className={LABEL}
          >
            Nom
          </label>
          <input
            id="cat-name"
            className={INPUT}
            type="text"
            placeholder="Nom de la catégorie"
            autoComplete="off"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            // biome-ignore lint/a11y/noAutofocus: intentional focus when the modal opens
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-2.5">
          <Overline>Couleur</Overline>
          <div className="flex flex-wrap gap-2.5">
            {swatches.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => setColor(hex)}
                className={cn(
                  "size-[30px] rounded-[8px] border-2 transition-transform hover:scale-110",
                  color.toLowerCase() === hex.toLowerCase() ? "border-ink" : "border-transparent",
                )}
                style={{ background: hex }}
                aria-label={`Teinte ${hex}`}
              />
            ))}
          </div>
          <div className="mt-1 flex items-center gap-3">
            <span className="text-[12.5px] text-ink-3">Personnalisée</span>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-[30px] w-[46px] cursor-pointer rounded-[8px] border border-line bg-transparent p-0"
              aria-label="Couleur personnalisée"
            />
            <span className="font-mono text-[12.5px] text-ink-4">{color}</span>
          </div>
        </div>

        {error && <p className="text-[12.5px] text-neg">{error}</p>}
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
        >
          Annuler
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={submit}
        >
          {mode === "create" ? "Créer" : "Enregistrer"}
        </Button>
      </DialogFooter>
    </>
  );
};

const CategoryFormModal = ({ open, onOpenChange, onSubmit, ...bodyProps }: CategoryFormModalProps) => (
  <Dialog
    open={open}
    onOpenChange={onOpenChange}
  >
    <DialogContent className="sm:max-w-[452px]">
      <CategoryFormBody
        {...bodyProps}
        onSubmit={(name, color) => {
          onSubmit(name, color);
          onOpenChange(false);
        }}
        onCancel={() => onOpenChange(false)}
      />
    </DialogContent>
  </Dialog>
);

export default CategoryFormModal;
