import { isQuietTime, isValidQuietHours, nextQuietChange, parseClock } from "@core/time/quietHours";
import { describe, expect, it } from "vitest";

const PARIS = "Europe/Paris";
const NIGHT = { from: "22:00", to: "10:00" };
/** A UTC instant, as ks-b's clock reads it: `utc("10-10 19:59")` is 2026-10-10T19:59Z. */
const utc = (at: string) => new Date(`2026-${at.replace(" ", "T")}:00Z`);

describe("quiet hours", () => {
  it("reads the window on Paris time while ks-b runs on UTC (summer, UTC+2)", () => {
    expect(isQuietTime(utc("10-10 19:59"), NIGHT, PARIS)).toBe(false); // 21:59 Paris
    expect(isQuietTime(utc("10-10 20:00"), NIGHT, PARIS)).toBe(true); // 22:00 Paris
    expect(isQuietTime(utc("10-11 07:59"), NIGHT, PARIS)).toBe(true); // 09:59 Paris, next day
    expect(isQuietTime(utc("10-11 08:00"), NIGHT, PARIS)).toBe(false); // 10:00 Paris
  });

  it("follows the change to winter time (UTC+1) without a fixed offset", () => {
    expect(isQuietTime(utc("12-01 20:30"), NIGHT, PARIS)).toBe(false); // 21:30 Paris
    expect(isQuietTime(utc("12-01 21:00"), NIGHT, PARIS)).toBe(true); // 22:00 Paris
    expect(isQuietTime(utc("12-02 09:00"), NIGHT, PARIS)).toBe(false); // 10:00 Paris
  });

  it("handles a window that does not cross midnight", () => {
    const lunch = { from: "12:00", to: "14:00" };
    expect(isQuietTime(utc("10-10 10:30"), lunch, PARIS)).toBe(true); // 12:30 Paris
    expect(isQuietTime(utc("10-10 12:00"), lunch, PARIS)).toBe(false); // 14:00 Paris
  });

  it("accepts only 24 h HH:MM, with distinct ends", () => {
    expect(parseClock("09:30")).toBe(9.5);
    expect(parseClock("24:00")).toBeNull();
    expect(parseClock("9:30")).toBeNull();
    expect(isValidQuietHours(NIGHT)).toBe(true);
    expect(isValidQuietHours({ from: "10:00", to: "10:00" })).toBe(false);
    expect(isValidQuietHours({ from: "22:00" })).toBe(false);
  });
});

describe("nextQuietChange", () => {
  it("names the next opening or closing, on Paris time", () => {
    expect(nextQuietChange(utc("10-10 15:00"), NIGHT, PARIS).toISOString()).toBe("2026-10-10T20:00:00.000Z");
    expect(nextQuietChange(utc("10-10 23:00"), NIGHT, PARIS).toISOString()).toBe("2026-10-11T08:00:00.000Z");
  });
});
