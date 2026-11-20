import { ReceiptLinesService } from "@contexts/receipt-reading/application/receipt-lines.service";
import { NoReceipt, SpendingNotFound } from "@contexts/receipt-reading/domain/receipt-errors";
import {
  FakeProductTypeCatalog,
  FakeReceiptTextReader,
  FakeStoreDirectory,
  InMemoryReceiptLinesRepository,
} from "@contexts/receipt-reading/infrastructure/testing/receipt-reading-fakes";

/** PFA-214/218 — a spending's receipt lines and store: owned, replaced as a set, proposed by OCR. */
describe("ReceiptLinesService", () => {
  const known = { name: "Epicerie du Parc", address: "4 rue des Lilas, 00001 VILLE" };
  const target = { spendingId: "s-1", ownerId: "user-1" };
  const bread = { label: "PAIN", amount: 1.2, quantity: 2, size: null, sizeUnit: null, productType: null };

  // Two readings: the whole page, its lines run into the card slip; then the slips apart.
  const readings = [
    ["EPICERIE DU PAPC | CARTE\nPAIN 1,20 CARTE BANCAIRE\nTOTAL 1,20 MONTANT"],
    ["EPICERIE DU PAPC\n4 RUE DES LILAS\n00001 VILLE\nPAIN 1,20\nTOTAL 1,20", "CARTE BANCAIRE\nMONTANT :\n1,20 EUR"],
  ];

  const makeService = (receipt: string | null | undefined) => {
    const lines = new InMemoryReceiptLinesRepository(receipt === undefined ? null : { receipt, store: known }, [bread]);
    const reader = new FakeReceiptTextReader(readings);
    const stores = new FakeStoreDirectory(known);
    const service = new ReceiptLinesService(lines, reader, stores, new FakeProductTypeCatalog("Pain"));
    return { service, lines, reader, stores };
  };

  it("refuses a spending the user does not own", async () => {
    const { service } = makeService(undefined);

    await expect(service.read(target)).rejects.toBeInstanceOf(SpendingNotFound);
    await expect(service.save(target, { lines: [] })).rejects.toBeInstanceOf(SpendingNotFound);
    await expect(service.propose(target)).rejects.toBeInstanceOf(SpendingNotFound);
  });

  it("reads the saved lines with the spending's store", async () => {
    await expect(makeService(null).service.read(target)).resolves.toEqual({ lines: [bread], store: known });
  });

  it("replaces the whole set with each line's product type and the store resolved", async () => {
    const { service, lines, stores } = makeService(null);
    const store = { name: "Epicerie du Parc", address: null };

    await service.save(target, {
      lines: [
        { label: " PAIN ", amount: 2.4, quantity: 2, size: 250, sizeUnit: "g", productType: "pain" },
        { label: "REMISE", amount: -0.5, quantity: 1, size: null, sizeUnit: "g", productType: null },
      ],
      store,
    });

    expect(lines.replaced[0].lines.map((line) => line.productTypeId)).toEqual(["type:PAIN", null]);
    expect(lines.replaced[0].storeId).toBe("store-1");
    expect(stores.resolved).toEqual([store]);
  });

  it("clears the store on null, and leaves it alone when absent", async () => {
    const cleared = makeService(null);
    await cleared.service.save(target, { lines: [], store: null });
    expect(cleared.lines.replaced[0].storeId).toBeNull();

    const untouched = makeService(null);
    await untouched.service.save(target, { lines: [] });
    expect(untouched.lines.replaced[0].storeId).toBeUndefined();
  });

  it("proposes the reading that holds up, its store recognised and its lines typed as before", async () => {
    const { service, reader } = makeService("spending-x-r.jpg");

    await expect(service.propose(target)).resolves.toEqual({
      lines: [{ label: "PAIN", amount: 1.2, quantity: 1, size: null, sizeUnit: null, productType: "Pain" }],
      total: 1.2,
      store: known,
    });
    expect(reader.reads).toEqual([{ ownerId: "user-1", file: "spending-x-r.jpg" }]);
  });

  it("has nothing to read without a receipt", async () => {
    const { service, reader } = makeService(null);

    await expect(service.propose(target)).rejects.toBeInstanceOf(NoReceipt);
    expect(reader.reads).toEqual([]);
  });
});
