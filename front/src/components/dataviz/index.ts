// pfa data-viz lib — lightweight, themed SVG charts.
export { default as Donut } from "@components/dataviz/Donut";
export { default as LineChart } from "@components/dataviz/LineChart";
export { default as BarChart } from "@components/dataviz/BarChart";
export { default as StackedBar } from "@components/dataviz/StackedBar";
export { default as ProgressTrack } from "@components/dataviz/ProgressTrack";

export {
  categoriesToSegments,
  categoriesToBars,
  weeklyTotalsToBars,
} from "@components/dataviz/adapters";

export type {
  DonutSegment,
  BarDatum,
  LinePoint,
  LineSeries,
  AxisMarker,
  SeriesDot,
} from "@components/dataviz/types";
