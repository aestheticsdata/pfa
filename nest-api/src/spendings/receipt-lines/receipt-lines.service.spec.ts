import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ReceiptLinesService } from "@spendings/receipt-lines/receipt-lines.service";

/** PFA-214 — a spending's receipt lines: owned, replaced as a set, proposed by OCR. */
describe("ReceiptLinesService", () => {
  const makeService = (spending: { invoicefile: string | null } | null) => {
    const deleteMany = jest.fn((args: unknown) => ({ op: "deleteMany", args }));
    const createMany = jest.fn((args: unknown) => ({ op: "createMany", args }));
    const prisma = {
      spendings: { findFirst: jest.fn().mockResolvedValue(spending) },
      receiptLines: {
        findMany: jest.fn().mockResolvedValue([{ label: "PAIN", amount: "1.20" }]),
        deleteMany,
        createMany,
      },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    const receiptFiles = { safePath: jest.fn((userID: string, file: string) => `/invoices/${userID}/${file}`) };
    const ocr = { read: jest.fn().mockResolvedValue("PAIN 1,20\nTOTAL 1,20") };
    const service = new ReceiptLinesService(prisma as never, receiptFiles as never, ocr as never);
    return { service, prisma, ocr };
  };

  it("refuses a spending the user does not own", async () => {
    const { service } = makeService(null);

    await expect(service.read("s-1", "user-1")).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.save("s-1", "user-1", [])).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.propose("s-1", "user-1")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("reads the lines in order, amounts as numbers", async () => {
    const { service, prisma } = makeService({ invoicefile: null });

    await expect(service.read("s-1", "user-1")).resolves.toEqual({ lines: [{ label: "PAIN", amount: 1.2 }] });
    expect(prisma.receiptLines.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { spendingID: "s-1" }, orderBy: { position: "asc" } }),
    );
  });

  it("replaces the whole set in one transaction, keeping the order", async () => {
    const { service, prisma } = makeService({ invoicefile: null });

    const saved = await service.save("s-1", "user-1", [
      { label: " CAFE ", amount: 3.85 },
      { label: "REMISE", amount: -0.5 },
    ]);

    expect(saved).toEqual({
      lines: [
        { label: "CAFE", amount: 3.85 },
        { label: "REMISE", amount: -0.5 },
      ],
    });
    expect(prisma.receiptLines.deleteMany).toHaveBeenCalledWith({ where: { spendingID: "s-1" } });
    const { data } = prisma.receiptLines.createMany.mock.calls[0][0] as { data: Record<string, unknown>[] };
    expect(data.map(({ position, label }) => [position, label])).toEqual([
      [0, "CAFE"],
      [1, "REMISE"],
    ]);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("proposes the lines read on the spending's own receipt", async () => {
    const { service, ocr } = makeService({ invoicefile: "spending-x-r.jpg" });

    await expect(service.propose("s-1", "user-1")).resolves.toEqual({
      lines: [{ label: "PAIN", amount: 1.2 }],
      total: 1.2,
    });
    expect(ocr.read).toHaveBeenCalledWith("/invoices/user-1/spending-x-r.jpg");
  });

  it("has nothing to read without a receipt", async () => {
    const { service, ocr } = makeService({ invoicefile: null });

    await expect(service.propose("s-1", "user-1")).rejects.toBeInstanceOf(BadRequestException);
    expect(ocr.read).not.toHaveBeenCalled();
  });
});
