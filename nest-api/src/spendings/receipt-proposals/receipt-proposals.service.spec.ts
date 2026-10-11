import { ReceiptProposalsService } from "@spendings/receipt-proposals/receipt-proposals.service";

/** PFA-223 — saved receipts read in bulk, one at a time, kept as proposals. */
describe("ReceiptProposalsService", () => {
  const proposal = { lines: [], total: 4.2, store: null };

  const makeService = (propose: jest.Mock) => {
    const rows: { ID: string; spendingID: string; status: string; proposal?: unknown }[] = [];
    const prisma = {
      spendings: {
        findMany: jest.fn().mockResolvedValue([
          { ID: "own", invoicefile: "own-r.jpg" },
          { ID: "broken", invoicefile: "broken-r.jpg" },
          { ID: "shared", invoicefile: "shared-r.jpg" },
        ]),
        groupBy: jest.fn().mockResolvedValue([
          { invoicefile: "own-r.jpg", _count: { _all: 1 } },
          { invoicefile: "broken-r.jpg", _count: { _all: 1 } },
          { invoicefile: "shared-r.jpg", _count: { _all: 2 } },
        ]),
      },
      receiptProposals: {
        createMany: jest.fn(({ data }: { data: typeof rows }) => {
          rows.push(...data);
          return Promise.resolve({ count: data.length });
        }),
        groupBy: jest.fn(() =>
          Promise.resolve(
            [...new Set(rows.map((r) => r.status))].map((status) => ({
              status,
              _count: { _all: rows.filter((r) => r.status === status).length },
            })),
          ),
        ),
        findFirst: jest.fn(({ where }: { where: { status: string } }) =>
          Promise.resolve(rows.find((r) => r.status === where.status) ?? null),
        ),
        update: jest.fn(({ where, data }: { where: { ID: string }; data: object }) => {
          Object.assign(rows.find((r) => r.ID === where.ID) ?? {}, data);
          return Promise.resolve({});
        }),
      },
    };
    const service = new ReceiptProposalsService(prisma as never, { propose } as never);
    return { service, rows, prisma };
  };

  const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

  it("queues each own receipt, leaves shared ones out, and reads them all", async () => {
    const propose = jest.fn((spendingID: string) =>
      spendingID === "broken" ? Promise.reject(new Error("unreadable")) : Promise.resolve(proposal),
    );
    const { service, rows } = makeService(propose);

    const started = await service.start("user-1");
    expect(rows.map((r) => r.spendingID)).toEqual(["own", "broken"]);
    expect(started).toMatchObject({ queued: 2, ready: 0, failed: 0 });

    for (let i = 0; i < 10 && rows.some((r) => r.status === "queued"); i++) await settle();

    expect(rows.map((r) => [r.spendingID, r.status])).toEqual([
      ["own", "ready"],
      ["broken", "failed"],
    ]);
    expect(rows[0].proposal).toEqual(proposal);
    // One receipt at a time, in queue order.
    expect(propose.mock.calls.map(([id]) => id)).toEqual(["own", "broken"]);
  });
});
