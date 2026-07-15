import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FieldShell,
  Overline,
  TextInput,
} from "pfa-next";

/** The 12 category hues, from the hue-only palette `oklch(0.80 0.09 <hue>)`. */
const PALETTE_HUES = [5, 25, 60, 80, 110, 140, 175, 210, 250, 290, 320, 350];

/**
 * The canonical form modal — the "Nouvelle dépense" sheet: bordered header,
 * scrollable field body, bordered footer with cancel + primary action.
 */
export const Default = () => (
  <Dialog open>
    <DialogContent className="gap-0 overflow-hidden border-line bg-surface-elev p-0 sm:max-w-[480px]">
      <DialogHeader className="flex-row items-center justify-between space-y-0 border-b border-line-soft px-5.5 py-4.5 text-left">
        <DialogTitle className="pr-8 text-base font-semibold tracking-normal text-ink">Nouvelle dépense</DialogTitle>
      </DialogHeader>

      <div className="flex flex-col gap-4.5 px-5.5 py-5.5">
        <FieldShell label="Date" htmlFor="dlg-date">
          <TextInput
            id="dlg-date"
            type="date"
            defaultValue="2026-05-14"
            className="num [color-scheme:dark]"
          />
        </FieldShell>

        <FieldShell label="Libellé" htmlFor="dlg-label">
          <TextInput id="dlg-label" defaultValue="Courses Carrefour" placeholder="Ex. Pharmacie" />
        </FieldShell>

        <FieldShell label="Montant" htmlFor="dlg-amount">
          <div className="flex items-baseline gap-2 rounded-md border border-line bg-background px-3 py-2.5">
            <input
              id="dlg-amount"
              inputMode="decimal"
              defaultValue="41,35"
              className="num min-w-0 flex-1 bg-transparent text-sm font-medium tracking-tight text-ink outline-none placeholder:text-ink-5"
            />
            <span className="num text-sm text-ink-3">€</span>
          </div>
        </FieldShell>
      </div>

      <DialogFooter className="gap-2.5 border-t border-line-soft px-5.5 py-4 sm:gap-2.5">
        <Button type="button" variant="muted">
          Annuler
        </Button>
        <Button type="submit" variant="primary">
          Ajouter la dépense
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

/**
 * Header with a `DialogDescription`, and a `DialogClose` wrapping the cancel
 * button — the confirm-style dialog used for the copy-recurrings action.
 */
export const WithDescription = () => (
  <Dialog open>
    <DialogContent className="border-line bg-surface-elev sm:max-w-[452px]">
      <DialogHeader>
        <DialogTitle className="text-ink">Copier les dépenses fixes ?</DialogTitle>
        <DialogDescription className="text-ink-3">
          Les 12 prélèvements d'avril 2026 seront recréés sur mai 2026, pour un total de{" "}
          <span className="num text-ink-2">1 240,50 €</span>. Vous pourrez les modifier ensuite.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="muted">
            Annuler
          </Button>
        </DialogClose>
        <Button type="button" variant="primary">
          Copier 12 dépenses
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

/**
 * The "Nouvelle catégorie" sheet in its error state: the name is already taken,
 * so `FieldShell` surfaces the message under the invalid input.
 */
export const WithFieldError = () => (
  <Dialog open>
    <DialogContent className="border-line bg-surface-elev sm:max-w-[452px]">
      <DialogHeader>
        <DialogTitle className="text-ink">Nouvelle catégorie</DialogTitle>
      </DialogHeader>

      <div className="flex flex-col gap-5">
        <FieldShell label="Nom" htmlFor="dlg-cat-name" error="Cette catégorie existe déjà.">
          <TextInput id="dlg-cat-name" defaultValue="Alimentation" aria-invalid />
        </FieldShell>

        <div className="flex flex-col gap-2.5">
          <Overline>Couleur</Overline>
          <div className="flex flex-wrap gap-2.5">
            {PALETTE_HUES.map((hue) => (
              <span
                key={hue}
                className={`size-[30px] rounded-md border-2 ${hue === 140 ? "border-ink" : "border-transparent"}`}
                style={{ background: `oklch(0.80 0.09 ${hue})` }}
              />
            ))}
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost">
          Annuler
        </Button>
        <Button type="button" variant="primary">
          Créer
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
