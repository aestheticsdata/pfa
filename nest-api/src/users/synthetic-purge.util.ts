import { rm } from "node:fs/promises";
import { join } from "node:path";
import type { PrismaClient } from "../../generated/prisma/client";
import { isSyntheticEmail, SYNTHETIC_ACCOUNTS_WHERE } from "./synthetic-email.util";

export interface SyntheticAccountRef {
  ID: string;
  email: string;
}

export interface PurgeCounts {
  users: number;
  spendings: number;
  groups: number;
  recurrings: number;
  dashboards: number;
  exceptionals: number;
  categories: number;
}

/**
 * Deletes synthetic accounts and everything they own, in one transaction, then their invoices
 * folders. Shared by `synthetic:purge` (every bot at once) and the bot back-office's per-account
 * purge (PFA-127), so the two can never disagree on what "everything they own" means.
 *
 * Refuses outright if any account given is not synthetic by its email — the SQL filter below
 * checks the flag as well, so a real account is protected twice.
 */
export async function purgeSyntheticAccounts(
  prisma: PrismaClient,
  accounts: SyntheticAccountRef[],
  invoicesPath: string,
): Promise<PurgeCounts> {
  const stray = accounts.filter((account) => !isSyntheticEmail(account.email));
  if (stray.length > 0) {
    throw new Error(`Refusing to purge: ${stray.length} account(s) outside the synthetic domain.`);
  }
  const ids = accounts.map((account) => account.ID);
  if (ids.length === 0) {
    return { users: 0, spendings: 0, groups: 0, recurrings: 0, dashboards: 0, exceptionals: 0, categories: 0 };
  }

  const owned = { userID: { in: ids } };
  const [spendings, groups, recurrings, dashboards, exceptionals, categories, users] = await prisma.$transaction([
    // Spendings first: they reference groups and categories.
    prisma.spendings.deleteMany({ where: owned }),
    prisma.spendingGroups.deleteMany({ where: owned }),
    prisma.recurrings.deleteMany({ where: owned }),
    prisma.dashboards.deleteMany({ where: owned }),
    prisma.exceptionals.deleteMany({ where: owned }),
    prisma.categories.deleteMany({ where: owned }),
    prisma.users.deleteMany({ where: { ...SYNTHETIC_ACCOUNTS_WHERE, ID: { in: ids } } }),
  ]);
  for (const id of ids) {
    await rm(join(invoicesPath, id), { recursive: true, force: true });
  }

  return {
    users: users.count,
    spendings: spendings.count,
    groups: groups.count,
    recurrings: recurrings.count,
    dashboards: dashboards.count,
    exceptionals: exceptionals.count,
    categories: categories.count,
  };
}
