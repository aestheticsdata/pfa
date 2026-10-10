import { botsHref, readFilters } from "@components/panel/bots/botsQuery";
import { describe, expect, it } from "vitest";

describe("bots query", () => {
  it("round-trips the filters, leaving the defaults out of the URL", () => {
    expect(botsHref("pfa", { population: "all", state: "all", q: "", page: 0 })).toBe("/pfa/bots");
    const href = botsHref("pfa", { population: "load", state: "degraded", q: "legion", page: 2 });
    expect(href).toBe("/pfa/bots?population=load&state=degraded&q=legion&page=2");
    const params = Object.fromEntries(new URL(href, "http://x").searchParams);
    expect(readFilters(params)).toEqual({ population: "load", state: "degraded", q: "legion", page: 2 });
    expect(readFilters({ page: "-3" }).page).toBe(0);
  });
});
