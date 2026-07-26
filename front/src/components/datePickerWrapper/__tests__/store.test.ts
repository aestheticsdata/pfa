import { parseDateParam } from "@components/datePickerWrapper/helpers";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import format from "date-fns/format";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Same timezone pinning as helpers.test.ts: a week computed from a `?date=` param
// must be identical west of UTC (COS-73).
const originalTz = process.env.TZ;
beforeAll(() => {
  process.env.TZ = "America/New_York";
});
afterAll(() => {
  process.env.TZ = originalTz;
});

const iso = (date: Date) => format(date, "yyyy-MM-dd");
const state = () => useDatePickerWrapperStore.getState();
const setWeekFromParam = (param: string) => state().setWeek(parseDateParam(param));

beforeEach(() => {
  useDatePickerWrapperStore.setState({ from: null, to: null, range: null, selectedDateIso: null });
});

describe("setWeek", () => {
  it("loads the week containing the day, and the day as the selection", () => {
    setWeekFromParam("2026-07-15"); // Wednesday

    expect(iso(state().from as Date)).toBe("2026-07-12");
    expect(iso(state().to as Date)).toBe("2026-07-18");
    expect(state().range?.map(iso)).toEqual([
      "2026-07-12",
      "2026-07-13",
      "2026-07-14",
      "2026-07-15",
      "2026-07-16",
      "2026-07-17",
      "2026-07-18",
    ]);
    expect(state().selectedDateIso).toBe("2026-07-15");
  });

  it("writes nothing when the very same day is set again (the double-mounted picker)", () => {
    setWeekFromParam("2026-07-15");
    const listener = vi.fn();
    const unsubscribe = useDatePickerWrapperStore.subscribe(listener);

    setWeekFromParam("2026-07-15");

    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("moves the selection inside an already loaded week WITHOUT touching range's identity", () => {
    setWeekFromParam("2026-07-15");
    const rangeBefore = state().range;
    const fromBefore = state().from;

    // 12 July 2026 is a Sunday, i.e. the START of the loaded week: the old guard
    // (selectedDays[0] vs the param) read that as "already synced" and skipped it,
    // stranding selectedDateIso on the 15th (COS-99).
    setWeekFromParam("2026-07-12");

    expect(state().selectedDateIso).toBe("2026-07-12");
    expect(state().range).toBe(rangeBefore);
    expect(state().from).toBe(fromBefore);
  });

  it("replaces the period when the day belongs to another week", () => {
    setWeekFromParam("2026-07-15");
    const rangeBefore = state().range;

    setWeekFromParam("2026-07-20");

    expect(iso(state().from as Date)).toBe("2026-07-19");
    expect(state().range).not.toBe(rangeBefore);
  });

  it("recognises an already loaded week whatever the time of day it was set from", () => {
    // getWeekRange keeps its argument's time of day on month-truncated weeks, so
    // the same week reached from `new Date()` and from a param has different
    // timestamps for the same calendar day — comparing them by getTime would
    // re-write the week on every sync.
    state().setWeek(new Date(2026, 6, 29, 14, 32, 7)); // Wed 29 July, truncated week
    const rangeBefore = state().range;
    expect(iso(state().from as Date)).toBe("2026-07-26");
    expect(iso(state().to as Date)).toBe("2026-07-31");

    setWeekFromParam("2026-07-29");

    expect(state().range).toBe(rangeBefore);
  });

  it("keeps month-truncated weeks apart across a month boundary", () => {
    // 28 June → 4 July is one calendar week split into two pickable periods.
    setWeekFromParam("2026-06-29");
    expect(iso(state().from as Date)).toBe("2026-06-28");
    expect(iso(state().to as Date)).toBe("2026-06-30");
    const juneRange = state().range;

    setWeekFromParam("2026-07-02");

    expect(iso(state().from as Date)).toBe("2026-07-01");
    expect(iso(state().to as Date)).toBe("2026-07-04");
    expect(state().range).not.toBe(juneRange);
  });

  it("reloads the week over a month period left by the dashboard", () => {
    // The dashboard writes from = 1st of the month, which a from-only guard would
    // mistake for the truncated first week starting that same day.
    useDatePickerWrapperStore.setState({
      from: new Date(2026, 6, 1),
      to: new Date(2026, 6, 31),
      range: [new Date(2026, 6, 1)],
    });

    setWeekFromParam("2026-07-02");

    expect(iso(state().to as Date)).toBe("2026-07-04");
    expect(state().range?.map(iso)).toEqual(["2026-07-01", "2026-07-02", "2026-07-03", "2026-07-04"]);
  });
});
