interface GroupCountProps {
  count: number;
}

/** The small line-count badge of a group. */
const GroupCount = ({ count }: GroupCountProps) => (
  <span className="num shrink-0 rounded-sm border border-line bg-surface-hi px-1.5 py-px text-2xs font-semibold text-ink-3">
    {count}
  </span>
);

export default GroupCount;
