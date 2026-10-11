import NameCombobox from "@components/spendings/receiptLines/NameCombobox";
import useStores from "@components/spendings/services/useStores";
import useTranslations from "@i18n/useTranslations";
import { FIELD_LIMITS } from "@src/schemas/fieldLimits";
import { MapPin, Store } from "lucide-react";

import type { StoreIdentity } from "@src/schemas/receiptLines";

interface StorePickerProps {
  value: StoreIdentity | null;
  onChange: (store: StoreIdentity | null) => void;
}

const sameText = (a: string | null, b: string | null) =>
  (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();

/**
 * The store of a receipt (PFA-218): a name AND an address, since two shops of
 * one chain are priced apart (PFA-219). Prefilled from the OCR — the user's
 * known shop when it is one; any other known shop can be picked, a new one typed.
 */
const StorePicker = ({ value, onChange }: StorePickerProps) => {
  const { receiptLines: t } = useTranslations("spendings");
  const { data: stores = [] } = useStores();
  const options = stores.map((store) => ({ ID: store.ID, name: store.name, hint: store.address }));
  const selected = value
    ? stores.find((store) => sameText(store.name, value.name) && sameText(store.address, value.address))
    : undefined;

  return (
    <div className="flex flex-col gap-2">
      <NameCombobox
        options={options}
        selectedID={selected?.ID ?? null}
        value={value?.name ?? null}
        icon={<Store />}
        text={{
          label: t.store,
          placeholder: t.storePlaceholder,
          search: t.storeSearch,
          empty: t.storeEmpty,
          clear: t.storeClear,
        }}
        maxLength={FIELD_LIMITS.storeName}
        testId="receipt-store"
        onPick={(option) => onChange(option ? { name: option.name, address: option.hint } : null)}
        // A new name keeps the address read on the receipt.
        onType={(name) => onChange({ name, address: value?.address ?? null })}
      />
      {value && (
        <label className="flex h-9.5 min-w-0 items-center gap-2.5 rounded-md border border-line bg-surface-base px-3 transition-colors focus-within:border-accent-d">
          <MapPin className="size-4 shrink-0 text-ink-4" />
          <input
            data-testid="receipt-store-address"
            aria-label={t.storeAddress}
            value={value.address ?? ""}
            maxLength={FIELD_LIMITS.storeAddress}
            placeholder={t.storeAddressPlaceholder}
            onChange={(e) => onChange({ ...value, address: e.target.value || null })}
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-5"
          />
        </label>
      )}
    </div>
  );
};

export default StorePicker;
