import { CreateSpendingGroup } from "@contexts/spending/application/create-spending-group.use-case";
import { DeleteSpending } from "@contexts/spending/application/delete-spending.use-case";
import { DeleteSpendingGroup } from "@contexts/spending/application/delete-spending-group.use-case";
import { EditSpendingGroup } from "@contexts/spending/application/edit-spending-group.use-case";
import { MergeSpendingsIntoGroup } from "@contexts/spending/application/merge-spendings-into-group.use-case";
import { RecordSpending } from "@contexts/spending/application/record-spending.use-case";
import { ReviseSpending } from "@contexts/spending/application/revise-spending.use-case";
import { Spending } from "@contexts/spending/domain/spending";
import {
  CategoryNotUsable,
  DuplicateSpending,
  GroupNotFound,
  LineNotInGroup,
  SpendingNotFound,
} from "@contexts/spending/domain/spending-errors";
import { SPENDING_EVENT } from "@contexts/spending/domain/spending-events";
import { SpendingGroup } from "@contexts/spending/domain/spending-group";
import { FakeCategoryLookup } from "@contexts/spending/infrastructure/testing/fake-category-lookup";
import { FakeEventPublisher } from "@contexts/spending/infrastructure/testing/fake-event-publisher";
import { InMemorySpendingRepository } from "@contexts/spending/infrastructure/testing/in-memory-spending.repository";
import { InMemorySpendingGroupRepository } from "@contexts/spending/infrastructure/testing/in-memory-spending-group.repository";
import { CalendarDay } from "@shared-kernel/calendar-day";
import { Money } from "@shared-kernel/money";

/** The use cases against in-memory adapters (PFA-273): orchestration only, no database. */
const day = CalendarDay.of("2026-11-16");

const storedSpending = () =>
  Spending.restore({
    id: "s1",
    ownerId: "u1",
    date: day,
    label: "Lunch",
    amount: Money.of(12, "EUR"),
    categoryId: "food",
    receipt: "r.jpg",
    groupId: null,
  });

const storedGroup = () =>
  SpendingGroup.restore({
    id: "g1",
    ownerId: "u1",
    date: day,
    label: "Market",
    lines: [{ id: "a", amount: Money.of(4, "EUR"), categoryId: null, detail: null, receipt: "r.jpg", isNew: false }],
  });

describe("RecordSpending", () => {
  it("returns the new ID so the front can chain the receipt upload (PFA-5)", async () => {
    const spendings = new InMemorySpendingRepository();
    const record = new RecordSpending(spendings, new FakeCategoryLookup());

    const result = await record.execute({
      ownerId: "u1",
      date: "2026-08-21",
      label: "lunch",
      amount: 12.5,
      currency: "EUR",
    });

    expect(spendings.added).toHaveLength(1);
    expect(result).toEqual({ ID: spendings.added[0].id });
    expect(spendings.added[0].snapshot()).toMatchObject({ ownerId: "u1", label: "lunch", categoryId: null });
  });

  it("refuses a category the user cannot use", async () => {
    const record = new RecordSpending(new InMemorySpendingRepository(), new FakeCategoryLookup());

    const recording = record.execute({
      ownerId: "u1",
      date: "2026-08-21",
      label: "lunch",
      amount: 1,
      currency: "EUR",
      category: { ID: "someone-else" },
    });

    await expect(recording).rejects.toBeInstanceOf(CategoryNotUsable);
  });
});

describe("ReviseSpending", () => {
  it("answers not found for a spending the user does not own", async () => {
    const revise = new ReviseSpending(new InMemorySpendingRepository(), new FakeCategoryLookup());

    const revising = revise.execute({ ownerId: "u2", spendingId: "s1", label: "x", amount: 1 });

    await expect(revising).rejects.toBeInstanceOf(SpendingNotFound);
  });

  it("keeps the current category without checking it, and saves the new label and amount", async () => {
    const spendings = new InMemorySpendingRepository([storedSpending()]);
    const revise = new ReviseSpending(spendings, new FakeCategoryLookup());

    await revise.execute({ ownerId: "u1", spendingId: "s1", label: "Dinner", amount: 20, category: { ID: "food" } });

    expect(spendings.saved[0].snapshot()).toMatchObject({ label: "Dinner", categoryId: "food" });
    expect(spendings.saved[0].snapshot().amount.toDecimalString()).toBe("20.00");
  });
});

describe("DeleteSpending", () => {
  it("tells the other contexts its receipt may be orphaned, after removing it", async () => {
    const spendings = new InMemorySpendingRepository([storedSpending()]);
    const receipts = new FakeEventPublisher();

    await new DeleteSpending(spendings, receipts).execute({ ownerId: "u1", id: "s1" });

    expect(spendings.removed).toHaveLength(1);
    expect(receipts.published).toEqual([
      { name: SPENDING_EVENT.spendingDeleted, ownerId: "u1", subjectId: "s1", receipts: ["r.jpg"] },
    ]);
  });
});

describe("CreateSpendingGroup", () => {
  it("creates a category typed on two lines once", async () => {
    const categories = new FakeCategoryLookup();
    const groups = new InMemorySpendingGroupRepository();
    const typed = { ID: null, name: "Books", color: "#fff" };

    const result = await new CreateSpendingGroup(groups, categories).execute({
      ownerId: "u1",
      date: "2026-11-16",
      label: "Shop",
      currency: "EUR",
      lines: [
        { amount: 1, category: typed },
        { amount: 2, category: typed },
      ],
    });

    expect(categories.created).toEqual(["new:Books"]);
    expect(result.spendingIDs).toHaveLength(2);
    expect(groups.saved[0].lines().map((line) => line.categoryId)).toEqual(["new:Books", "new:Books"]);
  });
});

describe("EditSpendingGroup", () => {
  it("answers not found for a group the user does not own", async () => {
    const edit = new EditSpendingGroup(
      new InMemorySpendingGroupRepository([storedGroup()]),
      new FakeCategoryLookup(),
      new FakeEventPublisher(),
    );

    await expect(edit.execute({ ownerId: "u2", groupId: "g1", label: "x", lines: [] })).rejects.toBeInstanceOf(
      GroupNotFound,
    );
  });

  it("refuses a foreign line before creating any typed category", async () => {
    const categories = new FakeCategoryLookup();
    const edit = new EditSpendingGroup(
      new InMemorySpendingGroupRepository([storedGroup()]),
      categories,
      new FakeEventPublisher(),
    );

    const editing = edit.execute({
      ownerId: "u1",
      groupId: "g1",
      label: "Market",
      lines: [{ ID: "x", amount: 1, category: { ID: null, name: "Books", color: "#fff" } }],
    });

    await expect(editing).rejects.toBeInstanceOf(LineNotInGroup);
    expect(categories.created).toEqual([]);
  });
});

describe("MergeSpendingsIntoGroup", () => {
  const spendingsOfMonday = [
    {
      ownerId: "u1",
      id: "a",
      date: day,
      amount: Money.of(1, "EUR"),
      categoryId: null,
      receipt: "a.jpg",
      groupId: null,
    },
    {
      ownerId: "u1",
      id: "b",
      date: day,
      amount: Money.of(2, "EUR"),
      categoryId: null,
      receipt: "b.jpg",
      groupId: null,
    },
  ];

  it("keeps the first receipt in the order sent, not the order found", async () => {
    const groups = new InMemorySpendingGroupRepository([], spendingsOfMonday);
    const receipts = new FakeEventPublisher();

    const result = await new MergeSpendingsIntoGroup(groups, receipts).execute({
      ownerId: "u1",
      label: "Store",
      lines: [{ spendingID: "b" }, { spendingID: "a" }],
    });

    expect(result.invoicefile).toBe("b.jpg");
    expect(receipts.published).toEqual([
      expect.objectContaining({ name: SPENDING_EVENT.spendingsMerged, receipts: ["b.jpg", "a.jpg"] }),
    ]);
  });

  it("refuses a spending sent twice", async () => {
    const merge = new MergeSpendingsIntoGroup(new InMemorySpendingGroupRepository(), new FakeEventPublisher());

    const merging = merge.execute({ ownerId: "u1", label: "x", lines: [{ spendingID: "a" }, { spendingID: "a" }] });

    await expect(merging).rejects.toBeInstanceOf(DuplicateSpending);
  });

  it("refuses a spending the user does not own", async () => {
    const groups = new InMemorySpendingGroupRepository([], spendingsOfMonday);
    const merge = new MergeSpendingsIntoGroup(groups, new FakeEventPublisher());

    const merging = merge.execute({ ownerId: "u2", label: "x", lines: [{ spendingID: "a" }, { spendingID: "b" }] });

    await expect(merging).rejects.toBeInstanceOf(SpendingNotFound);
  });
});

describe("DeleteSpendingGroup", () => {
  it("removes the group and tells which receipts its lines let go", async () => {
    const groups = new InMemorySpendingGroupRepository([storedGroup()]);
    const receipts = new FakeEventPublisher();

    await new DeleteSpendingGroup(groups, receipts).execute({ ownerId: "u1", id: "g1" });

    expect(groups.removed).toHaveLength(1);
    expect(receipts.published).toEqual([
      { name: SPENDING_EVENT.groupDeleted, ownerId: "u1", subjectId: "g1", receipts: ["r.jpg"] },
    ]);
  });
});
