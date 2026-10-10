import type { SectionLabelProps } from "@components/panel/shared/interfaces/sharedTypes";

/** `Load bots target ······ 80 live / 120` (`.lbl`); wraps on a phone. */
const SectionLabel = ({ label, children }: SectionLabelProps) => (
  <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2.5 text-body text-muted tablet:flex-nowrap">
    <span>{label}</span>
    {children}
  </div>
);

export default SectionLabel;
