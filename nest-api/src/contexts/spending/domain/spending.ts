import type { NewSpending, SpendingRevision, SpendingState } from "@contexts/spending/domain/interfaces/spendingTypes";
import { SPENDING_EVENT } from "@contexts/spending/domain/spending-events";
import { AggregateRoot } from "@shared-kernel/aggregate-root";
import { Money } from "@shared-kernel/money";

/**
 * A one-off purchase (PFA-273). Its receipt is attached and replaced by the receipt context; its
 * group, if any, is changed through the group. What a spending changes on its own is what the edit
 * modal shows: label, amount, category.
 */
export class Spending extends AggregateRoot {
  private constructor(private readonly state: SpendingState) {
    super();
  }

  static record(input: NewSpending): Spending {
    return new Spending({ ...input, receipt: null, groupId: null });
  }

  static restore(state: SpendingState): Spending {
    return new Spending(state);
  }

  get id(): string {
    return this.state.id;
  }

  get categoryId(): string | null {
    return this.state.categoryId;
  }

  get receipt(): string | null {
    return this.state.receipt;
  }

  get groupId(): string | null {
    return this.state.groupId;
  }

  revise(revision: SpendingRevision): void {
    this.state.label = revision.label;
    this.state.amount = Money.of(revision.amount, this.state.amount.currency);
    this.state.categoryId = revision.categoryId;
  }

  /** The spending goes; its receipt may now be held by nobody. */
  discard(): void {
    this.record({
      name: SPENDING_EVENT.spendingDeleted,
      ownerId: this.state.ownerId,
      subjectId: this.state.id,
      receipts: [this.state.receipt],
    });
  }

  snapshot(): Readonly<SpendingState> {
    return { ...this.state };
  }
}
