import type { HistogramBucket, MetricsView } from "@contracts/interfaces/panelTypes";
import type { LineSeries } from "@lib/dataviz/interfaces/dataVizTypes";
import type { ReactNode } from "react";

export interface MetricsViewProps {
  view: MetricsView;
}

export interface ChartCardProps {
  title: string;
  /** The legend on the right of the title. */
  legend?: ReactNode;
  /** A plain mono sub-line instead of a legend. */
  sub?: string;
  axis: readonly string[];
  children: ReactNode;
  className?: string;
}

export interface LegendItemProps {
  /** A CSS colour (a token: `var(--ok)`). */
  color: string;
  label: string;
  value?: string;
}

export interface MetricLineChartProps {
  series: LineSeries[];
  /** Appended to the y labels (`ms`). */
  unit?: string;
  ariaLabel: string;
}

export interface HistogramProps {
  buckets: HistogramBucket[];
}

export interface ActionMixProps {
  view: MetricsView;
}
