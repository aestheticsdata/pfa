import Spinner from "@components/common/Spinner";
import { hasHistory, storeColors } from "@components/prices/helpers/priceHistory";
import PriceHistoryChart from "@components/prices/history/PriceHistoryChart";
import StorePriceRow from "@components/prices/rows/StorePriceRow";
import usePriceComparison from "@components/prices/services/usePriceComparison";
import { CardSectionHeader } from "@components/shared/CardSectionHeader";
import { EmptyState } from "@components/shared/EmptyState";
import GlowCard from "@components/shared/GlowCard";
import useTranslations from "@i18n/useTranslations";
import { priceBasisSchema } from "@src/schemas/prices";

interface PriceComparisonCardProps {
  typeID: string;
}

/** A product type's stores, ranked cheapest first on each basis it was bought on (PFA-220). */
const PriceComparisonCard = ({ typeID }: PriceComparisonCardProps) => {
  const t = useTranslations("prices");
  const { data, isPending, isError } = usePriceComparison(typeID);
  const colors = storeColors(data?.comparisons ?? []);

  return (
    <GlowCard
      as="section"
      data-testid="price-comparison"
      className="flex min-w-0 flex-col gap-4 p-5"
    >
      {isPending ? (
        <div className="grid min-h-60 place-items-center">
          <Spinner />
        </div>
      ) : isError ? (
        <EmptyState className="py-10 text-neg">{t.loadFailed}</EmptyState>
      ) : (
        <>
          <CardSectionHeader title={data.name} />
          {data.comparisons.map((comparison) => (
            <div
              key={comparison.basis}
              className="flex flex-col gap-2"
            >
              <h3 className="text-2xs font-medium uppercase tracking-widest text-ink-4">{t.basis[comparison.basis]}</h3>
              {comparison.basis === priceBasisSchema.enum.piece && <p className="text-xs text-ink-4">{t.pieceNote}</p>}
              <ol className="flex flex-col gap-2">
                {comparison.stores.map((store, index) => (
                  <StorePriceRow
                    key={store.storeID}
                    store={store}
                    rank={index + 1}
                    basis={comparison.basis}
                    color={colors.get(store.storeID) ?? null}
                  />
                ))}
              </ol>
              {comparison.stores.length === 1 && <p className="text-xs text-ink-4">{t.singleStore}</p>}
              {hasHistory(comparison) && (
                <PriceHistoryChart
                  comparison={comparison}
                  colors={colors}
                />
              )}
            </div>
          ))}
        </>
      )}
    </GlowCard>
  );
};

export default PriceComparisonCard;
