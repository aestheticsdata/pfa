/**
 * Receipt pictures for the mock account (PFA-194): a paper receipt drawn as an
 * SVG and rasterised to JPEG with sharp, so a seeded receipt opens in the app
 * like a photographed one. Written straight into the account's invoices
 * folder — the seeder is a local tool, nothing goes to the backup server.
 */

import { mkdir, readdir, unlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { SEED_RECEIPT_PREFIX } from "./seed-groups";

import type { ReceiptSheet } from "./seed-groups";

const WIDTH = 520;
const LINE_HEIGHT = 34;
const TOP = 170;

/** Same folder rule as the API (`app.config.ts`): the env override, else `invoicesUpload/`. */
export const invoicesDir = (userID: string) =>
  join(process.env.PFA_INVOICES_IMAGES_PATH ?? resolve(__dirname, "..", "invoicesUpload"), userID);

const escapeXml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c] ?? c);

const euro = (n: number) => `${n.toFixed(2)} EUR`;

function receiptSvg(sheet: ReceiptSheet): string {
  const total = sheet.lines.reduce((sum, l) => sum + l.amount, 0);
  const height = TOP + sheet.lines.length * LINE_HEIGHT + 150;
  const date = sheet.date.toISOString().slice(0, 10);
  const rows = sheet.lines
    .map(
      (l, i) =>
        `<text x="40" y="${TOP + i * LINE_HEIGHT}">${escapeXml(l.text.toUpperCase())}</text>` +
        `<text x="${WIDTH - 40}" y="${TOP + i * LINE_HEIGHT}" text-anchor="end">${euro(l.amount)}</text>`,
    )
    .join("");
  const footY = TOP + sheet.lines.length * LINE_HEIGHT;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}">
  <rect width="100%" height="100%" fill="#f6f1e6"/>
  <g font-family="Courier New, Courier, monospace" fill="#2b2b2b" font-size="22">
    <text x="${WIDTH / 2}" y="64" text-anchor="middle" font-size="30" font-weight="bold">${escapeXml(sheet.store.toUpperCase())}</text>
    <text x="${WIDTH / 2}" y="100" text-anchor="middle" font-size="18">${date}</text>
    <line x1="40" y1="126" x2="${WIDTH - 40}" y2="126" stroke="#2b2b2b" stroke-dasharray="6 6"/>
    ${rows}
    <line x1="40" y1="${footY}" x2="${WIDTH - 40}" y2="${footY}" stroke="#2b2b2b" stroke-dasharray="6 6"/>
    <text x="40" y="${footY + 42}" font-weight="bold">TOTAL</text>
    <text x="${WIDTH - 40}" y="${footY + 42}" text-anchor="end" font-weight="bold">${euro(total)}</text>
    <text x="${WIDTH / 2}" y="${footY + 100}" text-anchor="middle" font-size="18">THANK YOU</text>
  </g>
</svg>`;
}

export async function writeReceipts(userID: string, sheets: ReceiptSheet[]): Promise<void> {
  const dir = invoicesDir(userID);
  await mkdir(dir, { recursive: true });
  for (const sheet of sheets) {
    await sharp(Buffer.from(receiptSvg(sheet)))
      .jpeg({ quality: 82 })
      .toFile(join(dir, sheet.invoicefile));
  }
}

/** Removes the receipts this seeder wrote — and only those. */
export async function wipeSeedReceipts(userID: string): Promise<number> {
  const dir = invoicesDir(userID);
  const names = await readdir(dir).catch(() => [] as string[]);
  const seeded = names.filter((n) => n.startsWith(SEED_RECEIPT_PREFIX));
  for (const name of seeded) await unlink(join(dir, name));
  return seeded.length;
}
