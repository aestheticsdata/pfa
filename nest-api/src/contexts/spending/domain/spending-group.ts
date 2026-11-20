import { composeGroupLineLabel } from "@contexts/spending/domain/group-label";
import type {
  GroupEdit,
  GroupLineState,
  GroupMerge,
  NewGroupLine,
  NewSpendingGroup,
  SpendingGroupState,
} from "@contexts/spending/domain/interfaces/spendingTypes";
import { GroupSpansSeveralDays, LineNotInGroup } from "@contexts/spending/domain/spending-errors";
import { AggregateRoot } from "@shared-kernel/aggregate-root";
import { Money } from "@shared-kernel/money";

const trimmedDetail = (detail?: string | null) => detail?.trim() || null;

/**
 * Several spendings bought on one receipt (PFA-189), each line in its own category. The group is
 * the only way its lines change together, so it is where the rules live:
 * - every line is on the group's day;
 * - a line added later joins the group's receipt and currency;
 * - each line's stored label is "<group> — <detail>", recomposed whenever the group is renamed;
 * - a merge keeps the first receipt found and lets the others go.
 */
export class SpendingGroup extends AggregateRoot {
  private removed: GroupLineState[] = [];
  private absorbed: string[] = [];
  private released: (string | null)[] = [];

  private constructor(
    private readonly state: SpendingGroupState,
    readonly isNew: boolean,
  ) {
    super();
  }

  static create(input: NewSpendingGroup): SpendingGroup {
    const lines = input.lines.map((line) => SpendingGroup.newLine(line, { receipt: null, currency: input.currency }));
    return new SpendingGroup(
      { id: input.id, ownerId: input.ownerId, date: input.date, label: input.label.trim(), lines },
      true,
    );
  }

  static restore(state: SpendingGroupState): SpendingGroup {
    return new SpendingGroup(state, false);
  }

  /** Existing spendings of one day — lines of other groups included — become the lines of a new group. */
  static merge(input: GroupMerge): SpendingGroup {
    const [first] = input.candidates;
    if (input.candidates.some((candidate) => !candidate.date.equals(first.date))) {
      throw new GroupSpansSeveralDays();
    }
    const receipt = input.candidates.find((candidate) => candidate.receipt)?.receipt ?? null;
    const lines = input.candidates.map((candidate) => ({
      id: candidate.id,
      amount: candidate.amount,
      categoryId: candidate.categoryId,
      detail: trimmedDetail(candidate.detail),
      receipt,
      isNew: false,
    }));
    // Each line keeps its own currency: a merge never had to agree on one.
    const group = new SpendingGroup(
      { id: input.id, ownerId: input.ownerId, date: first.date, label: input.label.trim(), lines },
      true,
    );
    // Groups the lines came from are dropped once empty; receipts nobody holds any more go.
    group.absorbed = [...new Set(input.candidates.flatMap((candidate) => candidate.groupId ?? []))];
    group.released = input.candidates.map((candidate) => candidate.receipt);
    return group;
  }

  private static newLine(line: NewGroupLine, joined: { receipt: string | null; currency: string }): GroupLineState {
    return {
      id: line.id,
      amount: Money.of(line.amount, joined.currency),
      categoryId: line.categoryId,
      detail: trimmedDetail(line.detail),
      receipt: joined.receipt,
      isNew: true,
    };
  }

  /** The group's whole new state: lines left out are removed, lines without a stored row are added. */
  /** Refuses an edit naming a line of another group, before anything is resolved or written. */
  assertHolds(lineIds: string[]): void {
    const held = new Set(this.state.lines.map((line) => line.id));
    if (lineIds.some((id) => !held.has(id))) throw new LineNotInGroup();
  }

  edit(edit: GroupEdit): void {
    this.assertHolds(edit.lines.flatMap((line) => (line.isNew ? [] : [line.id])));
    const current = new Map(this.state.lines.map((line) => [line.id, line]));
    // A line added while editing joins the group's receipt and currency.
    const joined = {
      receipt: this.state.lines.find((line) => line.receipt)?.receipt ?? null,
      currency: this.state.lines[0]?.amount.currency ?? "",
    };
    const kept = new Set(edit.lines.flatMap((line) => (line.isNew ? [] : [line.id])));
    const removed = this.state.lines.filter((line) => !kept.has(line.id));

    this.state.label = edit.label.trim();
    this.state.lines = edit.lines.map((line) => {
      if (line.isNew) return SpendingGroup.newLine(line, joined);
      const existing = current.get(line.id) as GroupLineState;
      return {
        ...existing,
        amount: Money.of(line.amount, existing.amount.currency),
        categoryId: line.categoryId,
        detail: trimmedDetail(line.detail),
      };
    });
    this.removed.push(...removed);
    this.released.push(...removed.map((line) => line.receipt));
  }

  /** The group goes, its lines stay as separate spendings sharing the receipt. */
  ungroup(): string[] {
    return this.state.lines.map((line) => line.id);
  }

  /** The group goes with all its lines. */
  discard(): void {
    this.released.push(...this.state.lines.map((line) => line.receipt));
  }

  get id(): string {
    return this.state.id;
  }

  get ownerId(): string {
    return this.state.ownerId;
  }

  get date() {
    return this.state.date;
  }

  get label(): string {
    return this.state.label;
  }

  /** The receipt the group's lines share, if any. */
  get receipt(): string | null {
    return this.state.lines.find((line) => line.receipt)?.receipt ?? null;
  }

  lines(): readonly GroupLineState[] {
    return this.state.lines;
  }

  /** What a line's `label` column holds: search, stats and suggestions read it. */
  storedLabelOf(line: GroupLineState): string {
    return composeGroupLineLabel(this.state.label, line.detail);
  }

  removedLineIds(): string[] {
    return this.removed.map((line) => line.id);
  }

  absorbedGroupIds(): string[] {
    return this.absorbed;
  }

  /** Receipts the change may have orphaned; the receipt store keeps the ones still held. */
  releasedReceipts(): (string | null)[] {
    return this.released;
  }
}
