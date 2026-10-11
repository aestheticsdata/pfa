"use client";

import ErrorPanel from "@components/shared/errorPanel/ErrorPanel";

import type { ErrorPanelProps } from "@components/shared/interfaces/errorPanelTypes";

// Sits under the private layout, so the NavBar stays on screen while a page is in error (PFA-160).
export default function PrivateErrorPage(info: ErrorPanelProps) {
  return (
    <div className="py-16">
      <ErrorPanel {...info} />
    </div>
  );
}
