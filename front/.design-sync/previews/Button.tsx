import { Download, Plus, Trash2 } from "lucide-react";
import { Button, GlowCard, MoneyAmount } from "pfa-next";

export const Variants = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Button variant="primary">Ajouter une dépense</Button>
    <Button variant="default">Enregistrer</Button>
    <Button variant="secondary">Dupliquer</Button>
    <Button variant="outline">Exporter</Button>
    <Button variant="muted">Annuler</Button>
    <Button variant="ghost">Réinitialiser</Button>
    <Button variant="destructive">Supprimer</Button>
    <Button variant="link">Voir le détail</Button>
  </div>
);

export const Sizes = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Button variant="primary" size="lg">
      Ajouter une dépense
    </Button>
    <Button variant="primary" size="default">
      Ajouter une dépense
    </Button>
    <Button variant="primary" size="sm">
      Ajouter une dépense
    </Button>
    <Button variant="primary" size="icon" aria-label="Ajouter une dépense">
      <Plus />
    </Button>
  </div>
);

export const WithIcons = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Button variant="primary" size="sm">
      <Plus />
      Nouvelle dépense
    </Button>
    <Button variant="outline" size="sm">
      <Download />
      Exporter
    </Button>
    <Button variant="destructive" size="sm">
      <Trash2 />
      Supprimer
    </Button>
  </div>
);

export const Disabled = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Button variant="primary" disabled>
      Enregistrer
    </Button>
    <Button variant="muted" disabled>
      Annuler
    </Button>
    <Button variant="destructive" disabled>
      Supprimer
    </Button>
  </div>
);

export const DialogFooter = () => (
  <GlowCard as="section" className="p-5">
    <h3 className="text-sm tracking-snug text-ink">Supprimer « Abonnement Netflix » ?</h3>
    <p className="mt-1 flex flex-wrap items-baseline gap-x-1 text-2xs text-ink-4">
      Le prélèvement de
      <MoneyAmount value={13.49} unit="€" className="num text-2xs text-ink-2" decimalClassName="text-ink-4" />
      du <span className="num">12</span> mai <span className="num">2026</span> sera retiré des dépenses fixes.
    </p>
    <div className="mt-4 flex justify-end gap-2">
      <Button variant="muted" size="sm">
        Annuler
      </Button>
      <Button variant="destructive" size="sm">
        <Trash2 />
        Supprimer
      </Button>
    </div>
  </GlowCard>
);
