import { isSyntheticIpAllowed } from "./synthetic-ip.util";

describe("isSyntheticIpAllowed", () => {
  it("allows an address on the list, IPv4-mapped or not", () => {
    expect(isSyntheticIpAllowed("203.0.113.7", "203.0.113.7")).toBe(true);
    expect(isSyntheticIpAllowed("::ffff:203.0.113.7", "203.0.113.7")).toBe(true);
    expect(isSyntheticIpAllowed("127.0.0.1", " 203.0.113.7 , 127.0.0.1 ")).toBe(true);
    expect(isSyntheticIpAllowed("::1", "::1")).toBe(true);
  });

  it("refuses any other address", () => {
    expect(isSyntheticIpAllowed("198.51.100.9", "203.0.113.7")).toBe(false);
    expect(isSyntheticIpAllowed("203.0.113.70", "203.0.113.7")).toBe(false);
  });

  it("fails closed without an allowlist or a client address", () => {
    expect(isSyntheticIpAllowed("203.0.113.7", undefined)).toBe(false);
    expect(isSyntheticIpAllowed("203.0.113.7", "")).toBe(false);
    expect(isSyntheticIpAllowed("203.0.113.7", " , ")).toBe(false);
    expect(isSyntheticIpAllowed(undefined, "203.0.113.7")).toBe(false);
  });
});
