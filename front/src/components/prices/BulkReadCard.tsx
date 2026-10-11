import useBulkRead from "@components/prices/services/useBulkRead";
import { CardSectionHeader } from "@components/shared/CardSectionHeader";
import GlowCard from "@components/shared/GlowCard";
import { Button } from "@components/ui/button";
import useTranslations from "@i18n/useTranslations";
import { ScanText } from "lucide-react";

/**
 * Reading the receipts saved before the OCR (PFA-223): how many are left, the
 * progress while they are read, and the review queue once some are ready.
 * Hidden when there is nothing to read nor to review.
 */
const BulkReadCard = () => {
  const t = useTranslations("prices");
  const { status, start, reviewNext } = useBulkRead();
  const progress = status.data;
  if (!progress || progress.candidates + progress.queued + progress.ready + progress.failed === 0) return null;

  const done = progress.ready + progress.failed;
  const total = done + progress.queued;

  return (
    <GlowCard
      as="section"
      data-testid="bulk-read"
      className="flex flex-col gap-3 p-4"
    >
      <CardSectionHeader title={t.bulk.title} />

      {progress.queued > 0 ? (
        <div className="flex flex-col gap-1.5">
          <span className="num text-sm text-ink-2">{t.bulk.reading(done, total)}</span>
          <div className="h-2 overflow-hidden rounded bg-surface-hi">
            <div
              className="h-full bg-elec transition-all"
              style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-ink-4">{t.bulk.readingHint}</span>
        </div>
      ) : (
        progress.candidates > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-ink-2">{t.bulk.candidates(progress.candidates)}</span>
            <Button
              type="button"
              data-testid="bulk-read-start"
              variant="primary"
              size="sm"
              disabled={start.isPending}
              onClick={() => start.mutate()}
            >
              <ScanText />
              {t.bulk.start}
            </Button>
          </div>
        )
      )}

      {progress.ready > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-ink-4">{t.bulk.reviewHint}</span>
          <Button
            type="button"
            data-testid="bulk-read-review"
            variant="primary"
            size="sm"
            onClick={() => void reviewNext()}
          >
            {t.bulk.review(progress.ready)}
          </Button>
        </div>
      )}

      {progress.failed > 0 && <span className="text-xs text-ink-4">{t.bulk.failed(progress.failed)}</span>}
    </GlowCard>
  );
};

export default BulkReadCard;
