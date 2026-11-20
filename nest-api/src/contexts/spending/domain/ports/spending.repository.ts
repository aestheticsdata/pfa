import type { Spending } from "@contexts/spending/domain/spending";

/**
 * Where spendings are kept (PFA-273): a driven port. An abstract class rather than an interface so
 * it is also the Nest injection token — an interface is gone at runtime. Every read is scoped to
 * its owner by signature.
 */
export abstract class SpendingRepository {
  abstract byId(id: string, ownerId: string): Promise<Spending | null>;
  abstract add(spending: Spending): Promise<void>;
  abstract save(spending: Spending): Promise<void>;
  /** Also drops its group when it was the group's last line. */
  abstract remove(spending: Spending): Promise<void>;
}
