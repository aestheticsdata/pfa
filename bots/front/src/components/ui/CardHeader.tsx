import type { CardHeaderProps } from "@components/ui/interfaces/uiTypes";

/** Card title row: title, then a mono sub-line pushed right (or anything else passed in). */
const CardHeader = ({ title, sub, children }: CardHeaderProps) => (
  <header className="flex flex-wrap items-baseline gap-2.5 px-3.5 pt-3">
    <h2 className="m-0 shrink-0 text-sm font-medium tracking-title">{title}</h2>
    <span className="flex-1" />
    {sub && <span className="whitespace-nowrap font-mono text-xs text-dim">{sub}</span>}
    {children}
  </header>
);

export default CardHeader;
