import { CATEGORY_FALLBACK } from "@components/categories/helpers/categoryColors";
import { cn } from "@lib/utils";

interface CategoryColorDotProps {
  /** Category colour (hex); falls back to the neutral grey when absent. */
  color?: string | null;
  /** Override the default `size-2` square (e.g. `h-5 w-1` bar, `size-2.5`). */
  className?: string;
}

/** Small coloured swatch of a category's colour. */
function CategoryColorDot({ color, className }: CategoryColorDotProps) {
  return (
    <span
      className={cn("size-2 shrink-0 rounded-xs", className)}
      style={{ background: color || CATEGORY_FALLBACK }}
    />
  );
}

export { CategoryColorDot };
