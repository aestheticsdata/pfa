import { CategoriesService } from "@contexts/budget-planning/application/categories.service";
import { RecurringsService } from "@contexts/budget-planning/application/recurrings.service";
import { CategoryNotUsable, RecurringNotFound } from "@contexts/budget-planning/domain/budget-errors";
import type {
  CategoryItem,
  MonthSpan,
  OwnedRecord,
  RecurringCharge,
  TypedCategory,
} from "@contexts/budget-planning/domain/interfaces/budgetPlanningTypes";
import { CategoryRepository } from "@contexts/budget-planning/domain/ports/category.repository";
import { RecurringRepository } from "@contexts/budget-planning/domain/ports/recurring.repository";
import { RECURRING_ITEM_TYPE } from "@contexts/budget-planning/domain/recurring-charges";

/** Categories: "c-own" is the user's, "c-global" everyone's; a typed one is created once. */
class FakeCategories extends CategoryRepository {
  readonly created: string[] = [];
  async list(): Promise<CategoryItem[]> {
    return [];
  }
  async isUsable(category: OwnedRecord): Promise<boolean> {
    return ["c-own", "c-global", ...this.created].includes(category.id);
  }
  async ownedBy(): Promise<boolean> {
    return true;
  }
  async findByName(name: string): Promise<string | null> {
    return this.created.find((id) => id === `new:${name}`) ?? null;
  }
  async create(category: TypedCategory): Promise<string> {
    this.created.push(`new:${category.name}`);
    return `new:${category.name}`;
  }
  async edit(): Promise<boolean> {
    return true;
  }
  async removeDetaching(): Promise<void> {}
}

class FakeRecurrings extends RecurringRepository {
  readonly added: (RecurringCharge & MonthSpan)[] = [];
  constructor(private readonly previous: RecurringCharge[] = []) {
    super();
  }
  async month() {
    return [];
  }
  async chargesOf(): Promise<RecurringCharge[]> {
    return this.previous;
  }
  async total(): Promise<number> {
    return 1250;
  }
  async add(charges: (RecurringCharge & MonthSpan)[]): Promise<void> {
    this.added.push(...charges);
  }
  async edit(recurring: OwnedRecord): Promise<boolean> {
    return recurring.ownerId === "user-1";
  }
  async remove(recurring: OwnedRecord): Promise<boolean> {
    return recurring.ownerId === "user-1";
  }
}

describe("RecurringsService", () => {
  const makeService = (previous: RecurringCharge[] = []) => {
    const categories = new FakeCategories();
    const recurrings = new FakeRecurrings(previous);
    return { service: new RecurringsService(recurrings, new CategoriesService(categories)), categories, recurrings };
  };

  it("sums what was drawn, and draws nothing for a bad month without asking", async () => {
    const { service } = makeService();
    await expect(service.drawn("2026", "6", "user-1")).resolves.toEqual({ drawn: 1250 });
    await expect(service.drawn("2026", "12", "user-1")).resolves.toEqual({ drawn: 0 });
  });

  it("creates a recurring on a new category typed by name", async () => {
    const { service, categories, recurrings } = makeService();

    await service.add({
      ownerId: "user-1",
      start: "2026-11-01",
      end: "2026-11-30",
      label: "Gym",
      amount: 30,
      category: { ID: null, name: "Sport", color: "#0a0" },
    });

    expect(categories.created).toEqual(["new:Sport"]);
    expect(recurrings.added[0]).toMatchObject({
      label: "Gym",
      categoryId: "new:Sport",
      itemType: RECURRING_ITEM_TYPE,
      currency: null,
    });
  });

  it("rejects an update pointing at a category the user cannot see", async () => {
    const editing = makeService().service.edit(
      { id: "r1", ownerId: "user-1" },
      { label: "x", amount: 1, category: { ID: "c-other" } },
    );
    await expect(editing).rejects.toBeInstanceOf(CategoryNotUsable);
  });

  it("404s on someone else's row", async () => {
    const service = makeService().service;
    await expect(service.edit({ id: "r1", ownerId: "user-2" }, { label: "x", amount: 1 })).rejects.toBeInstanceOf(
      RecurringNotFound,
    );
    await expect(service.remove({ id: "r1", ownerId: "user-2" })).rejects.toBeInstanceOf(RecurringNotFound);
  });

  it("carries the category forward when copying the previous month", async () => {
    const { service, recurrings } = makeService([
      { label: "Rent", amount: "800.00", itemType: RECURRING_ITEM_TYPE, currency: "EUR", categoryId: "c-own" },
    ]);

    await service.copy({ ownerId: "user-1", start: "2026-12-01", end: "2026-12-31", previousMonthStart: "2026-11-01" });

    expect(recurrings.added).toEqual([
      expect.objectContaining({
        label: "Rent",
        categoryId: "c-own",
        start: new Date("2026-12-01"),
        end: new Date("2026-12-31"),
      }),
    ]);
  });
});
