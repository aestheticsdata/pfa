import { ago, count, countdown, duration, longSpan, megabytes, slotRange, weekDay } from "@lib/format/format";
import { describe, expect, it } from "vitest";

describe("format", () => {
  const now = Date.parse("2026-10-10T12:00:00Z");
  const earlier = (ms: number) => new Date(now - ms).toISOString();

  it("says how long ago, the way the handoff writes it", () => {
    expect(ago(null, now)).toBe("—");
    expect(ago(earlier(2_000), now)).toBe("now");
    expect(ago(earlier(12_000), now)).toBe("12s ago");
    expect(ago(earlier(3 * 60_000), now)).toBe("3m ago");
    expect(ago(earlier(5 * 3_600_000), now)).toBe("5h ago");
    expect(ago(earlier(2 * 86_400_000), now)).toBe("2d ago");
  });

  it("formats durations, countdowns, sizes and counts", () => {
    expect(duration(42_000)).toBe("42s");
    expect(duration((5 * 3600 + 3 * 60) * 1000)).toBe("5h 03m");
    expect(countdown(125)).toBe("2m 05s");
    expect(countdown(45)).toBe("45s");
    expect(megabytes(0.0004)).toBe("0.000");
    expect(megabytes(0.024)).toBe("0.024");
    expect(megabytes(0.999)).toBe("0.999");
    expect(megabytes(0.9996)).toBe("1.0");
    expect(megabytes(1)).toBe("1.0");
    expect(megabytes(38.24)).toBe("38.2");
    expect(megabytes(212.6)).toBe("212.6");
    expect(count(12002)).toBe("12,002");
    expect(longSpan(34)).toBe("34 days");
    expect(longSpan(0.5)).toBe("12 h");
    expect(longSpan(365)).toBe("365 days");
    expect(longSpan(400)).toBe("1y 01m");
    expect(longSpan(10233)).toBe("28y 00m");
    expect(longSpan(800)).toBe("2y 02m");
  });

  it("writes a slice as its start and end minute", () => {
    const range = slotRange("2026-10-10T12:15:00Z", 15);
    expect(range).toMatch(/^\d\d:\d\d – \d\d:\d\d$/);
    const [start = "", end = ""] = range.split(" – ");
    const minutes = (hm: string) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3));
    expect((minutes(end) - minutes(start) + 1440) % 1440).toBe(15);
  });

  it("names the day of a slice", () => {
    expect(weekDay("2026-10-11T12:00:00Z")).toMatch(/^Sun 11 Oct$/);
  });
});
