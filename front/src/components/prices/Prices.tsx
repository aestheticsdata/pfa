"use client";

import Spinner from "@components/common/Spinner";
import BulkReadCard from "@components/prices/BulkReadCard";
import CatalogDialog from "@components/prices/catalog/CatalogDialog";
import PriceComparisonCard from "@components/prices/PriceComparisonCard";
import PriceTypeList from "@components/prices/PriceTypeList";
import usePriceTypes from "@components/prices/services/usePriceTypes";
import { EmptyState } from "@components/shared/EmptyState";
import GlowCard from "@components/shared/GlowCard";
import useGlobalStore from "@components/shared/globalStore";
import ReceiptLinesHost from "@components/spendings/receiptLines/ReceiptLinesHost";
import { Button } from "@components/ui/button";
import useTranslations from "@i18n/useTranslations";
import { Store } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";

// The type on screen lives in the URL, so a comparison can be shared or reloaded.
const TYPE_QUERY_PARAM = "type";

/** Price comparison by store per product type (PFA-220). */
const Prices = () => {
  const t = useTranslations("prices");
  const setIsCalendarVisible = useGlobalStore((state) => state.setIsCalendarVisible);
  const { data: types, isPending } = usePriceTypes();
  const [typeParam, setTypeParam] = useQueryState(TYPE_QUERY_PARAM, parseAsString);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  useEffect(() => {
    setIsCalendarVisible(false);
  }, [setIsCalendarVisible]);

  // A stale or missing type in the URL falls back to the most compared one.
  const selectedID = types?.find((type) => type.ID === typeParam)?.ID ?? types?.[0]?.ID ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold tracking-snug text-ink">{t.title}</h1>
        {types && (
          <span className="num rounded-full border border-line-soft bg-surface-elev px-2.5 py-1 text-xs text-ink-3">
            {types.length}
          </span>
        )}
        <Button
          type="button"
          data-testid="catalog-open"
          variant="muted"
          size="sm"
          className="ml-auto"
          onClick={() => setIsCatalogOpen(true)}
        >
          <Store />
          {t.catalog.open}
        </Button>
      </div>
      <p className="text-xs text-ink-4">{t.subtitle}</p>

      <BulkReadCard />

      {isPending ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : !types || types.length === 0 || !selectedID ? (
        <GlowCard className="p-5">
          <EmptyState className="py-10">{t.empty}</EmptyState>
        </GlowCard>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <PriceTypeList
            types={types}
            selectedID={selectedID}
            onSelect={(typeID) => setTypeParam(typeID)}
          />
          <PriceComparisonCard typeID={selectedID} />
        </div>
      )}

      {/* The review queue of the bulk read opens the receipt-lines modal here (PFA-223). */}
      <ReceiptLinesHost />
      <CatalogDialog
        open={isCatalogOpen}
        onOpenChange={setIsCatalogOpen}
      />
    </div>
  );
};

export default Prices;
