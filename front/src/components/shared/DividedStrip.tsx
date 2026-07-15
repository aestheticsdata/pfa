import GlowCard from "@components/shared/GlowCard";
import { cn } from "@lib/utils";

import type { ReactNode } from "react";

interface DividedStripProps {
  /** Grid track classes, e.g. `grid-cols-1 sm:grid-cols-3`. */
  className?: string;
  /** Cells — each supplies its own opaque fill (`bg-card`) and padding. */
  children: ReactNode;
}

/**
 * Top-of-page stat strip: a `GlowCard` pane whose cells are split by hairlines.
 *
 * The dividers are the `--line-soft` fill showing through a 1px grid gap, which
 * means the grid must own its `background` — and `.pfa-card` paints its gradient
 * border through `background` too. The two cannot share one box, hence the inner
 * grid element.
 */
const DividedStrip = ({ className, children }: DividedStripProps) => (
  <GlowCard
    as="section"
    className="overflow-hidden"
  >
    <div className={cn("grid gap-px bg-line-soft", className)}>{children}</div>
  </GlowCard>
);

export { DividedStrip };
