"use client";

import Button from "@components/ui/Button";
import { BUTTON_SIZE, BUTTON_VARIANT } from "@components/ui/variants";
import { PANEL_TEXT } from "@text/panel";
import { catchError } from "next/error";

import type { BoundaryProps } from "@components/panel/shared/interfaces/sharedTypes";
import type { ErrorInfo } from "next/error";

/**
 * Next 16.3's custom error boundary around each block of live data: a runner that stops answering
 * breaks that block, not the page, and `retry()` re-renders it — Server Components included —
 * without a reload. `redirect` and `notFound` pass through untouched (a dead session still goes
 * to sign in).
 */
const Fallback = (props: BoundaryProps, { error, retry }: ErrorInfo) => (
  <div
    role="alert"
    className="mt-4 flex flex-wrap items-center gap-3 rounded-card border border-bad/55 bg-badbg px-3.5 py-3 text-body"
  >
    <span className="font-medium">{props.title ?? PANEL_TEXT.boundary.failed}</span>
    <span className="min-w-0 flex-1 truncate font-mono text-xs text-badtx">
      {error instanceof Error ? error.message : String(error)}
    </span>
    <Button
      variant={BUTTON_VARIANT.ghost}
      size={BUTTON_SIZE.sm}
      onClick={() => retry()}
    >
      {PANEL_TEXT.boundary.retry}
    </Button>
  </div>
);

export default catchError(Fallback);
