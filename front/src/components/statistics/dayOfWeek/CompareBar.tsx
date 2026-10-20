import { COMPARE_ANIM_MS, COMPARE_FILL } from "@components/statistics/dayOfWeek/constants";

interface CompareBarProps {
  frac: number;
  expanded: boolean;
}

/** Thin darker-green hatched bar for the compared year, on the shared fixed scale. */
const CompareBar = ({ frac, expanded }: CompareBarProps) => (
  <span
    className="block h-2 rounded-sm"
    // Width (not scaleX) so the diagonal hatch reveals instead of stretching. Grows
    // from 0 on show; the collapse back to 0 is deferred until after the fade-out
    // (off-screen), so hiding never visibly changes the bar's length.
    style={{
      width: expanded ? `${frac * 100}%` : 0,
      background: COMPARE_FILL,
      transition: `width ${COMPARE_ANIM_MS}ms ease-out`,
    }}
  />
);

export default CompareBar;
