import { rankFrequentCategories } from "@components/spendings/common/spendingModal/rankFrequentCategories";

import type { CategoryOption } from "@components/spendings/common/spendingModal/schema";
import type { CategoryStat } from "@src/schemas/categoryStats";

const cat = (id: string | null, name: string): CategoryOption => ({
  ID: id,
  userID: "u1",
  name,
  color: "#fff",
});

const stat = (categoryID: string, count: number, total: number): CategoryStat => ({
  categoryID,
  count,
  total,
});

describe("rankFrequentCategories", () => {
  it("ranks by real usage count (desc), not insertion order", () => {
    const cats = [cat("a", "alimentation"), cat("b", "transport"), cat("c", "loisirs")];
    const stats = [stat("a", 2, 40), stat("b", 9, 10), stat("c", 5, 30)];
    expect(rankFrequentCategories(cats, stats).map((c) => c.name)).toEqual(["transport", "loisirs", "alimentation"]);
  });

  it("breaks count ties by total amount spent (desc)", () => {
    const cats = [cat("a", "alpha"), cat("b", "beta")];
    const stats = [stat("a", 3, 20), stat("b", 3, 80)];
    expect(rankFrequentCategories(cats, stats).map((c) => c.name)).toEqual(["beta", "alpha"]);
  });

  it("breaks count+total ties by name (asc), deterministically", () => {
    const cats = [cat("b", "zebra"), cat("a", "apple")];
    const stats = [stat("a", 4, 50), stat("b", 4, 50)];
    expect(rankFrequentCategories(cats, stats).map((c) => c.name)).toEqual(["apple", "zebra"]);
  });

  it("excludes never-used categories — including unsaved ones (ID null)", () => {
    const cats = [cat(null, "brand-new"), cat("a", "used"), cat("b", "never-used")];
    const stats = [stat("a", 1, 5)];
    expect(rankFrequentCategories(cats, stats).map((c) => c.name)).toEqual(["used"]);
  });

  it("caps the result at the limit (default 6)", () => {
    const cats = Array.from({ length: 10 }, (_, i) => cat(`id-${i}`, `cat-${i}`));
    const stats = cats.map((c, i) => stat(c.ID as string, i + 1, i + 1));
    expect(rankFrequentCategories(cats, stats)).toHaveLength(6);
    expect(rankFrequentCategories(cats, stats, 3)).toHaveLength(3);
  });

  it("filters out categories with an empty name even when used", () => {
    const cats = [cat("a", ""), cat("b", "kept")];
    const stats = [stat("a", 5, 5), stat("b", 3, 3)];
    expect(rankFrequentCategories(cats, stats).map((c) => c.name)).toEqual(["kept"]);
  });

  it("returns nothing when there is no usage data yet", () => {
    const cats = [cat("b", "banana"), cat("a", "apple")];
    expect(rankFrequentCategories(cats, undefined)).toEqual([]);
    expect(rankFrequentCategories(cats, [])).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const cats = [cat("a", "alpha"), cat("b", "beta")];
    const snapshot = [...cats];
    rankFrequentCategories(cats, [stat("b", 5, 5)]);
    expect(cats).toEqual(snapshot);
  });
});
