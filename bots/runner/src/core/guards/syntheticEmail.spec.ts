import { assertSyntheticEmail, isSyntheticEmail } from "@core/guards/syntheticEmail";
import { describe, expect, it } from "vitest";

describe("synthetic email guard", () => {
  it("accepts the reserved domain only, case-insensitive", () => {
    expect(isSyntheticEmail("ceres@synthetic.test", "synthetic.test")).toBe(true);
    expect(isSyntheticEmail("Ceres@SYNTHETIC.test", "synthetic.test")).toBe(true);
  });

  it("refuses real and look-alike addresses", () => {
    for (const email of [
      "me@gmail.com",
      "bot@notsynthetic.test",
      "bot@x.synthetic.test",
      "synthetic.test@x.com",
      "@synthetic.test",
    ]) {
      expect(isSyntheticEmail(email, "synthetic.test")).toBe(false);
    }
    expect(() => assertSyntheticEmail("me@gmail.com", "synthetic.test")).toThrow(/non-synthetic/);
  });
});
