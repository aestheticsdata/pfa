import { BulkReceiptReadService } from "@contexts/receipt-reading/application/bulk-receipt-read.service";
import type { ReceiptLinesService } from "@contexts/receipt-reading/application/receipt-lines.service";
import type { OwnedSpending } from "@contexts/receipt-reading/domain/interfaces/receiptReadingTypes";
import { PROPOSAL_STATUS } from "@contexts/receipt-reading/domain/proposal-status";
import { InMemoryQueuedReceiptRepository } from "@contexts/receipt-reading/infrastructure/testing/receipt-reading-fakes";

/** PFA-223 — saved receipts read in bulk, one at a time, kept as proposals. */
describe("BulkReceiptReadService", () => {
  const proposal = { lines: [], total: 4.2, store: null };
  const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

  const makeService = () => {
    const queue = new InMemoryQueuedReceiptRepository(["own", "broken"]);
    const propose = jest.fn((target: OwnedSpending) =>
      target.spendingId === "broken" ? Promise.reject(new Error("unreadable")) : Promise.resolve(proposal),
    );
    const service = new BulkReceiptReadService(queue, { propose } as unknown as ReceiptLinesService);
    return { service, queue, propose };
  };

  it("queues each candidate and reads them all, one at a time, in queue order", async () => {
    const { service, queue, propose } = makeService();

    const started = await service.start("user-1");
    expect(started).toMatchObject({ queued: 2, ready: 0, failed: 0 });

    for (let i = 0; i < 10 && queue.rows.some((r) => r.status === PROPOSAL_STATUS.queued); i++) await settle();

    expect(queue.rows.map((r) => [r.spendingId, r.status])).toEqual([
      ["own", PROPOSAL_STATUS.ready],
      ["broken", PROPOSAL_STATUS.failed],
    ]);
    expect(queue.rows[0].proposal).toEqual(proposal);
    expect(propose.mock.calls.map(([target]) => target.spendingId)).toEqual(["own", "broken"]);
  });

  it("takes a skipped receipt out of the queue", async () => {
    const { service, queue } = makeService();
    await service.start("user-1");
    for (let i = 0; i < 10 && queue.rows.some((r) => r.status === PROPOSAL_STATUS.queued); i++) await settle();

    await service.skip("own", "user-1");

    expect(queue.rows.find((r) => r.spendingId === "own")?.status).toBe(PROPOSAL_STATUS.skipped);
  });
});
