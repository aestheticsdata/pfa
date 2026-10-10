import type { LegendItemProps } from "@components/panel/metrics/interfaces/metricsTypes";

/** `▬ live 84`: swatch, label, value. */
const LegendItem = ({ color, label, value }: LegendItemProps) => (
  <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
    <i
      className="block h-0.75 w-3 rounded-xs"
      style={{ background: color }}
    />
    {label}
    {value !== undefined && <b className="font-medium text-text">{value}</b>}
  </span>
);

export default LegendItem;
