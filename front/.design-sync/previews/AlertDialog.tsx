import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "pfa-next";

/**
 * The canonical destructive confirmation: `AlertDialogAction` carries the danger
 * tokens (it must override its own default variant), `AlertDialogCancel` is the
 * muted escape. This is what `ConfirmDeleteDialog` wraps.
 */
export const Default = () => (
  <AlertDialog open>
    <AlertDialogContent className="border-line bg-surface-elev">
      <AlertDialogHeader>
        <AlertDialogTitle className="text-ink">Supprimer la catégorie « Alimentation » ?</AlertDialogTitle>
        <AlertDialogDescription className="text-ink-3">
          Cette action est irréversible. Les 24 dépenses associées n'auront plus de catégorie.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Annuler</AlertDialogCancel>
        <AlertDialogAction className="bg-danger-solid text-on-danger hover:bg-danger-solid hover:brightness-110">
          Supprimer
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

/**
 * The same anatomy with the action left on its default (non-destructive) look —
 * a confirmation that commits rather than deletes.
 */
export const NonDestructiveAction = () => (
  <AlertDialog open>
    <AlertDialogContent className="border-line bg-surface-elev">
      <AlertDialogHeader>
        <AlertDialogTitle className="text-ink">Reporter le plafond hebdomadaire ?</AlertDialogTitle>
        <AlertDialogDescription className="text-ink-3">
          Le reste de la semaine du 11 mai (<span className="num text-ink-2">78,20 €</span>) sera ajouté au plafond de
          la semaine suivante.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Annuler</AlertDialogCancel>
        <AlertDialogAction>Reporter</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

/**
 * Title-only header: the description slot is dropped when the title already says
 * everything, and the labels name the object being removed.
 */
export const TitleOnly = () => (
  <AlertDialog open>
    <AlertDialogContent className="border-line bg-surface-elev">
      <AlertDialogHeader>
        <AlertDialogTitle className="text-ink">Supprimer l'abonnement Netflix ?</AlertDialogTitle>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Conserver</AlertDialogCancel>
        <AlertDialogAction className="bg-danger-solid text-on-danger hover:bg-danger-solid hover:brightness-110">
          Supprimer la dépense fixe
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
