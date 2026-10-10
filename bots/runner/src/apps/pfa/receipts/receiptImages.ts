import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import type { ReceiptImage } from "@apps/pfa/interfaces/pfaTypes";

/**
 * `maxBytes` bounds what a receipt costs on PFA's disk, not just what is sent: PFA re-encodes every
 * upload (never enlarged since PFA-124), so these pictures go from ≤ 5.8 KB sent to ≤ 6.4 KB stored (regenerate them
 * with `node scripts/generateReceipts.mjs`, which prints both).
 * The upload budget is charged `maxBytes` per receipt: it counts the disk, with margin.
 */
export const RECEIPT_RULES = {
  count: 10,
  maxBytes: 7 * 1024,
} as const;

const RECEIPTS_DIR = fileURLToPath(new URL(".", import.meta.url));

let loaded: Promise<ReceiptImage[]> | undefined;

/**
 * The fixed set of receipt pictures (PFA-124): exactly ten JPEGs of 7 KB at most, shipped in this
 * folder. Checked once at load; anything else in the folder — or a missing or oversized picture —
 * stops the runner at boot.
 */
export function loadReceipts(): Promise<ReceiptImage[]> {
  loaded ??= readReceipts();
  return loaded;
}

/** The upload path refuses any bytes that are not one of the ten pictures, byte for byte. */
export async function assertKnownReceipt(image: ReceiptImage): Promise<void> {
  const known = await loadReceipts();
  const hash = sha256(image.bytes);
  if (!known.some((receipt) => receipt.sha256 === hash)) {
    throw new Error("Refusing to upload a file outside the fixed receipt set");
  }
}

async function readReceipts(): Promise<ReceiptImage[]> {
  const names = (await readdir(RECEIPTS_DIR)).filter((name) => name.endsWith(".jpg")).sort();
  if (names.length !== RECEIPT_RULES.count) {
    throw new Error(`Expected ${RECEIPT_RULES.count} receipt pictures, found ${names.length}`);
  }
  return Promise.all(
    names.map(async (name) => {
      const bytes = new Uint8Array(await readFile(join(RECEIPTS_DIR, name)));
      if (bytes.length > RECEIPT_RULES.maxBytes) {
        throw new Error(`${name} is ${bytes.length} bytes, above ${RECEIPT_RULES.maxBytes}`);
      }
      if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
        throw new Error(`${name} is not a JPEG`);
      }
      return { name, bytes, sha256: sha256(bytes) };
    }),
  );
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}
