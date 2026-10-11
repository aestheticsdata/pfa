import { CATALOG_KIND } from "@components/prices/config/constants";
import catalogConflict from "@components/prices/helpers/catalogConflict";
import useCatalog from "@components/prices/services/useCatalog";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import useTranslations from "@i18n/useTranslations";
import { FIELD_LIMITS } from "@src/schemas/fieldLimits";
import { useState } from "react";

import type { CatalogEntry, CatalogKind } from "@components/prices/interfaces/catalogTypes";

interface CatalogEditFormProps {
  kind: CatalogKind;
  entry: CatalogEntry;
  entries: CatalogEntry[];
  onClose: () => void;
  /** A rename onto an existing entry turns into merging into it. */
  onMerge: (targetID: string) => void;
}

/** Renaming a store or a type, a store's address too (PFA-224). */
const CatalogEditForm = ({ kind, entry, entries, onClose, onMerge }: CatalogEditFormProps) => {
  const { catalog: t } = useTranslations("prices");
  const { rename } = useCatalog(kind);
  const [name, setName] = useState(entry.name);
  const [address, setAddress] = useState(entry.address ?? "");
  const [conflictID, setConflictID] = useState<string | null>(null);
  const isStore = kind === CATALOG_KIND.stores;
  const conflict = entries.find((other) => other.ID === conflictID);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    rename.mutate(
      { ID: entry.ID, name: name.trim(), address: address.trim() || null },
      { onSuccess: onClose, onError: (error) => setConflictID(catalogConflict(error)) },
    );
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2"
    >
      <Input
        data-testid="catalog-name"
        aria-label={t.name}
        placeholder={t.name}
        autoFocus
        value={name}
        maxLength={isStore ? FIELD_LIMITS.storeName : FIELD_LIMITS.productTypeName}
        onChange={(event) => {
          setName(event.target.value);
          setConflictID(null);
        }}
      />
      {isStore && (
        <Input
          data-testid="catalog-address"
          aria-label={t.address}
          placeholder={t.address}
          value={address}
          maxLength={FIELD_LIMITS.storeAddress}
          onChange={(event) => {
            setAddress(event.target.value);
            setConflictID(null);
          }}
        />
      )}
      {conflict && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-2">
          <span>{t.conflict(conflict.name)}</span>
          <Button
            type="button"
            variant="muted"
            size="sm"
            onClick={() => onMerge(conflict.ID)}
          >
            {t.mergeInto(conflict.name)}
          </Button>
        </div>
      )}
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
          type="submit"
          variant="primary"
          size="sm"
          disabled={!name.trim() || rename.isPending}
        >
          {t.save}
        </Button>
      </div>
    </form>
  );
};

export default CatalogEditForm;
