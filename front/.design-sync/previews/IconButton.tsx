import { ChevronLeft, ChevronRight, ImageIcon, Menu, Pencil, Plus, Trash2, X } from "lucide-react";
import { GlowCard, IconButton, MoneyAmount } from "pfa-next";

/**
 * `bordered` and `danger` share the same resting chrome — `danger` only diverges on
 * hover (danger border/surface + `text-neg`), which a static capture cannot show.
 */
export const Variants = () => (
  <div className="flex flex-wrap items-start gap-3">
    <div className="flex flex-col items-center gap-1.5">
      <IconButton variant="bordered" size={8} aria-label="Modifier la dépense">
        <Pencil />
      </IconButton>
      <span className="text-3xs tracking-caps text-ink-4">BORDERED</span>
    </div>
    <div className="flex flex-col items-center gap-1.5">
      <IconButton variant="ghost" size={8} aria-label="Fermer le menu">
        <X />
      </IconButton>
      <span className="text-3xs tracking-caps text-ink-4">GHOST</span>
    </div>
    <div className="flex flex-col items-center gap-1.5">
      <IconButton variant="danger" size={8} aria-label="Supprimer la dépense">
        <Trash2 />
      </IconButton>
      <span className="text-3xs tracking-caps text-ink-4">DANGER</span>
    </div>
  </div>
);

export const Sizes = () => (
  <div className="flex flex-wrap items-center gap-3">
    <IconButton variant="bordered" size={5} aria-label="Mois précédent">
      <ChevronLeft />
    </IconButton>
    <IconButton variant="bordered" size={6} aria-label="Voir la facture">
      <ImageIcon />
    </IconButton>
    <IconButton variant="bordered" size={7} aria-label="Modifier">
      <Pencil />
    </IconButton>
    <IconButton variant="bordered" size={8} aria-label="Ajouter une dépense fixe">
      <Plus />
    </IconButton>
    <IconButton variant="bordered" size={9} aria-label="Ouvrir le menu">
      <Menu />
    </IconButton>
  </div>
);

export const RowActions = () => (
  <GlowCard className="flex items-center gap-3 p-4">
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm text-ink">Courses — Carrefour</p>
      <p className="num text-2xs text-ink-4">14 mai 2026 · Alimentation</p>
    </div>
    <MoneyAmount value={41.35} unit="€" className="num text-sm text-ink" decimalClassName="text-2xs text-ink-4" />
    <div className="flex items-center gap-1.5">
      <IconButton variant="bordered" size={7} title="Voir le reçu">
        <ImageIcon />
      </IconButton>
      <IconButton variant="bordered" size={7} title="Modifier">
        <Pencil />
      </IconButton>
      <IconButton variant="danger" size={7} title="Supprimer">
        <Trash2 />
      </IconButton>
    </div>
  </GlowCard>
);

export const MonthNav = () => (
  <div className="inline-flex items-center gap-2 rounded-md border border-line bg-surface-hi px-2 py-1">
    <IconButton variant="ghost" size={5} aria-label="Mois précédent">
      <ChevronLeft />
    </IconButton>
    <span className="num text-2xs tracking-caps text-ink-2">MAI 2026</span>
    <IconButton variant="ghost" size={5} aria-label="Mois suivant">
      <ChevronRight />
    </IconButton>
  </div>
);
