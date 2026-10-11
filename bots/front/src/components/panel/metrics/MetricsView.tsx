import ActionMix from "@components/panel/metrics/ActionMix";
import ChartCard from "@components/panel/metrics/ChartCard";
import Histogram from "@components/panel/metrics/Histogram";
import LegendItem from "@components/panel/metrics/LegendItem";
import MetricLineChart from "@components/panel/metrics/MetricLineChart";
import { LOAD_PACE } from "@contracts/panel";
import StackedColumns from "@lib/dataviz/StackedColumns";
import { METRICS_TEXT } from "@text/metrics";

import type { MetricsViewProps } from "@components/panel/metrics/interfaces/metricsTypes";

/**
 * Population, latency, response codes, activity per bot, action mix. One column below 1100px,
 * two from 1100, three from 1600 (the mix then spans two). Daily pace: the last 24 h, 1 point an
 * hour; burst: the last 80 s (PFA-205).
 */
const MetricsView = ({ view }: MetricsViewProps) => {
  const day = view.loadPace === LOAD_PACE.daily;
  const history = day ? view.dayHistory : view.history;
  const last = history[history.length - 1];
  const max = Math.max(1, ...history.map((point) => point.codes2xx + point.codes4xx + point.codes5xx));
  return (
    <div className="mt-4 grid grid-cols-1 gap-3.5 desktop:grid-cols-2 wide:grid-cols-3">
      <ChartCard
        title={METRICS_TEXT.population}
        axis={day ? METRICS_TEXT.populationAxisDay : METRICS_TEXT.populationAxis}
        legend={
          <>
            <LegendItem
              color="var(--ok)"
              label={METRICS_TEXT.live}
              value={String(last?.live ?? 0)}
            />
            <LegendItem
              color="var(--dim)"
              label={METRICS_TEXT.target}
              value={String(last?.target ?? 0)}
            />
          </>
        }
      >
        <MetricLineChart
          ariaLabel={METRICS_TEXT.population}
          series={[
            { points: history.map((point) => point.target), color: "var(--dim)", dashed: true, width: 1.6 },
            { points: history.map((point) => point.live), color: "var(--ok)", width: 1.6 },
          ]}
        />
      </ChartCard>
      <ChartCard
        title={METRICS_TEXT.latency}
        axis={day ? METRICS_TEXT.latencyAxisDay : METRICS_TEXT.latencyAxis}
        legend={
          <>
            <LegendItem
              color="var(--info)"
              label="p50"
              value={`${last?.p50 ?? 0}ms`}
            />
            <LegendItem
              color="var(--warn)"
              label="p95"
              value={`${last?.p95 ?? 0}ms`}
            />
          </>
        }
      >
        <MetricLineChart
          unit="ms"
          ariaLabel={METRICS_TEXT.latency}
          series={[
            { points: history.map((point) => point.p95), color: "var(--warn)", width: 1.6 },
            { points: history.map((point) => point.p50), color: "var(--info)", width: 1.6 },
          ]}
        />
      </ChartCard>
      <ChartCard
        title={METRICS_TEXT.codes}
        axis={day ? METRICS_TEXT.codesAxisDay : METRICS_TEXT.codesAxis}
        legend={
          <>
            <LegendItem
              color="color-mix(in oklch, var(--ok) 50%, transparent)"
              label="2xx"
            />
            <LegendItem
              color="var(--warn)"
              label="4xx"
              value={String(last?.codes4xx ?? 0)}
            />
            <LegendItem
              color="var(--bad)"
              label="5xx"
              value={String(last?.codes5xx ?? 0)}
            />
          </>
        }
      >
        <StackedColumns
          className="h-32.5 gap-px tablet:gap-0.5"
          max={max}
          ariaLabel={METRICS_TEXT.codes}
          columns={history.map((point) => ({
            key: point.at,
            parts: [
              { label: "5xx", value: point.codes5xx, color: "var(--bad)" },
              { label: "4xx", value: point.codes4xx, color: "var(--warn)" },
              { label: "2xx", value: point.codes2xx, color: "color-mix(in oklch, var(--ok) 50%, transparent)" },
            ],
          }))}
        />
      </ChartCard>
      <ChartCard
        title={METRICS_TEXT.activity}
        sub={(day ? METRICS_TEXT.activitySubDay : METRICS_TEXT.activitySub)(view.liveBots)}
        axis={[]}
      >
        <Histogram buckets={day ? view.dayActivity : view.activity} />
      </ChartCard>
      <ActionMix view={view} />
    </div>
  );
};

export default MetricsView;
