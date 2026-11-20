import { QueryClient } from "@tanstack/react-query";

/** The app's query cache. Persistence and offline replay arrive with the first data screens (lot 4). */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1 },
    mutations: { retry: 0 },
  },
});
