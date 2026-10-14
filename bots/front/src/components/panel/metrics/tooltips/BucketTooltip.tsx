import TooltipBody from "@components/ui/TooltipBody";
import { count } from "@lib/format/format";
import { CHART_COLOR } from "@lib/panel/chartColors";
import { CHART_TEXT } from "@text/charts";

import type { BucketTooltipProps } from "@components/panel/metrics/interfaces/metricsTypes";

/** A histogram bar's tooltip: how many bots, their share of the live ones, the busiest of them. */
const BucketTooltip = ({ bucket, day, liveBots }: BucketTooltipProps) => {
  const text = CHART_TEXT.bucket;
  const busiest = bucket.bots[0];
  const rows = [
    { label: text.bots, value: count(bucket.count), color: CHART_COLOR.actions },
    { label: text.share, value: `${liveBots === 0 ? 0 : Math.round((bucket.count / liveBots) * 100)}%` },
    ...(busiest
      ? [{ label: `${text.busiest} · ${busiest.id}`, value: CHART_TEXT.bucketModal.value(busiest.value, day) }]
      : []),
  ];
  return (
    <TooltipBody
      title={text.title(bucket.label, day)}
      rows={rows}
      hint={bucket.count > 0 ? CHART_TEXT.hint : undefined}
    />
  );
};

export default BucketTooltip;
