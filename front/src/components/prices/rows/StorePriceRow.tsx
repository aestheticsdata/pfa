import formatMeasure from "@components/prices/helpers/formatMeasure";
import useDateLocale from "@i18n/useDateLocale";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";
import { format, parseISO } from "date-fns";
import { MapPin } from "lucide-react";

import type { PriceBasis, StorePrice } from "@src/schemas/prices";

interface StorePriceRowProps {
  store: StorePrice;
  rank: number;
  basis: PriceBasis;
  /** The store's hue on the price history, null when it is not drawn (PFA-222). */
  color: string | null;
}

/** One store on a product type's ranking: its unit price, last purchase and average (PFA-220). */
const StorePriceRow = ({ store, rank, basis, color }: StorePriceRowProps) => {
  const t = useTranslations("prices");
  const { euro } = useFormat();
  const locale = useDateLocale();
  const measure = formatMeasure(
    { quantity: store.lastQuantity, size: store.lastSize, sizeUnit: store.lastSizeUnit },
    t.sizeUnits,
  );

  return (
    <li
      data-testid="price-store-row"
      className={cn(
        "grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-start gap-3 rounded-lg border px-3.5 py-3",
        store.cheapest ? "border-accent-d bg-accent-bg" : "border-line-soft bg-surface-base",
      )}
    >
      <span className="num pt-0.5 text-sm font-semibold text-ink-4">{rank}</span>

      <div className="flex min-w-0 flex-col gap-1">
        <span className="flex min-w-0 items-center gap-2">
          {color && (
            <span
              className="inline-block size-2.5 shrink-0 rounded-full"
              style={{ background: color }}
            />
          )}
          <span className="truncate text-sm font-semibold text-ink">{store.name}</span>
          {store.cheapest && (
            <span className="shrink-0 rounded-sm bg-accent-strong px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wider text-on-selection-action">
              {t.cheapest}
            </span>
          )}
        </span>
        {store.address && (
          <span className="flex min-w-0 items-center gap-1.5 text-xs text-ink-4">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{store.address}</span>
          </span>
        )}
        <span className="num text-xs text-ink-3">
          {t.lastPaid} · {euro(store.lastAmount)} €{measure && ` · ${measure}`} ·{" "}
          {format(parseISO(store.lastDate), "d MMM yyyy", { locale })}
        </span>
      </div>

      <div className="flex flex-col items-end gap-0.5 text-right">
        <span
          className={cn("num text-lg font-semibold tracking-tight", store.cheapest ? "text-accent-strong" : "text-ink")}
        >
          {euro(store.lastUnitPrice)} <span className="text-xs font-normal text-ink-3">{t.per[basis]}</span>
        </span>
        {store.purchases > 1 && (
          <span className="num text-xs text-ink-4">{t.average(euro(store.averageUnitPrice), t.per[basis])}</span>
        )}
        <span className="text-xs text-ink-4">{t.purchases(store.purchases)}</span>
      </div>
    </li>
  );
};

export default StorePriceRow;
