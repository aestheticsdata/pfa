"use client";

import ErrorPanel from "@components/shared/errorPanel/ErrorPanel";

import type { ErrorPanelProps } from "@components/shared/interfaces/errorPanelTypes";

export default function ErrorPage(info: ErrorPanelProps) {
  return (
    <div className="min-h-screen w-full bg-surface-base px-4 py-16">
      <ErrorPanel {...info} />
    </div>
  );
}
