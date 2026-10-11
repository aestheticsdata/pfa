import useCatalog from "@components/prices/services/useCatalog";
import { Button } from "@components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import useTranslations from "@i18n/useTranslations";
import { useState } from "react";

import type { CatalogEntry, CatalogKind } from "@components/prices/interfaces/catalogTypes";

interface CatalogMergeFormProps {
  kind: CatalogKind;
  entry: CatalogEntry;
  entries: CatalogEntry[];
  /** The entry offered to keep: the likely duplicate, or the one a rename collided with. */
  initialTarget: string | null;
  onClose: () => void;
}

/** Merging a store or a type into the one to keep: its purchases move, it goes (PFA-224). */
const CatalogMergeForm = ({ kind, entry, entries, initialTarget, onClose }: CatalogMergeFormProps) => {
  const { catalog: t } = useTranslations("prices");
  const { merge } = useCatalog(kind);
  const [targetID, setTargetID] = useState(initialTarget ?? "");
  const targets = entries.filter((other) => other.ID !== entry.ID);

  return (
    <div className="flex flex-col gap-2">
      <span className="truncate text-sm font-medium text-ink">{entry.name}</span>
      <Select
        value={targetID}
        onValueChange={setTargetID}
      >
        <SelectTrigger
          data-testid="catalog-merge-target"
          aria-label={t.mergeTarget}
          className="w-full"
        >
          <SelectValue placeholder={t.mergeTarget} />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {targets.map((target) => (
            <SelectItem
              key={target.ID}
              value={target.ID}
            >
              {target.address ? `${target.name} — ${target.address}` : target.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-xs text-ink-4">{t.mergeHint(entry.name, entry.uses)}</span>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
        >
          {t.cancel}
        </Button>
        <Button
          type="button"
          data-testid="catalog-merge"
          variant="primary"
          size="sm"
          disabled={!targetID || merge.isPending}
          onClick={() => merge.mutate({ sourceID: entry.ID, targetID }, { onSuccess: onClose })}
        >
          {t.merge}
        </Button>
      </div>
    </div>
  );
};

export default CatalogMergeForm;
