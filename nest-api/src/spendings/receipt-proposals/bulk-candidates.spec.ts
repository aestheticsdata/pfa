import { ownReceipts } from "@spendings/receipt-proposals/bulk-candidates";

describe("ownReceipts", () => {
  it("keeps the receipts a single spending holds, not the shared ones", () => {
    const spendings = [
      { ID: "a", invoicefile: "own-r.jpg" },
      { ID: "b", invoicefile: "shared-r.jpg" },
      { ID: "c", invoicefile: "shared-r.jpg" },
    ];
    const holders = new Map([
      ["own-r.jpg", 1],
      ["shared-r.jpg", 2],
    ]);
    expect(ownReceipts(spendings, holders)).toEqual(["a"]);
  });
});
