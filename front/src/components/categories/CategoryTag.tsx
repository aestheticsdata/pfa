import { CATEGORY_FALLBACK } from "@components/categories/helpers/categoryColors";
import { cn } from "@lib/utils";

import type { ReactNode } from "react";

interface CategoryTagProps {
  /** Category colour (hex); falls back to the neutral grey when absent. */
  color?: string | null;
  className?: string;
  children: ReactNode;
}

/**
 * Coloured category pill — the category colour tints the text, a translucent
 * background and a border (hex + alpha suffix). Falls back to the neutral grey.
 */
function CategoryTag({ color, className, children }: CategoryTagProps) {
  const accent = color || CATEGORY_FALLBACK;
  return (
    <span
      className={cn("shrink-0 rounded px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wide", className)}
      style={{ color: accent, backgroundColor: `${accent}22`, border: `1px solid ${accent}44` }}
    >
      {children}
    </span>
  );
}

export { CategoryTag };
