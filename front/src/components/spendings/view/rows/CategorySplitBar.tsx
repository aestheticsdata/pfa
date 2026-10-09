import type { CategoryShare } from "@components/spendings/interfaces/spendingGroupTypes";

interface CategorySplitBarProps {
  shares: CategoryShare[];
}

/** A group's mini split bar in the tag column: one segment per category, sized by amount (PFA-192). */
const CategorySplitBar = ({ shares }: CategorySplitBarProps) => (
  <span
    aria-hidden
    className="flex h-1.5 w-24 gap-0.5 max-md:w-16"
  >
    {shares.map((share) => (
      <i
        key={share.category}
        className="block rounded-xs"
        style={{ background: share.color, flexGrow: share.amount }}
      />
    ))}
  </span>
);

export default CategorySplitBar;
