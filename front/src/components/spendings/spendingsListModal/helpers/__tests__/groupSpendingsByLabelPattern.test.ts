import {
  groupSpendingsByLabelPattern,
  normalizeLabel,
  OTHER_GROUP_KEY,
  tokenizeLabel,
} from "@components/spendings/spendingsListModal/helpers/groupSpendingsByLabelPattern";
import { describe, expect, it } from "vitest";

import type { LabelPatternGroup } from "@components/spendings/interfaces/labelPatternTypes";
import type { SpendingItem } from "@components/spendings/interfaces/spendingListTypes";

const makeItem = (ID: string, label: string, amount = 10): SpendingItem =>
  ({ ID, label, amount, date: "2026-08-12", itemType: "spending", userID: "u-1" }) as SpendingItem;

/** Named groups only, as `[key, count]` — the shape most assertions care about. */
const named = (items: SpendingItem[]): [string, number][] =>
  groupSpendingsByLabelPattern(items)
    .filter((group) => !group.isOther)
    .map((group) => [group.key, group.count]);

const otherGroup = (items: SpendingItem[]) => groupSpendingsByLabelPattern(items).find((group) => group.isOther);

describe("normalizeLabel", () => {
  it("lowercases and strips diacritics", () => {
    expect(normalizeLabel("Vélo Réparation")).toBe("velo reparation");
    expect(normalizeLabel("CRÈME dessert")).toBe("creme dessert");
  });

  it("turns punctuation into word breaks", () => {
    expect(normalizeLabel("velo — reparation")).toBe("velo reparation");
    expect(normalizeLabel("presse/kiosque (gare)")).toBe("presse kiosque gare");
    expect(normalizeLabel("l'atelier du coin")).toBe("l atelier du coin");
  });

  it("drops quantities and amounts", () => {
    expect(normalizeLabel("velo pieces x2")).toBe("velo pieces");
    expect(normalizeLabel("2x cafe")).toBe("cafe");
    expect(normalizeLabel("courses 12,50 €")).toBe("courses");
  });

  it("only eats a quantity that stands on its own", () => {
    expect(normalizeLabel("box 3")).toBe("box");
  });

  it("keeps digits inside a word — an alphanumeric word is a name", () => {
    expect(normalizeLabel("z30")).toBe("z30");
    expect(normalizeLabel("z30 marche 12,50 €")).toBe("z30 marche");
    expect(tokenizeLabel("courses z30")).toEqual(["courses", "z30"]);
  });

  it("returns an empty string for a label made of nothing but noise", () => {
    expect(normalizeLabel("  12,50 € !!  ")).toBe("");
  });
});

describe("tokenizeLabel", () => {
  it("keeps content words of three characters or more", () => {
    expect(tokenizeLabel("atelier velo")).toEqual(["atelier", "velo"]);
  });

  it("drops stop words and short words", () => {
    expect(tokenizeLabel("le velo de la gare")).toEqual(["velo", "gare"]);
    expect(tokenizeLabel("cafe pour les amis")).toEqual(["cafe", "amis"]);
  });
});

describe("groupSpendingsByLabelPattern", () => {
  it("returns nothing for an empty set", () => {
    expect(groupSpendingsByLabelPattern([])).toEqual([]);
  });

  it("gathers the spellings of one pattern and leaves the isolated label in Other", () => {
    const items = [
      makeItem("a", "atelier velo", 30),
      makeItem("b", "velo — reparation", 45),
      makeItem("c", "velo pieces x2", 25),
      makeItem("d", "presse kiosque", 4),
      makeItem("e", "presse gare", 6),
      makeItem("f", "restaurant", 20),
    ];

    const groups = groupSpendingsByLabelPattern(items);

    expect(groups.map((group) => group.key)).toEqual(["velo", "presse", OTHER_GROUP_KEY]);
    expect(groups[0]).toMatchObject({ name: "Velo", count: 3, total: 100 });
    expect(groups[0].ids).toEqual(["a", "b", "c"]);
    expect(groups[1]).toMatchObject({ name: "Presse", count: 2, total: 10 });
    expect(groups[2]).toMatchObject({ name: "", count: 1, isOther: true, ids: ["f"] });
  });

  it("names a group after the most frequent original spelling, accents kept", () => {
    const groups = groupSpendingsByLabelPattern([
      makeItem("a", "Vélo atelier"),
      makeItem("b", "vélo chaine"),
      makeItem("c", "velo pieces"),
    ]);

    expect(groups[0].name).toBe("Vélo");
  });

  it("files a spending under the most shared token of its label", () => {
    const items = [
      makeItem("a", "velo atelier"),
      makeItem("b", "velo chaine"),
      makeItem("c", "velo casque"),
      makeItem("d", "casque audio"),
    ];

    // "velo" is in three labels, "casque" in two: c joins the bigger pattern
    // instead of opening a two-spending "casque" bucket — which leaves d
    // alone, and a lone spending is not a pattern.
    expect(named(items)).toEqual([["velo", 3]]);
    expect(otherGroup(items)?.ids).toEqual(["d"]);
  });

  it("merges a key that is the prefix of another, the stem keeping the key", () => {
    const items = [
      makeItem("a", "velo pieces", 10),
      makeItem("b", "velo chaine", 10),
      makeItem("c", "velos entretien", 40),
      makeItem("d", "velos revision", 40),
    ];

    // The stem names the pattern even though the longer spelling weighs more.
    expect(groupSpendingsByLabelPattern(items)[0]).toMatchObject({ key: "velo", name: "Velo", count: 4, total: 100 });
  });

  it("rescues a leftover whose token is a written variant of a surviving key", () => {
    const items = [makeItem("a", "velo pneu"), makeItem("b", "velo lampe"), makeItem("c", "velos revision")];

    // "velos" appears once, so c has no candidate token — but it is a written
    // variant of the velo group's key, which is where it belongs.
    expect(named(items)).toEqual([["velo", 3]]);
    expect(otherGroup(items)).toBeUndefined();
  });

  it("rescues a leftover one edit away from a surviving key", () => {
    const items = [makeItem("a", "cantine lundi"), makeItem("b", "cantine mardi"), makeItem("c", "cantone jeudi")];

    // "cantone" appears once, so c has no candidate token — but it is one typo
    // away from the cantine group's key, which is where it belongs.
    expect(named(items)).toEqual([["cantine", 3]]);
    expect(otherGroup(items)).toBeUndefined();
  });

  it("re-deals a spending a generic word stole from a small pattern", () => {
    const items = [
      makeItem("a", "presse gare", 10),
      makeItem("b", "presse tabac", 10),
      makeItem("c", "presse courses", 50),
      makeItem("d", "marche courses", 10),
      makeItem("e", "marche", 5),
    ];

    // "courses" outweighs "marche" on d's tie, but ends up holding d alone —
    // the starved generic key is retired and d falls back to marche, keeping
    // the small pattern alive instead of scattering both spendings to Other.
    expect(named(items)).toEqual([
      ["presse", 3],
      ["marche", 2],
    ]);
    expect(otherGroup(items)).toBeUndefined();
  });

  it("groups labels that are nothing but an alphanumeric name", () => {
    const items = [makeItem("a", "z30", 20), makeItem("b", "z30", 30), makeItem("c", "restaurant gare", 5)];

    const groups = groupSpendingsByLabelPattern(items);

    expect(groups[0]).toMatchObject({ key: "z30", name: "Z30", count: 2, total: 50 });
    expect(otherGroup(items)?.ids).toEqual(["c"]);
  });

  it("leaves a leftover without any close key in Other", () => {
    const items = [makeItem("a", "velo pneu"), makeItem("b", "velo lampe"), makeItem("c", "restaurant gare")];

    expect(named(items)).toEqual([["velo", 2]]);
    expect(otherGroup(items)?.ids).toEqual(["c"]);
  });

  it("merges keys one edit apart when they are long enough", () => {
    const items = [
      makeItem("a", "cantine lundi", 12),
      makeItem("b", "cantine mardi", 12),
      makeItem("c", "cantone jeudi", 9),
      makeItem("d", "cantone vendredi", 9),
    ];

    expect(named(items)).toEqual([["cantine", 4]]);
  });

  it("leaves short lookalike keys alone — one edit down there is another word", () => {
    const items = [
      makeItem("a", "riz complet"),
      makeItem("b", "riz basmati"),
      makeItem("c", "ris veau"),
      makeItem("d", "ris cuisine"),
    ];

    // One substitution apart, but three characters long: below the fuzzy floor
    // these are two different words, not a typo.
    expect(named(items).map(([key]) => key)).toEqual(["ris", "riz"]);
  });

  it("sends a group left with a single spending to Other", () => {
    const items = [
      makeItem("a", "velo presse", 100),
      makeItem("b", "velo atelier", 1),
      makeItem("c", "presse gare", 100),
    ];

    // "velo" and "presse" are in two labels each, so the heavier token takes the
    // tie on a — and "velo" is left holding b alone.
    expect(named(items)).toEqual([["presse", 2]]);
    expect(otherGroup(items)?.ids).toEqual(["b"]);
  });

  it("shares the visible total across the groups, adding up to 100%", () => {
    const items = [
      makeItem("a", "velo atelier", 60),
      makeItem("b", "velo chaine", 40),
      makeItem("c", "presse gare", 50),
      makeItem("d", "presse kiosque", 50),
    ];

    const groups = groupSpendingsByLabelPattern(items);

    expect(groups.map((group) => group.pct)).toEqual([50, 50]);
  });

  it("ranks by amount, not by number of spendings", () => {
    const items = [
      makeItem("a", "presse gare", 5),
      makeItem("b", "presse kiosque", 5),
      makeItem("c", "presse tabac", 5),
      makeItem("d", "velo atelier", 200),
      makeItem("e", "velo chaine", 100),
    ];

    expect(named(items)).toEqual([
      ["velo", 2],
      ["presse", 3],
    ]);
  });

  it("gives the same result whatever order the spendings arrive in", () => {
    const items = [
      makeItem("a", "atelier velo", 30),
      makeItem("b", "velo reparation", 45),
      makeItem("c", "presse kiosque", 4),
      makeItem("d", "presse gare", 6),
      makeItem("e", "restaurant", 20),
      makeItem("f", "cinema", 12),
    ];
    const shuffled = [items[4], items[1], items[5], items[3], items[0], items[2]];
    const sortIDs = (groups: LabelPatternGroup[]) => groups.map((group) => ({ ...group, ids: [...group.ids].sort() }));

    expect(sortIDs(groupSpendingsByLabelPattern(shuffled))).toEqual(sortIDs(groupSpendingsByLabelPattern(items)));
  });

  it("ignores the category's own name — inside its category it says nothing", () => {
    const items = [
      makeItem("a", "kiosque - velo", 10),
      makeItem("b", "kiosque - velo", 12),
      makeItem("c", "presse - velo", 20),
      makeItem("d", "presse - velo", 8),
    ];

    // Labels suffixed with the category name make it the most shared word of
    // the set: without the exclusion, one giant group named after the category.
    expect(groupSpendingsByLabelPattern(items).map((group) => group.key)).toEqual(["velo"]);
    expect(groupSpendingsByLabelPattern(items, "Vélo").map((group) => [group.key, group.count])).toEqual([
      ["presse", 2],
      ["kiosque", 2],
    ]);
  });

  it("keeps a tie between equal totals stable whatever the input order", () => {
    // Both tokens sit in three labels and weigh a mathematically equal 0.60 —
    // summed as floats, the two totals can come out a last-bit apart depending
    // on accumulation order, silently flipping the tie. Cent sums keep it a
    // real tie, resolved alphabetically, identically for every permutation.
    const items = [
      makeItem("a", "velo alpha", 0.1),
      makeItem("b", "velo bravo", 0.2),
      makeItem("c", "velo presse", 0.3),
      makeItem("d", "presse delta", 0.1),
      makeItem("e", "presse gamma", 0.2),
    ];
    const shape = (list: SpendingItem[]) =>
      groupSpendingsByLabelPattern(list).map((group) => [group.key, [...group.ids].sort()]);
    const reference = shape(items);

    for (let i = 1; i < items.length; i += 1) {
      expect(shape([...items.slice(i), ...items.slice(0, i)])).toEqual(reference);
    }
  });
});
