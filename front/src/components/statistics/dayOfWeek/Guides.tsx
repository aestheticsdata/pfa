import type { GuidesProps } from "@components/statistics/interfaces/dayOfWeekTypes";

interface ThresholdGuideProps {
  frac: number;
}

/** A dashed grey guide delimiting a colour zone, spanning the height of one row's
 *  bar. 1px to match the budget ticks at the bottom. */
const ThresholdGuide = ({ frac }: ThresholdGuideProps) => (
  <span
    className="absolute inset-y-0"
    style={{ left: `${frac * 100}%`, marginLeft: -0.5, borderLeft: "1px dashed var(--ink)", opacity: 0.6 }}
  />
);

/** The plot's vertical references — the optional colour-zone guides at the budget
 *  thresholds, plus the year's average. Absolutely positioned, so the caller's
 *  element decides how far down they run. */
const Guides = ({ budgetFrac, dangerFrac, avgFrac }: GuidesProps) => (
  <>
    {budgetFrac != null && <ThresholdGuide frac={budgetFrac} />}
    {dangerFrac != null && <ThresholdGuide frac={dangerFrac} />}
    <span
      className="absolute inset-y-0"
      style={{ left: `${avgFrac * 100}%`, marginLeft: -1, borderLeft: "2px dashed var(--accent-strong)", opacity: 0.7 }}
    />
  </>
);

export default Guides;
