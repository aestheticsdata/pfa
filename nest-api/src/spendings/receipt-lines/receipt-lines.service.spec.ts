import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ReceiptLinesService } from "@spendings/receipt-lines/receipt-lines.service";

/** PFA-214/218 — a spending's receipt lines and store: owned, replaced as a set, proposed by OCR. */
describe("ReceiptLinesService", () => {
  const makeService = (spending: { invoicefile: string | null } | null) => {
    const deleteMany = jest.fn((args: unknown) => ({ op: "deleteMany", args }));
    const createMany = jest.fn((args: unknown) => ({ op: "createMany", args }));
    const updateMany = jest.fn((args: unknown) => ({ op: "updateMany", args }));
    const store = { name: "Epicerie du Parc", address: "4 rue des Lilas, 00001 VILLE" };
    const findFirst = jest.fn().mockResolvedValue(spending && { ...spending, store });
    const prisma = {
      spendings: { findFirst, updateMany },
      receiptLines: {
        findMany: jest.fn(({ where }: { where: Record<string, unknown> }) =>
          Promise.resolve(
            "spendingID" in where
              ? [{ label: "PAIN", amount: "1.20", quantity: "2.000", size: null, sizeUnit: null, productType: null }]
              : // The auto-link's history: this label typed before at this store.
                [{ label: "PAIN", productType: { name: "Pain" }, spending: { store } }],
          ),
        ),
        deleteMany,
        createMany,
      },
      receiptProposals: { deleteMany: jest.fn((args: unknown) => ({ op: "deleteProposal", args })) },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    const receiptFiles = { safePath: jest.fn((userID: string, file: string) => `/invoices/${userID}/${file}`) };
    // Two readings: the whole page, its lines run into the card slip; then the slips apart.
    const ocr = {
      read: jest
        .fn()
        .mockResolvedValue([
          ["EPICERIE DU PAPC | CARTE\nPAIN 1,20 CARTE BANCAIRE\nTOTAL 1,20 MONTANT"],
          [
            "EPICERIE DU PAPC\n4 RUE DES LILAS\n00001 VILLE\nPAIN 1,20\nTOTAL 1,20",
            "CARTE BANCAIRE\nMONTANT :\n1,20 EUR",
          ],
        ]),
    };
    const stores = {
      recognise: jest.fn((read: unknown) => Promise.resolve(read && store)),
      resolve: jest.fn().mockResolvedValue("store-1"),
    };
    const productTypes = { resolve: jest.fn().mockResolvedValue(new Map([["PAIN", "type-1"]])) };
    const service = new ReceiptLinesService(
      prisma as never,
      receiptFiles as never,
      ocr as never,
      stores as never,
      productTypes as never,
    );
    return { service, prisma, ocr, stores, productTypes };
  };

  it("refuses a spending the user does not own", async () => {
    const { service } = makeService(null);

    await expect(service.read("s-1", "user-1")).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.save("s-1", "user-1", { lines: [] })).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.propose("s-1", "user-1")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("reads the lines in order, numbers as numbers, with the store", async () => {
    const { service, prisma } = makeService({ invoicefile: null });

    await expect(service.read("s-1", "user-1")).resolves.toEqual({
      lines: [{ label: "PAIN", amount: 1.2, quantity: 2, size: null, sizeUnit: null, productType: null }],
      store: { name: "Epicerie du Parc", address: "4 rue des Lilas, 00001 VILLE" },
    });
    expect(prisma.receiptLines.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { spendingID: "s-1" }, orderBy: { position: "asc" } }),
    );
  });

  it("replaces the whole set in one transaction, keeping the order, and links store and types", async () => {
    const { service, prisma, stores, productTypes } = makeService({ invoicefile: null });
    const store = { name: "Epicerie du Parc", address: null };

    await service.save("s-1", "user-1", {
      lines: [
        { label: " PAIN ", amount: 2.4, quantity: 2, size: 250, sizeUnit: "g", productType: "pain" },
        { label: "REMISE", amount: -0.5, quantity: 1, size: null, sizeUnit: "g", productType: null },
      ],
      store,
    });

    expect(prisma.receiptLines.deleteMany).toHaveBeenCalledWith({ where: { spendingID: "s-1" } });
    const { data } = prisma.receiptLines.createMany.mock.calls[0][0] as { data: Record<string, unknown>[] };
    expect(
      data.map(({ position, label, productTypeID, sizeUnit }) => [position, label, productTypeID, sizeUnit]),
    ).toEqual([
      [0, "PAIN", "type-1", "g"],
      // No size, no unit.
      [1, "REMISE", null, null],
    ]);
    expect(productTypes.resolve).toHaveBeenCalledWith(["pain"], "user-1");
    expect(stores.resolve).toHaveBeenCalledWith(store, "user-1");
    expect(prisma.spendings.updateMany).toHaveBeenCalledWith({
      where: { ID: "s-1", userID: "user-1" },
      data: { storeID: "store-1" },
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("clears the store on null, and leaves it alone when absent", async () => {
    const cleared = makeService({ invoicefile: null });
    await cleared.service.save("s-1", "user-1", { lines: [], store: null });
    expect(cleared.prisma.spendings.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { storeID: null } }),
    );

    const untouched = makeService({ invoicefile: null });
    await untouched.service.save("s-1", "user-1", { lines: [] });
    expect(untouched.prisma.spendings.updateMany).not.toHaveBeenCalled();
  });

  it("proposes the reading that holds up, its store recognised and its lines typed as before", async () => {
    const { service, ocr, stores } = makeService({ invoicefile: "spending-x-r.jpg" });

    await expect(service.propose("s-1", "user-1")).resolves.toEqual({
      lines: [{ label: "PAIN", amount: 1.2, quantity: 1, size: null, sizeUnit: null, productType: "Pain" }],
      total: 1.2,
      store: { name: "Epicerie du Parc", address: "4 rue des Lilas, 00001 VILLE" },
    });
    expect(ocr.read).toHaveBeenCalledWith("/invoices/user-1/spending-x-r.jpg");
    expect(stores.recognise).toHaveBeenCalledWith(
      { name: "EPICERIE DU PAPC", address: "4 RUE DES LILAS, 00001 VILLE" },
      "user-1",
    );
  });

  it("has nothing to read without a receipt", async () => {
    const { service, ocr } = makeService({ invoicefile: null });

    await expect(service.propose("s-1", "user-1")).rejects.toBeInstanceOf(BadRequestException);
    expect(ocr.read).not.toHaveBeenCalled();
  });
});
