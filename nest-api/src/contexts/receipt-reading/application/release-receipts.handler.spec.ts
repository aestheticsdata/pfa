import { ReleaseReceiptsHandler } from "@contexts/receipt-reading/application/release-receipts.handler";
import type { ReceiptFileStore } from "@contexts/receipt-reading/domain/ports/receipt-file-store";
import { isReceiptsLetGo, SPENDING_EVENT } from "@contexts/spending/domain/spending-events";

/** PFA-278 — a spending event lets receipts go; the file store keeps any still held. */
describe("ReleaseReceiptsHandler", () => {
  const event = { name: SPENDING_EVENT.spendingDeleted, ownerId: "u1", subjectId: "s1", receipts: ["r.jpg", null] };

  it("hands the event's receipts to the file store", async () => {
    const release = jest.fn().mockResolvedValue(undefined);
    await new ReleaseReceiptsHandler({ release } as unknown as ReceiptFileStore).handle(event);
    expect(release).toHaveBeenCalledWith("u1", ["r.jpg", null]);
  });

  it("recognises a spending event, and nothing else", () => {
    expect(isReceiptsLetGo(event)).toBe(true);
    expect(isReceiptsLetGo({ name: "identity.signedUp", ownerId: "u1" })).toBe(false);
  });
});
