// pfa data-viz lib — lightweight, themed SVG charts.

export { default as AnimatedNumber } from "@lib/dataviz/AnimatedNumber";
export {
  categoriesToBars,
  categoriesToSegments,
  weeklyTotalsToBars,
} from "@lib/dataviz/adapters";
export { default as BarChart } from "@lib/dataviz/BarChart";
export { default as CategoryBarTooltip } from "@lib/dataviz/CategoryBarTooltip";
export { default as CategoryTrend } from "@lib/dataviz/CategoryTrend";
export { default as CursorTooltip } from "@lib/dataviz/CursorTooltip";
export { default as Donut } from "@lib/dataviz/Donut";
export { default as LineChart } from "@lib/dataviz/LineChart";
export { default as ProgressTrack } from "@lib/dataviz/ProgressTrack";
export { default as StackedBar } from "@lib/dataviz/StackedBar";
export { default as useCountUp } from "@lib/dataviz/useCountUp";
export { default as useCursorHover } from "@lib/dataviz/useCursorHover";
export { default as useElementWidth } from "@lib/dataviz/useElementWidth";
export { default as useTween } from "@lib/dataviz/useTween";

export type {
  AxisMarker,
  BarDatum,
  BarHover,
  CategoryTooltipDatum,
  CategoryTrendData,
  DonutSegment,
  LinePoint,
  LineSeries,
  SeriesDot,
  TrendDirection,
} from "@lib/dataviz/dataVizTypes";
