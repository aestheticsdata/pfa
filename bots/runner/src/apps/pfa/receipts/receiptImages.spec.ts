import { assertKnownReceipt, loadReceipts, RECEIPT_RULES } from "@apps/pfa/receipts/receiptImages";
import { describe, expect, it } from "vitest";

describe("fixed receipt set", () => {
  it("is exactly ten JPEGs of 7 KB at most", async () => {
    const receipts = await loadReceipts();
    expect(receipts).toHaveLength(10);
    for (const receipt of receipts) {
      expect(receipt.bytes.length).toBeLessThanOrEqual(RECEIPT_RULES.maxBytes);
      expect([...receipt.bytes.slice(0, 3)]).toEqual([0xff, 0xd8, 0xff]);
    }
  });

  it("refuses to upload anything that is not one of them, byte for byte", async () => {
    const [first] = await loadReceipts();
    if (!first) throw new Error("no receipt");
    await expect(assertKnownReceipt(first)).resolves.toBeUndefined();

    const tampered = new Uint8Array(first.bytes);
    tampered[tampered.length - 3] = (tampered[tampered.length - 3] ?? 0) ^ 0xff;
    await expect(assertKnownReceipt({ ...first, bytes: tampered })).rejects.toThrow(/outside the fixed receipt set/);
    await expect(assertKnownReceipt({ ...first, bytes: new Uint8Array([0xff, 0xd8, 0xff, 0]) })).rejects.toThrow();
  });
});
