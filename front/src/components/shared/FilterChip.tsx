import { cn } from "@lib/utils";

type FilterChipAccent = "accent" | "exc";

interface FilterChipProps extends Omit<React.ComponentProps<"button">, "type"> {
  active: boolean;
  /** Active-state accent when no dynamic colour is given. Defaults to the green accent. */
  accent?: FilterChipAccent;
  /** Per-item colour (e.g. a category colour) that tints the active state; overrides `accent`. */
  accentColor?: string;
}

const ACTIVE_ACCENT: Record<FilterChipAccent, string> = {
  accent: "border-accent-d bg-accent-bg text-accent-strong",
  exc: "border-exc/60 bg-exc/10 text-exc",
};

const INACTIVE = "border-line bg-surface-hi text-ink-2 hover:bg-surface-hover hover:text-ink";

/**
 * Toggle filter chip shared by the filter bars. The inactive recipe is identical
 * everywhere; the active state is tinted either by a semantic `accent` (green /
 * exceptionals orange) or by a dynamic `accentColor` (e.g. a category colour).
 * Shape/spacing (`rounded-*`, `px-*`, `gap-*`, `capitalize`) is passed via `className`.
 */
function FilterChip({ active, accent = "accent", accentColor, className, children, ...props }: FilterChipProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center border py-1 text-xs transition-colors",
        active ? (accentColor ? "text-ink" : ACTIVE_ACCENT[accent]) : INACTIVE,
        className,
      )}
      {...props}
      style={
        active && accentColor
          ? { borderColor: accentColor, backgroundColor: `${accentColor}1f`, color: accentColor }
          : undefined
      }
    >
      {children}
    </button>
  );
}

export { FilterChip };
