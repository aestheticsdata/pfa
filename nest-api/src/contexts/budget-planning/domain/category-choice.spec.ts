import { CATEGORY_CHOICE, chosenCategory, revisedCategory } from "@contexts/budget-planning/domain/category-choice";

describe("chosenCategory (new spending, group line)", () => {
  it("asks for an existing category to be checked", () => {
    expect(chosenCategory({ ID: "c1" })).toEqual({ kind: CATEGORY_CHOICE.existing, categoryId: "c1" });
  });

  it("types a category only with an explicit null ID, a name and a colour", () => {
    expect(chosenCategory({ ID: null, name: "Books", color: "#fff" })).toEqual({
      kind: CATEGORY_CHOICE.typed,
      category: { name: "Books", color: "#fff" },
    });
    expect(chosenCategory({ name: "Books", color: "#fff" })).toEqual({ kind: CATEGORY_CHOICE.none });
  });

  it("is none without a pick", () => {
    expect(chosenCategory(undefined)).toEqual({ kind: CATEGORY_CHOICE.none });
  });
});

describe("revisedCategory (edited spending)", () => {
  it("checks nothing when the category stays", () => {
    expect(revisedCategory({ ID: "c1" }, "c1")).toEqual({ kind: CATEGORY_CHOICE.unchanged, categoryId: "c1" });
  });

  it("checks a category it moves to", () => {
    expect(revisedCategory({ ID: "c2" }, "c1")).toEqual({ kind: CATEGORY_CHOICE.existing, categoryId: "c2" });
  });

  it("types a category from a name and a colour, ID or not", () => {
    expect(revisedCategory({ name: "Books", color: "#fff" }, "c1").kind).toBe(CATEGORY_CHOICE.typed);
  });

  it("clears the category otherwise", () => {
    expect(revisedCategory({ ID: null, name: "Books" }, "c1")).toEqual({ kind: CATEGORY_CHOICE.none });
  });
});
