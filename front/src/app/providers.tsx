"use client";

import { Toaster } from "@components/ui/sonner";
import { LocaleProvider } from "@i18n/LocaleContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  // App-wide query behavior (COS-157): data is month-scoped and refreshed by
  // explicit invalidation after mutations, hence the long staleTime and no
  // focus refetch. Errors surface through error.tsx via throwOnError; hooks
  // whose UI degrades gracefully (search modal, label suggestions…) opt out
  // locally. Expired sessions never get here — the 401 redirects to /login at
  // the request layer (COS-26).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 60 * 60 * 1000, // 1 hour
            throwOnError: true,
          },
        },
      }),
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <NuqsAdapter>
        <QueryClientProvider client={queryClient}>
          <LocaleProvider>{children}</LocaleProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </NuqsAdapter>
      <Toaster
        richColors
        closeButton
        position="top-right"
      />
    </ThemeProvider>
  );
}
