import {
  FOLDED_OTHER_GROUP_KEY,
  foldLabelPatternGroups,
  groupSpendingsByLabelPattern,
  MAX_LABEL_PATTERN_GROUPS,
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

  it("files a spending under the most discriminant token of its label", () => {
    const items = [
      makeItem("a", "courses velo", 30),
      makeItem("b", "courses presse", 10),
      makeItem("c", "atelier velo", 20),
      makeItem("d", "kiosque presse", 10),
      makeItem("e", "courses hebdo", 15),
    ];

    // "courses" is in three labels, "velo" and "presse" in two: the rarer token
    // says more about the spending, so a and b join velo and presse rather than
    // each other. "courses" is then left with e alone, which is not a pattern.
    expect(named(items)).toEqual([
      ["velo", 2],
      ["presse", 2],
    ]);
    expect(otherGroup(items)?.ids).toEqual(["e"]);
  });

  it("merges a key that is the prefix of another (singular / plural)", () => {
    const items = [
      makeItem("a", "velo pieces", 10),
      makeItem("b", "velo chaine", 10),
      makeItem("c", "velos entretien", 40),
      makeItem("d", "velos revision", 40),
    ];

    // The heavier spelling keeps the key.
    expect(named(items)).toEqual([["velos", 4]]);
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
});

describe("foldLabelPatternGroups", () => {
  // Seven patterns of two spendings each, on decreasing amounts. The two weekday
  // words are in every label, so they are never discriminant enough to be keys.
  const patternWords = ["velo", "presse", "cantine", "cinema", "essence", "pharmacie", "librairie"];
  const sevenPatterns = patternWords.flatMap((word, i) => [
    makeItem(`${word}-a`, `${word} lundi`, 70 - i * 10),
    makeItem(`${word}-b`, `${word} mardi`, 70 - i * 10),
  ]);

  const soloOther: LabelPatternGroup = {
    key: OTHER_GROUP_KEY,
    name: "",
    total: 3,
    count: 1,
    pct: 0,
    ids: ["solo"],
    isOther: true,
  };

  it("is handed the full ranking — the expanded view of the widget", () => {
    const groups = groupSpendingsByLabelPattern(sevenPatterns);

    expect(groups.map((group) => group.key)).toEqual(patternWords);
  });

  it("folds the tail past the fifth group into Other, kept last", () => {
    const folded = foldLabelPatternGroups(groupSpendingsByLabelPattern(sevenPatterns));

    expect(folded.filter((group) => !group.isOther)).toHaveLength(MAX_LABEL_PATTERN_GROUPS);
    expect(folded[folded.length - 1]).toMatchObject({
      key: FOLDED_OTHER_GROUP_KEY,
      isOther: true,
      count: 4,
      total: 60,
    });
    expect(folded.reduce((acc, group) => acc + group.pct, 0)).toBeCloseTo(100);
  });

  it("folds one group over the limit as readily as a long tail", () => {
    // The boundary the widget reads to decide whether to offer "Show all": six
    // named groups and no remainder still fold, even though the row count does
    // not move (five named + the catch-all row that took the sixth).
    const sixPatterns = sevenPatterns.filter((item) => !item.ID.startsWith("librairie"));
    const groups = groupSpendingsByLabelPattern(sixPatterns);
    const folded = foldLabelPatternGroups(groups);

    expect(groups.filter((group) => group.isOther)).toHaveLength(0);
    expect(folded).toHaveLength(groups.length);
    expect(folded[folded.length - 1]).toMatchObject({ key: FOLDED_OTHER_GROUP_KEY, isOther: true, count: 2 });
  });

  it("gives the folded catch-all a key of its own — it is not the same bucket", () => {
    const groups = [...groupSpendingsByLabelPattern(sevenPatterns), soloOther];
    const folded = foldLabelPatternGroups(groups);

    // Resolving a click on the collapsed row against the full ranking must find
    // nothing rather than land on the smaller bucket that kept OTHER_GROUP_KEY.
    expect(folded[folded.length - 1].key).toBe(FOLDED_OTHER_GROUP_KEY);
    expect(groups.some((group) => group.key === FOLDED_OTHER_GROUP_KEY)).toBe(false);
    expect(folded.some((group) => group.key === OTHER_GROUP_KEY)).toBe(false);
  });

  it("folds the tail into the existing Other rather than beside it", () => {
    const folded = foldLabelPatternGroups([...groupSpendingsByLabelPattern(sevenPatterns), soloOther]);

    expect(folded.filter((group) => group.isOther)).toHaveLength(1);
    expect(folded[folded.length - 1].count).toBe(5);
  });

  it("hands back a list shorter than the limit untouched", () => {
    const groups = groupSpendingsByLabelPattern([
      makeItem("a", "velo atelier"),
      makeItem("b", "velo chaine"),
      makeItem("c", "presse gare"),
      makeItem("d", "presse kiosque"),
      makeItem("e", "restaurant"),
    ]);

    // Same rows, not merely equal ones: with nothing folded away both views of
    // the widget render — and resolve a click against — one single list.
    expect(groups.at(-1)?.key).toBe(OTHER_GROUP_KEY);
    expect(foldLabelPatternGroups(groups)).toBe(groups);
  });
});
