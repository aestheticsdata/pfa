"use client";

import { Button } from "@components/ui/button";
import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen w-full bg-surface-base px-4 py-16">
      <div className="mx-auto flex max-w-2xl flex-col items-center rounded-xl border border-line bg-surface-elev p-8 text-ink shadow-card backdrop-blur-sm">
        <p className="mb-2 text-xs uppercase tracking-[0.22em] text-neg">Application Error</p>
        <h1 className="mb-4 text-center text-3xl font-bold">Something went wrong</h1>
        <p className="mb-8 text-center text-sm text-ink-3">
          The page failed to load. You can retry now or go back to the dashboard.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            variant="primary"
            onClick={reset}
          >
            Retry
          </Button>
          <Button
            variant="muted"
            asChild
          >
            <a href="/dashboard">Back to dashboard</a>
          </Button>
        </div>

        {process.env.NODE_ENV !== "production" && (
          <pre className="mt-6 w-full overflow-auto rounded-sm bg-surface-base p-3 text-xs text-neg">
            {error.message}
          </pre>
        )}
      </div>
    </div>
  );
}
