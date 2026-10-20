import {
  categoryTrendsQuery,
  dashboardQuery,
  spendingSearchQuery,
  spendingsByMonthQuery,
} from "@components/spendings/services/queries";
import { invalidateFamilies } from "@lib/query/invalidate";
import { QUERY_KEYS } from "@lib/query/keys";
import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import type { PrivateRequest } from "@helpers/interfaces/httpTypes";

const requestReturning = (data: unknown) => vi.fn<PrivateRequest>().mockResolvedValue({ status: 200, data });

describe("month-scoped query factories (PFA-253)", () => {
  it("key a month by the yyyy-MM-dd bounds the request sends", async () => {
    const request = requestReturning([]);
    const query = spendingsByMonthQuery(request, { from: "2026-10-01", to: "2026-10-31" });

    expect(query.queryKey).toEqual([QUERY_KEYS.SPENDINGS_BY_MONTH, "2026-10-01", "2026-10-31"]);
    expect(query.enabled).toBe(true);
    await new QueryClient().fetchQuery(query);
    expect(request).toHaveBeenCalledWith("/spendings?from=2026-10-01&to=2026-10-31");
  });

  it("stay idle without a month", () => {
    expect(spendingsByMonthQuery(requestReturning([]), null).enabled).toBe(false);
    expect(dashboardQuery(requestReturning(null), null).enabled).toBe(false);
  });

  it("send the comparison windows as given", async () => {
    const request = requestReturning({ trends: [], previousTotal: 0 });
    const windows = {
      current: { from: "2026-10-18", to: "2026-10-24" },
      previous: { from: "2026-10-11", to: "2026-10-17" },
    };

    await new QueryClient().fetchQuery(categoryTrendsQuery(request, windows));

    expect(request).toHaveBeenCalledWith(
      "/category-trends?from=2026-10-18&to=2026-10-24&prevFrom=2026-10-11&prevTo=2026-10-17",
    );
  });

  it("page the search with the cursor", async () => {
    const request = requestReturning({ items: [], total: 0, nextCursor: null });
    const query = spendingSearchQuery(request, { query: "a b", year: 2025 });

    await new QueryClient().fetchInfiniteQuery(query);

    expect(request).toHaveBeenCalledWith("/spendings/search?q=a%20b&year=2025");
    expect(query.getNextPageParam({ items: [], total: 0, nextCursor: "c1" }, [], undefined, [])).toBe("c1");
  });
});

describe("invalidateFamilies", () => {
  it("marks every month of a family stale, whatever the week the mutation came from", async () => {
    const client = new QueryClient();
    client.setQueryData([QUERY_KEYS.SPENDINGS_BY_MONTH, "2026-10-01", "2026-10-31"], []);
    client.setQueryData([QUERY_KEYS.SPENDINGS_BY_MONTH, "2026-09-01", "2026-09-30"], []);
    client.setQueryData([QUERY_KEYS.DASHBOARD, "2026-10-01"], null);

    await invalidateFamilies(client, [QUERY_KEYS.SPENDINGS_BY_MONTH]);

    const state = (key: unknown[]) => client.getQueryState(key)?.isInvalidated;
    expect(state([QUERY_KEYS.SPENDINGS_BY_MONTH, "2026-10-01", "2026-10-31"])).toBe(true);
    expect(state([QUERY_KEYS.SPENDINGS_BY_MONTH, "2026-09-01", "2026-09-30"])).toBe(true);
    expect(state([QUERY_KEYS.DASHBOARD, "2026-10-01"])).toBe(false);
  });
});
