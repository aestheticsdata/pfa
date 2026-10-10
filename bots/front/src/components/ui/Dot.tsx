import { TONE } from "@components/ui/variants";
import { cx } from "@lib/classNames/cx";

import type { DotProps } from "@components/ui/interfaces/uiTypes";

const TONES = {
  [TONE.neutral]: "bg-faint",
  [TONE.ok]: "bg-ok ring-3 ring-okbg2",
  [TONE.bad]: "bg-bad ring-3 ring-badbg",
  [TONE.warn]: "bg-warn",
  [TONE.info]: "bg-info",
};

/** The 7px status dot; live states get a soft halo. */
const Dot = ({ tone = TONE.neutral }: DotProps) => (
  <span
    aria-hidden="true"
    className={cx("inline-block size-1.75 shrink-0 rounded-full", TONES[tone])}
  />
);

export default Dot;
