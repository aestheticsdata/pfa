import type { GroupCandidate } from "@contexts/spending/domain/interfaces/spendingTypes";
import { SpendingGroupRepository } from "@contexts/spending/domain/ports/spending-group.repository";
import type { SpendingGroup } from "@contexts/spending/domain/spending-group";

/** A driven adapter for unit tests (PFA-273): the use cases run against it with no database. */
export class InMemorySpendingGroupRepository extends SpendingGroupRepository {
  readonly saved: SpendingGroup[] = [];
  readonly removed: SpendingGroup[] = [];
  readonly dissolved: SpendingGroup[] = [];

  constructor(
    private readonly groups: SpendingGroup[] = [],
    private readonly spendings: (GroupCandidate & { ownerId: string })[] = [],
  ) {
    super();
  }

  async byId(id: string, ownerId: string): Promise<SpendingGroup | null> {
    return this.groups.find((group) => group.id === id && group.ownerId === ownerId) ?? null;
  }

  async candidates(ids: string[], ownerId: string): Promise<GroupCandidate[]> {
    return this.spendings.filter((spending) => ids.includes(spending.id) && spending.ownerId === ownerId);
  }

  async save(group: SpendingGroup): Promise<void> {
    this.saved.push(group);
  }

  async remove(group: SpendingGroup): Promise<void> {
    this.removed.push(group);
  }

  async dissolve(group: SpendingGroup): Promise<void> {
    this.dissolved.push(group);
  }
}
