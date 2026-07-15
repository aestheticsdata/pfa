// Widths here are expressed as 12-column spans rather than `w-40`-style
// utilities on purpose: the DS stylesheet is compiled from the app's own source
// (`@source "../src"` in .design-sync/ds-styles.src.css) plus an explicit
// safelist, and that safelist covers spacing/grid but NOT `w-*`/`h-*`. The app
// never uses w-40/w-48/w-32, so those classes compile to nothing and every bar
// silently renders full-width. `grid-cols-12` + `col-span-*` are safelisted, so
// they are the honest way to size a skeleton today. Note the safelist stops at
// `col-span-6` (+ `col-span-full`): there is no col-span-7..11, so rows are built
// from spans <= 6 or given their own grid instead of padded out with a spacer.
// See learnings/feedback.md.

import { CardSectionHeader, GlowCard, Skeleton } from "pfa-next";

/** The primitive: a skeleton is only ever as big as the box you give it. */
export const Default = () => (
  <div className="grid grid-cols-12">
    <Skeleton className="col-span-4 h-4" />
  </div>
);

/** Ragged bars standing in for a block of text or stacked labels. */
export const TextLines = () => (
  <div className="flex flex-col gap-2">
    <div className="grid grid-cols-12">
      <Skeleton className="col-span-6 h-4" />
    </div>
    <div className="grid grid-cols-12">
      <Skeleton className="col-span-5 h-4" />
    </div>
    <div className="grid grid-cols-12">
      <Skeleton className="col-span-3 h-4" />
    </div>
  </div>
);

/** A loading list of spendings: label on the left, amount right-aligned. */
export const LoadingList = () => (
  <div className="grid grid-cols-12 items-center gap-x-2 gap-y-3">
    <Skeleton className="col-span-4 h-3" />
    <div className="col-span-6" />
    <Skeleton className="col-span-2 h-3" />

    <Skeleton className="col-span-5 h-3" />
    <div className="col-span-5" />
    <Skeleton className="col-span-2 h-3" />

    <Skeleton className="col-span-3 h-3" />
    <div className="col-span-6" />
    <Skeleton className="col-span-3 h-3" />

    <Skeleton className="col-span-4 h-3" />
    <div className="col-span-6" />
    <Skeleton className="col-span-2 h-3" />
  </div>
);

/** The card-level loading state: real header, skeleton body. */
export const CardLoading = () => (
  <GlowCard
    as="section"
    className="flex flex-col gap-4 px-6 py-5"
  >
    <CardSectionHeader title="Dépenses fixes" meta="mai 2026" />
    <div className="grid grid-cols-12 items-center gap-x-2 gap-y-3">
      <Skeleton className="col-span-4 h-3" />
      <div className="col-span-6" />
      <Skeleton className="col-span-2 h-3" />

      <Skeleton className="col-span-5 h-3" />
      <div className="col-span-5" />
      <Skeleton className="col-span-2 h-3" />

      <Skeleton className="col-span-3 h-3" />
      <div className="col-span-6" />
      <Skeleton className="col-span-3 h-3" />
    </div>
  </GlowCard>
);

/** The metrics row while the month's totals are still in flight. */
export const MetricsLoading = () => (
  <div className="grid grid-cols-4 gap-6">
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-12">
        <Skeleton className="col-span-6 h-3" />
      </div>
      <Skeleton className="h-7" />
      <div className="grid grid-cols-12">
        <Skeleton className="col-span-5 h-3" />
      </div>
    </div>
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-12">
        <Skeleton className="col-span-5 h-3" />
      </div>
      <div className="grid grid-cols-12">
        <Skeleton className="col-span-6 h-7" />
      </div>
      <div className="grid grid-cols-12">
        <Skeleton className="col-span-4 h-3" />
      </div>
    </div>
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-12">
        <Skeleton className="col-span-6 h-3" />
      </div>
      <Skeleton className="h-7" />
      <div className="grid grid-cols-12">
        <Skeleton className="col-span-6 h-3" />
      </div>
    </div>
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-12">
        <Skeleton className="col-span-4 h-3" />
      </div>
      <div className="grid grid-cols-12">
        <Skeleton className="col-span-5 h-7" />
      </div>
      <div className="grid grid-cols-12">
        <Skeleton className="col-span-5 h-3" />
      </div>
    </div>
  </div>
);
