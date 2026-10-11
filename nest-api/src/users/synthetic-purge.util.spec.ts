import { purgeSyntheticAccounts } from "./synthetic-purge.util";

/**
 * Unit tests for purgeSyntheticAccounts (PFA-12): the one function able to
 * delete whole accounts, so its refusal to touch a real one is what matters.
 * Prisma is mocked; the invoices folder points at a path that does not exist,
 * which `rm({ force: true })` ignores.
 */
describe("purgeSyntheticAccounts", () => {
  const INVOICES = "/nonexistent/pfa-12-invoices";
  const OWNED_TABLES = [
    "spendings",
    "spendingGroups",
    "recurrings",
    "dashboards",
    "exceptionals",
    "categories",
    "users",
  ];

  const makePrisma = () => {
    const prisma: Record<string, unknown> = {
      $transaction: jest.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
    };
    OWNED_TABLES.forEach((table, index) => {
      prisma[table] = { deleteMany: jest.fn().mockResolvedValue({ count: index + 1 }) };
    });
    return prisma as never as Parameters<typeof purgeSyntheticAccounts>[0] & { $transaction: jest.Mock };
  };

  it("refuses the whole batch when one account is outside the synthetic domain", async () => {
    const prisma = makePrisma();
    const accounts = [
      { ID: "bot-1", email: "bot@synthetic.test" },
      { ID: "real-1", email: "someone@example.com" },
    ];

    await expect(purgeSyntheticAccounts(prisma, accounts, INVOICES)).rejects.toThrow(/Refusing to purge/);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("does nothing for an empty list", async () => {
    const prisma = makePrisma();
    expect(await purgeSyntheticAccounts(prisma, [], INVOICES)).toEqual({
      users: 0,
      spendings: 0,
      groups: 0,
      recurrings: 0,
      dashboards: 0,
      exceptionals: 0,
      categories: 0,
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("deletes what the accounts own and re-checks the synthetic flag on users", async () => {
    const prisma = makePrisma();
    const counts = await purgeSyntheticAccounts(prisma, [{ ID: "bot-1", email: "bot@synthetic.test" }], INVOICES);

    expect(counts).toEqual({
      spendings: 1,
      groups: 2,
      recurrings: 3,
      dashboards: 4,
      exceptionals: 5,
      categories: 6,
      users: 7,
    });
    expect(prisma.spendings.deleteMany).toHaveBeenCalledWith({ where: { userID: { in: ["bot-1"] } } });
    expect(prisma.users.deleteMany).toHaveBeenCalledWith({
      where: { isSynthetic: true, email: { endsWith: "@synthetic.test" }, ID: { in: ["bot-1"] } },
    });
  });
});
