import type { SliceSectionProps } from "@components/panel/shared/slice/interfaces/sliceTypes";

/** A titled block of the slice detail, ruled off from the one above. */
const SliceSection = ({ title, aside, children }: SliceSectionProps) => (
  <section className="border-t border-line-soft pt-3.5 first:border-t-0 first:pt-0">
    <h4 className="m-0 mb-2.5 flex items-baseline justify-between gap-3 text-tiny font-medium uppercase tracking-th text-dim">
      <span>{title}</span>
      {aside && <span className="font-mono normal-case tracking-normal">{aside}</span>}
    </h4>
    {children}
  </section>
);

export default SliceSection;
