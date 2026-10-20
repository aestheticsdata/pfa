import type { QueryFamily } from "@lib/query/interfaces/queryTypes";
import type { QueryClient } from "@tanstack/react-query";

/**
 * Invalidates whole query families by their key prefix (PFA-253). A mutation marks every month,
 * year or filter of a family stale — only the mounted queries refetch, the others on their next
 * use — so no hand-built key can drift from the one the query was cached under.
 */
export const invalidateFamilies = (queryClient: QueryClient, families: QueryFamily[]) =>
  Promise.all(families.map((family) => queryClient.invalidateQueries({ queryKey: [family] })));
