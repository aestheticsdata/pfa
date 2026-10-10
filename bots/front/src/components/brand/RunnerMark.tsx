import type { MarkProps } from "@components/brand/interfaces/brandTypes";

/** The square "br" mark of the bot-runner identity (terminal variant: outline only). */
const RunnerMark = ({ size }: MarkProps) => (
  <span
    aria-hidden="true"
    className="grid shrink-0 place-items-center border border-text font-mono font-semibold tracking-mark text-text"
    style={{ width: size, height: size, fontSize: size * 0.38 }}
  >
    br
  </span>
);

export default RunnerMark;
