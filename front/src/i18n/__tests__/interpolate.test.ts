import { interpolate } from "@i18n/interpolate";
import { createElement, isValidElement } from "react";
import { describe, expect, it } from "vitest";

describe("interpolate", () => {
  it("substitutes tokens with the provided values, keeping surrounding text", () => {
    expect(interpolate("Il reste {n}/jour.", { n: "147 €" })).toEqual(["Il reste ", "147 €", "/jour."]);
  });

  it("supports any word order (EN vs FR) from the same values", () => {
    expect(interpolate("{n}/day left until {d}.", { n: "147", d: "July 31" })).toEqual([
      "147",
      "/day left until ",
      "July 31",
      ".",
    ]);
  });

  it("keys React elements so they are safe as array children", () => {
    const [bold] = interpolate("{v}", { v: createElement("b", null, "42") });
    expect(isValidElement(bold) && bold.key).not.toBeNull();
  });

  it("renders unmatched tokens literally instead of dropping them", () => {
    expect(interpolate("reste {typo}", {})).toEqual(["reste ", "{typo}"]);
  });

  it("handles adjacent tokens and empty templates", () => {
    expect(interpolate("{a}{b}", { a: "x", b: "y" })).toEqual(["x", "y"]);
    expect(interpolate("", { a: "x" })).toEqual([]);
  });
});
