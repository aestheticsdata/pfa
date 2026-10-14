import type { ActivityPoint, HistogramBucket, MetricsView } from "@contracts/interfaces/panelTypes";
import type { LineSeries } from "@lib/dataviz/interfaces/dataVizTypes";
import type { MixEntry } from "@lib/panel/interfaces/actionMixTypes";
import type { ReactNode } from "react";

export interface MetricsViewProps {
  app: string;
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
  /** The hovered point's tooltip content (PFA-229). */
  tooltip: (index: number) => ReactNode;
  /** Whether the point has a detail to open. */
  canSelect: (index: number) => boolean;
  onSelect: (index: number) => void;
}

/** A Metrics chart over the window's slices: a click on one opens its detail (PFA-229). */
export interface SliceChartProps {
  history: ActivityPoint[];
  /** How long a slice lasts (`SLICE_SECONDS`): the day charts or the burst ones. */
  seconds: number;
  onSelect: (index: number) => void;
}

export interface ActivityCardProps {
  app: string;
  view: MetricsView;
}

export interface HistogramProps {
  buckets: HistogramBucket[];
  /** Daily pace: buckets of actions over 24 h, not actions/min. */
  day: boolean;
  liveBots: number;
  onSelect: (label: string) => void;
}

export interface BucketTooltipProps {
  bucket: HistogramBucket;
  day: boolean;
  liveBots: number;
}

export interface BucketBotsModalProps {
  app: string;
  /** The bucket shown; undefined while none is picked. */
  bucket: HistogramBucket | undefined;
  day: boolean;
  dailyIds: string[];
  open: boolean;
  onClose: () => void;
}

export interface ActionMixProps {
  view: MetricsView;
  history: ActivityPoint[];
  seconds: number;
}

export interface MixTooltipProps {
  entry: MixEntry;
}

export interface MixLegendProps {
  mix: MixEntry[];
  onSelect: (name: string) => void;
}

export interface ActionDetailModalProps {
  /** The action shown; undefined while none is picked. */
  entry: MixEntry | undefined;
  history: ActivityPoint[];
  seconds: number;
  open: boolean;
  onClose: () => void;
}

export interface ActionRunsChartProps {
  name: string;
  color: string;
  history: ActivityPoint[];
  seconds: number;
}
