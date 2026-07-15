import { ConfirmDeleteDialog } from "pfa-next";

const noop = () => {};

/**
 * The Catégories story: a quoted category name (capitalized via `titleClassName`,
 * since names are stored lowercased) plus the consequence spelled out.
 */
export const Default = () => (
  <ConfirmDeleteDialog
    open
    onOpenChange={noop}
    title="Supprimer la catégorie « alimentation » ?"
    titleClassName="capitalize"
    description="Cette action est irréversible. Les dépenses associées n'auront plus de catégorie."
    onConfirm={noop}
  />
);

/**
 * Title only — `description` falls back to the standard irreversible-action
 * warning, as in the Achats exceptionnels list.
 */
export const DefaultDescription = () => (
  <ConfirmDeleteDialog
    open
    onOpenChange={noop}
    title="Supprimer Canapé Ikea ?"
    onConfirm={noop}
  />
);

/**
 * Custom `confirmLabel` / `cancelLabel` when the generic verbs would be
 * ambiguous — here the receipt attached to a spending, not the spending itself.
 */
export const CustomLabels = () => (
  <ConfirmDeleteDialog
    open
    onOpenChange={noop}
    title={<>Supprimer la facture&nbsp;?</>}
    description="Le reçu de Courses Carrefour du 14 mai 2026 sera détaché de la dépense. La dépense, elle, est conservée."
    confirmLabel="Supprimer le reçu"
    cancelLabel="Conserver"
    onConfirm={noop}
  />
);
