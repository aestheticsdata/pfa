import {
  crossesMidnight,
  isApplicable,
  maskClock,
  offsetLabel,
  QUIET_ERROR,
  quietError,
  shiftWindow,
  zoneAbbreviation,
  zoneOffsetMinutes,
} from "@lib/panel/quietHours";
import { describe, expect, it } from "vitest";

const summer = new Date("2026-10-10T12:00:00Z");
const winter = new Date("2026-12-01T12:00:00Z");

describe("quiet hours (front)", () => {
  it("adds the colon as you type", () => {
    expect(maskClock("2")).toBe("2");
    expect(maskClock("223")).toBe("22:3");
    expect(maskClock("22:30")).toBe("22:30");
    expect(maskClock("2a2b30")).toBe("22:30");
  });

  it("reads Paris's offset and name across the change of hour", () => {
    expect(zoneOffsetMinutes("Europe/Paris", summer)).toBe(120);
    expect(zoneOffsetMinutes("Europe/Paris", winter)).toBe(60);
    expect(zoneAbbreviation("Europe/Paris", summer)).toBe("CEST");
    expect(zoneAbbreviation("Europe/Paris", winter)).toBe("CET");
    expect(offsetLabel(120)).toBe("+2 h");
  });

  it("shows the default 22:00 → 10:00 Paris as 20:00 → 08:00 UTC in summer, and back", () => {
    const utc = shiftWindow({ from: "22:00", to: "10:00" }, -120);
    expect(utc).toEqual({ from: "20:00", to: "08:00" });
    expect(shiftWindow(utc, 120)).toEqual({ from: "22:00", to: "10:00" });
    expect(shiftWindow({ from: "00:30", to: "1" }, -120)).toEqual({ from: "22:30", to: "1" });
  });

  it("validates like the handoff: From ≠ To, 24 h clock", () => {
    expect(quietError({ from: "10:00", to: "10:00" })).toBe(QUIET_ERROR.same);
    expect(quietError({ from: "25:00", to: "10:00" })).toBe(QUIET_ERROR.badClock);
    expect(quietError({ from: "22:0", to: "10:00" })).toBeNull();
    expect(isApplicable({ from: "22:00", to: "10:00" })).toBe(true);
    expect(crossesMidnight({ from: "22:00", to: "10:00" })).toBe(true);
    expect(crossesMidnight({ from: "12:00", to: "14:00" })).toBe(false);
  });
});
