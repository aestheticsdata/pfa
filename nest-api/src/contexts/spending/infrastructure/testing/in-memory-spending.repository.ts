import { SpendingRepository } from "@contexts/spending/domain/ports/spending.repository";
import type { Spending } from "@contexts/spending/domain/spending";

/** A driven adapter for unit tests (PFA-273). */
export class InMemorySpendingRepository extends SpendingRepository {
  readonly added: Spending[] = [];
  readonly saved: Spending[] = [];
  readonly removed: Spending[] = [];

  constructor(private readonly spendings: Spending[] = []) {
    super();
  }

  async byId(id: string, ownerId: string): Promise<Spending | null> {
    return this.spendings.find((s) => s.id === id && s.snapshot().ownerId === ownerId) ?? null;
  }

  async add(spending: Spending): Promise<void> {
    this.added.push(spending);
  }

  async save(spending: Spending): Promise<void> {
    this.saved.push(spending);
  }

  async remove(spending: Spending): Promise<void> {
    this.removed.push(spending);
  }
}
