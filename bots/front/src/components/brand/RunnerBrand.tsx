import RunnerMark from "@components/brand/RunnerMark";
import { AUTH_TEXT } from "@text/auth";

import type { MarkProps } from "@components/brand/interfaces/brandTypes";

/** Mark + `tty://bot-runner` wordmark. */
const RunnerBrand = ({ size }: MarkProps) => (
  <span className="flex items-center gap-2.5">
    <RunnerMark size={size} />
    <span className="font-mono text-body font-semibold tracking-wordmark text-text">
      <span className="text-dim">tty://</span>
      {AUTH_TEXT.brand}
    </span>
  </span>
);

export default RunnerBrand;
