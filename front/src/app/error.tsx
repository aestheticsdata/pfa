"use client";

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
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 px-4 py-16">
      <div className="mx-auto flex max-w-2xl flex-col items-center rounded-xl border border-slate-400/20 bg-slate-900/50 p-8 text-slate-100 shadow-2xl backdrop-blur-sm">
        <p className="mb-2 text-xs uppercase tracking-[0.22em] text-amber-300">Application Error</p>
        <h1 className="mb-4 text-center text-3xl font-bold">Something went wrong</h1>
        <p className="mb-8 text-center text-sm text-slate-300">
          The page failed to load. You can retry now or go back to the dashboard.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-sm bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Retry
          </button>
          <a
            href="/dashboard"
            className="rounded-sm border border-slate-300/50 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-100 hover:text-slate-900"
          >
            Back to dashboard
          </a>
        </div>

        {process.env.NODE_ENV !== "production" && (
          <pre className="mt-6 w-full overflow-auto rounded-sm bg-slate-950 p-3 text-xs text-rose-300">
            {error.message}
          </pre>
        )}
      </div>
    </div>
  );
}
