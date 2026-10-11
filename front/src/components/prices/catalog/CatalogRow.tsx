import CatalogEditForm from "@components/prices/catalog/CatalogEditForm";
import CatalogMergeForm from "@components/prices/catalog/CatalogMergeForm";
import { CATALOG_KIND, CATALOG_ROW_MODE } from "@components/prices/config/constants";
import useCatalog from "@components/prices/services/useCatalog";
import { Button } from "@components/ui/button";
import useTranslations from "@i18n/useTranslations";
import { Merge, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import type { CatalogEntry, CatalogKind, CatalogRowMode } from "@components/prices/interfaces/catalogTypes";

interface CatalogRowProps {
  kind: CatalogKind;
  entry: CatalogEntry;
  /** All the entries of the tab: the merge targets, and the names of duplicates. */
  entries: CatalogEntry[];
}

/** A store or product type: its uses, its likely duplicate, and what can be done to it (PFA-224). */
const CatalogRow = ({ kind, entry, entries }: CatalogRowProps) => {
  const { catalog: t } = useTranslations("prices");
  const { remove } = useCatalog(kind);
  const [mode, setMode] = useState<CatalogRowMode>(CATALOG_ROW_MODE.view);
  const [mergeTarget, setMergeTarget] = useState<string | null>(null);
  const duplicate = entries.find((other) => other.ID === entry.duplicateOf);

  const openMerge = (targetID: string | null) => {
    setMergeTarget(targetID);
    setMode(CATALOG_ROW_MODE.merge);
  };
  const close = () => setMode(CATALOG_ROW_MODE.view);

  return (
    <li
      data-testid="catalog-row"
      className="py-3"
    >
      {mode === CATALOG_ROW_MODE.edit ? (
        <CatalogEditForm
          kind={kind}
          entry={entry}
          entries={entries}
          onClose={close}
          onMerge={openMerge}
        />
      ) : mode === CATALOG_ROW_MODE.merge ? (
        <CatalogMergeForm
          kind={kind}
          entry={entry}
          entries={entries}
          initialTarget={mergeTarget}
          onClose={close}
        />
      ) : (
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-sm font-medium text-ink">{entry.name}</span>
            {kind === CATALOG_KIND.stores && (
              <span className="truncate text-xs text-ink-3">{entry.address ?? t.noAddress}</span>
            )}
            <span className="num text-xs text-ink-4">{t.uses(entry.uses)}</span>
            {duplicate && (
              <button
                type="button"
                data-testid="catalog-duplicate"
                onClick={() => openMerge(duplicate.ID)}
                className="w-fit cursor-pointer text-left text-xs text-elec hover:underline"
              >
                {t.duplicate(duplicate.name)} · {t.merge}
              </button>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={t.rename}
              title={t.rename}
              onClick={() => setMode(CATALOG_ROW_MODE.edit)}
            >
              <Pencil />
            </Button>
            {entries.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={t.merge}
                title={t.merge}
                onClick={() => openMerge(entry.duplicateOf)}
              >
                <Merge />
              </Button>
            )}
            {/* Deleting is only for what no purchase uses: nothing is lost. */}
            {entry.uses === 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={t.remove}
                title={t.remove}
                disabled={remove.isPending}
                onClick={() => remove.mutate(entry.ID)}
              >
                <Trash2 />
              </Button>
            )}
          </div>
        </div>
      )}
    </li>
  );
};

export default CatalogRow;
