import { CardSectionHeader } from "@components/shared/CardSectionHeader";
import GlowCard from "@components/shared/GlowCard";
import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";

import type { ProductTypeSummary } from "@src/schemas/prices";

interface PriceTypeListProps {
  types: ProductTypeSummary[];
  selectedID: string;
  onSelect: (typeID: string) => void;
}

/** The product types with prices to compare, most compared first (PFA-220). */
const PriceTypeList = ({ types, selectedID, onSelect }: PriceTypeListProps) => {
  const t = useTranslations("prices");

  return (
    <GlowCard
      as="section"
      className="flex flex-col gap-3 p-4"
    >
      <CardSectionHeader title={t.typesTitle} />
      <ul className="flex flex-col gap-1">
        {types.map((type) => (
          <li key={type.ID}>
            <button
              type="button"
              data-testid="price-type"
              aria-current={type.ID === selectedID}
              onClick={() => onSelect(type.ID)}
              className={cn(
                "flex w-full cursor-pointer flex-col gap-0.5 rounded-md px-3 py-2 text-left transition-colors hover:bg-surface-hi",
                type.ID === selectedID && "bg-surface-hi",
              )}
            >
              <span
                className={cn("truncate text-sm", type.ID === selectedID ? "font-semibold text-ink" : "text-ink-2")}
              >
                {type.name}
              </span>
              <span className="num text-xs text-ink-4">{t.typeMeta(type.stores, type.purchases)}</span>
            </button>
          </li>
        ))}
      </ul>
    </GlowCard>
  );
};

export default PriceTypeList;
