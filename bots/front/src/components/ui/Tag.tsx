import { TONE } from "@components/ui/variants";
import { cx } from "@lib/classNames/cx";

import type { TagProps } from "@components/ui/interfaces/uiTypes";

const TONES = {
  [TONE.neutral]: "bg-panel2 text-dim",
  [TONE.ok]: "bg-okbg text-ok",
  [TONE.bad]: "bg-badbg text-bad",
  [TONE.warn]: "bg-warnbg text-warn",
  [TONE.info]: "bg-infobg text-info",
};

/** The small uppercase mono tag (`daily`, `incident`, `budget`…). */
const Tag = ({ tone = TONE.neutral, children, className }: TagProps) => (
  <span
    className={cx(
      "inline-block whitespace-nowrap rounded-tag px-1.75 py-0.5 font-mono text-micro font-medium uppercase tracking-tag",
      TONES[tone],
      className,
    )}
  >
    {children}
  </span>
);

export default Tag;
