import { ExceptionalsService } from "@contexts/budget-planning/application/exceptionals.service";
import { ExceptionalNotFound } from "@contexts/budget-planning/domain/budget-errors";
import type {
  ClosedRange,
  NewExceptional,
  OwnedRecord,
} from "@contexts/budget-planning/domain/interfaces/budgetPlanningTypes";
import { ExceptionalRepository } from "@contexts/budget-planning/domain/ports/exceptional.repository";

class FakeExceptionals extends ExceptionalRepository {
  readonly asked: (ClosedRange | null)[] = [];
  readonly added: NewExceptional[] = [];
  async list(_ownerId: string, year: ClosedRange | null) {
    this.asked.push(year);
    return [];
  }
  async dates(): Promise<Date[]> {
    return [new Date(2024, 2, 1), new Date(2026, 0, 5), new Date(2024, 7, 9)];
  }
  async add(exceptional: NewExceptional): Promise<string> {
    this.added.push(exceptional);
    return "e1";
  }
  async edit(exceptional: OwnedRecord): Promise<boolean> {
    return exceptional.ownerId === "user-1";
  }
  async remove(exceptional: OwnedRecord): Promise<boolean> {
    return exceptional.ownerId === "user-1";
  }
}

describe("ExceptionalsService", () => {
  it("narrows to the requested year, and ignores a missing or unparsable one", async () => {
    const repository = new FakeExceptionals();
    const service = new ExceptionalsService(repository);

    await service.list("user-1", "2025");
    await service.list("user-1");
    await service.list("user-1", "soon");

    expect(repository.asked).toEqual([{ gte: new Date("2025-01-01"), lte: new Date("2025-12-31") }, null, null]);
  });

  it("lists each year once, newest first", async () => {
    await expect(new ExceptionalsService(new FakeExceptionals()).years("user-1")).resolves.toEqual([2026, 2024]);
  });

  it("creates with nullable fields set to null", async () => {
    const repository = new FakeExceptionals();

    const created = await new ExceptionalsService(repository).add(
      { date: "2026-01-05", label: "Roof", amount: 900 },
      "user-1",
    );

    expect(created).toEqual({ message: "new exceptional added", ID: "e1" });
    expect(repository.added[0]).toMatchObject({
      description: null,
      currency: null,
      categoryName: null,
      categoryColor: null,
    });
  });

  it("scopes edits and deletes to the owner and 404s on someone else's row", async () => {
    const service = new ExceptionalsService(new FakeExceptionals());
    const input = { date: "2026-01-05", label: "Roof", amount: 900 };
    await expect(service.edit({ id: "e1", ownerId: "user-2" }, input)).rejects.toBeInstanceOf(ExceptionalNotFound);
    await expect(service.remove({ id: "e1", ownerId: "user-2" })).rejects.toBeInstanceOf(ExceptionalNotFound);
  });
});
