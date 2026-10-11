import NameCombobox from "@components/spendings/receiptLines/NameCombobox";
import useProductTypes from "@components/spendings/services/useProductTypes";
import useTranslations from "@i18n/useTranslations";
import { FIELD_LIMITS } from "@src/schemas/fieldLimits";
import { Tag } from "lucide-react";

interface ProductTypePickerProps {
  value: string | null;
  onChange: (productType: string | null) => void;
}

/** A receipt line's generic product — "Liquid soap", all brands — picked or typed (PFA-219). */
const ProductTypePicker = ({ value, onChange }: ProductTypePickerProps) => {
  const { receiptLines: t } = useTranslations("spendings");
  const { data: types = [] } = useProductTypes();
  const selected = types.find((type) => type.name.toLowerCase() === value?.trim().toLowerCase());

  return (
    <NameCombobox
      options={types.map((type) => ({ ID: type.ID, name: type.name, hint: null }))}
      selectedID={selected?.ID ?? null}
      value={value}
      icon={<Tag />}
      text={{
        label: t.productType,
        placeholder: t.productTypePlaceholder,
        search: t.productTypeSearch,
        empty: t.productTypeEmpty,
        clear: t.productTypeClear,
      }}
      maxLength={FIELD_LIMITS.productTypeName}
      testId="receipt-line-type"
      onPick={(option) => onChange(option?.name ?? null)}
      onType={onChange}
    />
  );
};

export default ProductTypePicker;
