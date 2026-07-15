import { LegendItem } from "pfa-next";

/** Dashed rule swatch — reference lines / compare-year series. */
const DashSwatch = ({ color, opacity = 1 }: { color: string; opacity?: number }) => (
  <span
    className="inline-block h-0.5 w-4 align-middle"
    style={{
      opacity,
      backgroundImage: `repeating-linear-gradient(90deg, ${color} 0 3px, transparent 3px 6px)`,
    }}
  />
);

export const Default = () => (
  <span className="text-2xs text-ink-3">
    <LegendItem swatch={<span className="size-2 rounded-xs bg-accent-strong" />}>
      Variables <span className="num text-ink-2">780 €</span>
    </LegendItem>
  </span>
);

export const BudgetSplit = () => (
  <div className="flex gap-4 text-2xs text-ink-3">
    <LegendItem swatch={<span className="size-2 rounded-xs bg-accent-d" />}>
      Fixes <span className="num text-ink-2">1 240 €</span>
    </LegendItem>
    <LegendItem swatch={<span className="size-2 rounded-xs bg-accent-strong" />}>
      Variables <span className="num text-ink-2">780 €</span>
    </LegendItem>
  </div>
);

export const CategorySeries = () => (
  <div className="flex flex-wrap items-center gap-4.5 text-xs text-ink-3">
    <LegendItem
      className="capitalize"
      swatch={
        <i
          className="inline-block size-2.5 rounded-xs"
          style={{ background: "#9fcc95" }}
        />
      }
    >
      Alimentation
    </LegendItem>
    <LegendItem
      className="capitalize"
      swatch={
        <i
          className="inline-block size-2.5 rounded-xs"
          style={{ background: "#72cede" }}
        />
      }
    >
      Transport
    </LegendItem>
    <LegendItem
      className="capitalize"
      swatch={
        <i
          className="inline-block size-2.5 rounded-xs"
          style={{ background: "#bcb4f4" }}
        />
      }
    >
      Loyer
    </LegendItem>
    <LegendItem
      className="capitalize"
      swatch={
        <i
          className="inline-block size-2.5 rounded-xs"
          style={{ background: "#c1c37e" }}
        />
      }
    >
      Courses
    </LegendItem>
  </div>
);

export const SwatchVariants = () => (
  <div className="flex flex-col items-start gap-2.5 text-xs text-ink-3">
    <LegendItem swatch={<i className="inline-block size-2.5 rounded-xs bg-accent-strong" />}>2026</LegendItem>
    <LegendItem swatch={<i className="inline-block size-2.5 rounded-xs bg-exc" />}>Achat exceptionnel</LegendItem>
    <LegendItem
      swatch={
        <span
          className="inline-block h-2 w-3 rounded-xs"
          style={{ background: "var(--accent-strong)", opacity: 0.55 }}
        />
      }
    >
      réalisé
    </LegendItem>
    <LegendItem
      swatch={
        <span
          className="inline-block h-2 w-3 rounded-xs border border-accent-d"
          style={{ background: "repeating-linear-gradient(45deg,transparent 0 3px,var(--accent-d) 3px 6px)" }}
        />
      }
    >
      projection
    </LegendItem>
    <LegendItem
      swatch={
        <DashSwatch
          color="var(--accent-strong)"
          opacity={0.85}
        />
      }
    >
      2025
    </LegendItem>
    <LegendItem swatch={<DashSwatch color="var(--ink-3)" />}>Budget mensuel</LegendItem>
  </div>
);

export const ChartHeader = () => (
  <div className="flex flex-wrap items-baseline justify-between gap-4">
    <div>
      <h3 className="text-sm font-medium tracking-snug text-ink">Dépenses mensuelles</h3>
      <p className="mt-0.5 text-xs text-ink-4">mai 2026 · 2 020,50 € dépensés</p>
    </div>
    <div className="flex flex-wrap items-center gap-4.5 text-xs text-ink-3">
      <LegendItem swatch={<i className="inline-block size-2.5 rounded-xs bg-accent-strong" />}>2026</LegendItem>
      <LegendItem swatch={<i className="inline-block size-2.5 rounded-xs bg-exc" />}>Achat exceptionnel</LegendItem>
      <LegendItem swatch={<DashSwatch color="var(--ink-3)" />}>Budget mensuel</LegendItem>
    </div>
  </div>
);
