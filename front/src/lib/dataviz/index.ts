// pfa data-viz lib — lightweight, themed SVG charts.
export { default as Donut } from "@lib/dataviz/Donut";
export { default as LineChart } from "@lib/dataviz/LineChart";
export { default as BarChart } from "@lib/dataviz/BarChart";
export { default as StackedBar } from "@lib/dataviz/StackedBar";
export { default as CategoryBarTooltip } from "@lib/dataviz/CategoryBarTooltip";
export { default as CategoryTrend } from "@lib/dataviz/CategoryTrend";
export { default as ProgressTrack } from "@lib/dataviz/ProgressTrack";
export { default as AnimatedNumber } from "@lib/dataviz/AnimatedNumber";
export { default as useCountUp } from "@lib/dataviz/useCountUp";
export { default as useTween } from "@lib/dataviz/useTween";
export { default as useElementWidth } from "@lib/dataviz/useElementWidth";

export {
  categoriesToSegments,
  categoriesToBars,
  weeklyTotalsToBars,
} from "@lib/dataviz/adapters";

export type {
  DonutSegment,
  BarDatum,
  LinePoint,
  LineSeries,
  AxisMarker,
  SeriesDot,
} from "@lib/dataviz/types";

export type {
  TrendDirection,
  CategoryTrendData,
} from "@lib/dataviz/CategoryTrend";

export type { CategoryTooltipDatum } from "@lib/dataviz/CategoryBarTooltip";
