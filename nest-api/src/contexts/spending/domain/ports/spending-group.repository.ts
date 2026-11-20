import type { GroupCandidate } from "@contexts/spending/domain/interfaces/spendingTypes";
import type { SpendingGroup } from "@contexts/spending/domain/spending-group";

/** Where groups and their lines are kept (PFA-273): one aggregate, saved whole. */
export abstract class SpendingGroupRepository {
  abstract byId(id: string, ownerId: string): Promise<SpendingGroup | null>;
  /** The owner's spendings among `ids`, in no particular order: the ones not found are missing. */
  abstract candidates(ids: string[], ownerId: string): Promise<GroupCandidate[]>;
  /** Writes the group, its lines, the lines it lost, and drops the groups it emptied. */
  abstract save(group: SpendingGroup): Promise<void>;
  /** The group and all its lines. */
  abstract remove(group: SpendingGroup): Promise<void>;
  /** The group only: its lines become separate spendings. */
  abstract dissolve(group: SpendingGroup): Promise<void>;
}
