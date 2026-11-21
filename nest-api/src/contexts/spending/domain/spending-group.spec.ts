import type { GroupCandidate } from "@contexts/spending/domain/interfaces/spendingTypes";
import { GroupSpansSeveralDays, LineNotInGroup } from "@contexts/spending/domain/spending-errors";
import { SPENDING_EVENT } from "@contexts/spending/domain/spending-events";
import { SpendingGroup } from "@contexts/spending/domain/spending-group";
import { CalendarDay } from "@shared-kernel/calendar-day";
import { Money } from "@shared-kernel/money";

const monday = CalendarDay.of("2026-11-16");
const eur = (amount: number) => Money.of(amount, "EUR");

const candidate = (id: string, overrides: Partial<GroupCandidate> = {}): GroupCandidate => ({
  id,
  date: monday,
  amount: eur(10),
  categoryId: null,
  receipt: null,
  groupId: null,
  ...overrides,
});

const storedGroup = () =>
  SpendingGroup.restore({
    id: "g1",
    ownerId: "u1",
    date: monday,
    label: "Market",
    lines: [
      { id: "a", amount: eur(4), categoryId: "food", detail: "Fruit", receipt: "r1.jpg", isNew: false },
      { id: "b", amount: eur(6), categoryId: "home", detail: null, receipt: "r1.jpg", isNew: false },
    ],
  });

describe("SpendingGroup", () => {
  describe("create", () => {
    it("composes each line's stored label from the group's name and the line's detail", () => {
      const group = SpendingGroup.create({
        id: "g1",
        ownerId: "u1",
        date: monday,
        label: "  Market ",
        currency: "EUR",
        lines: [
          { id: "a", amount: 4, categoryId: null, detail: " Fruit " },
          { id: "b", amount: 6, categoryId: null },
        ],
      });

      const [fruit, plain] = group.lines();
      expect(group.label).toBe("Market");
      expect(group.storedLabelOf(fruit)).toBe("Market — Fruit");
      expect(group.storedLabelOf(plain)).toBe("Market");
      expect(fruit.detail).toBe("Fruit");
      expect(group.isNew).toBe(true);
    });
  });

  describe("merge", () => {
    it("keeps the first receipt in the order sent for every line, and releases them all", () => {
      const group = SpendingGroup.merge({
        id: "g2",
        ownerId: "u1",
        label: "Store",
        candidates: [candidate("a", { receipt: "a.jpg" }), candidate("b", { receipt: "b.jpg", detail: "Soap" })],
      });

      expect(group.receipt).toBe("a.jpg");
      expect(group.lines().map((line) => line.receipt)).toEqual(["a.jpg", "a.jpg"]);
      expect(group.storedLabelOf(group.lines()[1])).toBe("Store — Soap");
      // The receipt context keeps any file still held: a.jpg stays, b.jpg goes if nothing else has it.
      expect(group.pullEvents()).toEqual([
        { name: SPENDING_EVENT.spendingsMerged, ownerId: "u1", subjectId: "g2", receipts: ["a.jpg", "b.jpg"] },
      ]);
    });

    it("refuses spendings of different days", () => {
      const merge = () =>
        SpendingGroup.merge({
          id: "g2",
          ownerId: "u1",
          label: "Store",
          candidates: [candidate("a"), candidate("b", { date: CalendarDay.of("2026-11-17") })],
        });

      expect(merge).toThrow(GroupSpansSeveralDays);
    });

    it("drops the groups it took lines from, once they are empty", () => {
      const group = SpendingGroup.merge({
        id: "g2",
        ownerId: "u1",
        label: "Store",
        candidates: [candidate("a", { groupId: "old" }), candidate("b", { groupId: "old" }), candidate("c")],
      });

      expect(group.absorbedGroupIds()).toEqual(["old"]);
    });

    it("lets each line keep its own currency", () => {
      const group = SpendingGroup.merge({
        id: "g2",
        ownerId: "u1",
        label: "Trip",
        candidates: [candidate("a"), candidate("b", { amount: Money.of(3, "USD") })],
      });

      expect(group.lines().map((line) => line.amount.currency)).toEqual(["EUR", "USD"]);
    });
  });

  describe("edit", () => {
    it("adds a line on the group's receipt and currency, and removes the lines left out", () => {
      const group = storedGroup();

      group.edit({
        label: "Farmers market",
        lines: [
          { id: "a", isNew: false, amount: 5, categoryId: "food", detail: "Fruit" },
          { id: "c", isNew: true, amount: 2.5, categoryId: null, detail: "Bread" },
        ],
      });

      const [kept, added] = group.lines();
      expect(group.storedLabelOf(kept)).toBe("Farmers market — Fruit");
      expect(kept.amount.toDecimalString()).toBe("5.00");
      expect(added).toMatchObject({ id: "c", receipt: "r1.jpg", isNew: true });
      expect(added.amount.currency).toBe("EUR");
      expect(group.removedLineIds()).toEqual(["b"]);
      expect(group.pullEvents()).toEqual([
        { name: SPENDING_EVENT.groupLinesRemoved, ownerId: "u1", subjectId: "g1", receipts: ["r1.jpg"] },
      ]);
    });

    it("refuses a line of another group", () => {
      const group = storedGroup();

      const edit = () =>
        group.edit({ label: "Market", lines: [{ id: "x", isNew: false, amount: 1, categoryId: null }] });

      expect(edit).toThrow(LineNotInGroup);
    });
  });

  it("records every line's receipt when discarded", () => {
    const group = storedGroup();
    group.discard();
    expect(group.pullEvents()).toEqual([
      { name: SPENDING_EVENT.groupDeleted, ownerId: "u1", subjectId: "g1", receipts: ["r1.jpg", "r1.jpg"] },
    ]);
  });

  it("records nothing for an edit that keeps every line", () => {
    const group = storedGroup();
    group.edit({
      label: "Market",
      lines: [
        { id: "a", isNew: false, amount: 4, categoryId: "food" },
        { id: "b", isNew: false, amount: 6, categoryId: "home" },
      ],
    });
    expect(group.pullEvents()).toEqual([]);
  });

  it("hands back its lines when ungrouped", () => {
    expect(storedGroup().ungroup()).toEqual(["a", "b"]);
  });
});
