import { PROPOSAL_STATUS } from "@contexts/receipt-reading/domain/proposal-status";
import { QueuedReceipt } from "@contexts/receipt-reading/domain/queued-receipt";
import { ReceiptNotQueued } from "@contexts/receipt-reading/domain/receipt-errors";

describe("QueuedReceipt", () => {
  const proposal = { lines: [], total: null, store: null };
  const queued = () =>
    QueuedReceipt.restore({
      id: "q1",
      spendingId: "s1",
      ownerId: "u1",
      status: PROPOSAL_STATUS.queued,
      proposal: null,
    });

  it("is read once: ready with its proposal, or failed", () => {
    const ready = queued();
    ready.markReady(proposal);
    expect([ready.status, ready.proposal]).toEqual([PROPOSAL_STATUS.ready, proposal]);

    const failed = queued();
    failed.markFailed();
    expect(failed.status).toBe(PROPOSAL_STATUS.failed);
  });

  it("never takes a second result", () => {
    const entry = queued();
    entry.markFailed();
    expect(() => entry.markReady(proposal)).toThrow(ReceiptNotQueued);
  });

  it("can be skipped whatever it stands at", () => {
    const entry = queued();
    entry.markReady(proposal);
    entry.skip();
    expect(entry.status).toBe(PROPOSAL_STATUS.skipped);
  });
});
