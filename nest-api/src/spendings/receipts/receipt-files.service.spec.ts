import { mkdtemp, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import sharp from "sharp";
import { ReceiptFilesService } from "@spendings/receipts/receipt-files.service";

jest.mock("fs/promises", () => ({
  ...jest.requireActual<typeof import("fs/promises")>("fs/promises"),
  unlink: jest.fn().mockResolvedValue(undefined),
}));

/**
 * A receipt file can be held by several rows (PFA-189): it is removed — locally
 * and on the memosyne backup, under the same name — only once none holds it.
 */
describe("ReceiptFilesService.release", () => {
  const makeService = (references: Record<string, number>) => {
    const count = jest.fn(({ where }: { where: { invoicefile: string } }) =>
      Promise.resolve(references[where.invoicefile] ?? 0),
    );
    const prisma = {
      spendings: { count },
      exceptionals: { count: jest.fn(() => 0) },
      recurrings: { count: jest.fn(() => 0) },
    };
    const config = { getOrThrow: () => ({ invoicesPath: "/invoices" }) };
    const deleteFile = jest.fn().mockResolvedValue(undefined);
    const sshBackup = { enabled: true, backupInvoicesPath: "/backup/", deleteFile };
    const service = new ReceiptFilesService(prisma as never, config as never, sshBackup as never);
    return { service, deleteFile };
  };

  beforeEach(() => jest.mocked(unlink).mockClear());

  it("keeps a file another row still holds", async () => {
    const { service, deleteFile } = makeService({ "shared-r.jpg": 2 });

    await service.release("user-1", ["shared-r.jpg"]);

    expect(unlink).not.toHaveBeenCalled();
    expect(deleteFile).not.toHaveBeenCalled();
  });

  it("removes an orphan locally and on the backup, under the same (legacy) name", async () => {
    const { service, deleteFile } = makeService({});

    await service.release("user-1", ["spending-Old-2024-01-02-r.jpg"]);

    expect(unlink).toHaveBeenCalledWith("/invoices/user-1/spending-Old-2024-01-02-r.jpg");
    expect(deleteFile).toHaveBeenCalledWith("/backup/user-1/spending-Old-2024-01-02-r.jpg");
  });

  it("ignores nulls and handles each file once", async () => {
    const { service } = makeService({});

    await service.release("user-1", [null, "a-r.jpg", undefined, "a-r.jpg"]);

    expect(unlink).toHaveBeenCalledTimes(1);
  });

  it("still drops the backup copy when the local file is already gone", async () => {
    const { service, deleteFile } = makeService({});
    jest.mocked(unlink).mockRejectedValueOnce(Object.assign(new Error("gone"), { code: "ENOENT" }));

    await service.release("user-1", ["a-r.jpg"]);

    expect(deleteFile).toHaveBeenCalledWith("/backup/user-1/a-r.jpg");
  });
});

/**
 * Stored receipts are downsized to 1500px on their longest side — never enlarged (PFA-124): a small
 * picture is kept at its own size instead of being blown up to ~25× its weight.
 */
describe("ReceiptFilesService.store", () => {
  const makeService = () => {
    const config = { getOrThrow: () => ({ invoicesPath: "/invoices" }) };
    return new ReceiptFilesService({} as never, config as never, { enabled: false } as never);
  };

  const jpeg = async (dir: string, size: { width: number; height: number }) => {
    const path = `${dir}/upload-${size.width}.jpg`;
    await sharp({ create: { ...size, channels: 3, background: "#eeeeee" } })
      .jpeg()
      .toFile(path);
    return path;
  };

  it("keeps a small picture at its own size", async () => {
    const dir = await mkdtemp(join(tmpdir(), "receipts-"));
    const stored = await makeService().store(await jpeg(dir, { width: 128, height: 192 }), "upload-128.jpg", "u1");
    const meta = await sharp(`${dir}/${stored}`).metadata();
    expect([meta.width, meta.height]).toEqual([128, 192]);
  });

  it("still downsizes a big photo", async () => {
    const dir = await mkdtemp(join(tmpdir(), "receipts-"));
    const stored = await makeService().store(await jpeg(dir, { width: 2000, height: 3000 }), "upload-2000.jpg", "u1");
    const meta = await sharp(`${dir}/${stored}`).metadata();
    expect(meta.height).toBe(1500);
  });
});
