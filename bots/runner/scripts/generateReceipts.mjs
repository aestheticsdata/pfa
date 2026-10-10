/**
 * Regenerates the ten fixed receipt pictures of the PFA bots (src/apps/pfa/receipts/).
 *
 *   node scripts/generateReceipts.mjs
 *
 * Invented shops (no real brand), each with its own fonts and sizes so the pictures look like they
 * come from different tills. Low quality on purpose: what matters is the weight once PFA has
 * re-encoded them (≤ 7 KB, checked by receiptImages.spec.ts and printed below). Uses the macOS
 * system fonts and the `sharp` already installed in nest-api — a one-off tool, not runtime code.
 */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(new URL("../../../nest-api/package.json", import.meta.url));
const sharp = require("sharp");
const OUT = fileURLToPath(new URL("../src/apps/pfa/receipts/", import.meta.url));

const SHOPS = [
  {
    name: "GREENLEAF MARKET",
    lines: ["12 Station Road", "Tel 01 42 55 18 09"],
    items: [
      ["Semi-skimmed milk", 1.15],
      ["Penne 500g", 0.95],
      ["Tomatoes 1kg", 2.89],
      ["Yoghurt x8", 2.45],
      ["Ground coffee", 4.2],
    ],
    header: { font: "Courier New", size: 12, weight: "bold" },
    body: { font: "Courier New", size: 9 },
    width: 150,
  },
  {
    name: "The Crust Bakery",
    lines: ["Artisan bakers since 1987"],
    items: [
      ["Baguette", 1.2],
      ["Croissant x2", 2.6],
      ["Rye loaf", 3.9],
    ],
    header: { font: "Georgia", size: 14, style: "italic" },
    body: { font: "Georgia", size: 10 },
    width: 136,
  },
  {
    name: "CENTRAL PHARMACY",
    lines: ["Open 7/7 · 8am–9pm"],
    items: [
      ["Paracetamol 1g", 2.18],
      ["Throat lozenges", 5.9],
      ["Saline spray", 4.35],
    ],
    header: { font: "Arial Narrow", size: 13, weight: "bold" },
    body: { font: "Arial Narrow", size: 10 },
    width: 128,
  },
  {
    name: "The Copper Tap",
    lines: ["Table 6 · Server: Leo"],
    items: [
      ["Pale ale pint", 6.5],
      ["IPA pint", 7.0],
      ["Nachos", 8.5],
      ["Lemonade", 3.5],
    ],
    header: { font: "American Typewriter", size: 13, weight: "bold" },
    body: { font: "American Typewriter", size: 9 },
    width: 144,
  },
  {
    name: "Trattoria Luce",
    lines: ["Covers: 2"],
    items: [
      ["Burrata", 11.0],
      ["Tagliatelle ragu", 16.5],
      ["Margherita", 12.0],
      ["House red 50cl", 14.0],
    ],
    header: { font: "Didot", size: 15 },
    body: { font: "Didot", size: 10 },
    width: 148,
  },
  {
    name: "STARLIGHT CINEMA",
    lines: ["Screen 4 · 20:45"],
    items: [
      ["Adult ticket", 11.9],
      ["Adult ticket", 11.9],
      ["Popcorn M", 6.5],
    ],
    header: { font: "Futura", size: 12, weight: "bold" },
    body: { font: "Futura", size: 9 },
    width: 132,
  },
  {
    name: "Bean & Brew",
    lines: ["Coffee roasters"],
    items: [
      ["Flat white", 3.8],
      ["Cinnamon bun", 3.2],
    ],
    header: { font: "Avenir Next Condensed", size: 15, weight: "bold" },
    body: { font: "Avenir Next Condensed", size: 11 },
    width: 120,
  },
  {
    name: "FIXIT HARDWARE",
    lines: ["DIY · Garden · Tools"],
    items: [
      ["Wood screws x100", 4.9],
      ["Masking tape", 3.25],
      ["LED bulb E27", 6.99],
      ["Sandpaper set", 5.4],
    ],
    header: { font: "Impact", size: 14 },
    body: { font: "Andale Mono", size: 8 },
    width: 150,
  },
  {
    name: "MARTIN & SONS",
    lines: ["Family butchers"],
    items: [
      ["Chicken thighs 600g", 7.8],
      ["Beef mince 500g", 6.95],
      ["Sausages x6", 5.5],
    ],
    header: { font: "Copperplate", size: 13, weight: "bold" },
    body: { font: "Times New Roman", size: 10 },
    width: 140,
  },
  {
    name: "Saturday Farmers Market",
    lines: ["Stall 14 · cash or card"],
    items: [
      ["Apples 1.5kg", 4.2],
      ["Goat cheese", 5.5],
      ["Honey 250g", 6.0],
    ],
    header: { font: "Menlo", size: 10, weight: "bold" },
    body: { font: "Menlo", size: 8 },
    width: 146,
  },
];

const DATES = [
  "03/10/2026 09:14",
  "04/10/2026 08:02",
  "05/10/2026 18:37",
  "06/10/2026 22:48",
  "07/10/2026 21:05",
  "08/10/2026 20:31",
  "09/10/2026 10:26",
  "10/10/2026 11:52",
  "11/10/2026 16:09",
  "12/10/2026 10:44",
];

const escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const style = (f) =>
  `font-family="${f.font}" font-size="${f.size}"${f.weight ? ` font-weight="${f.weight}"` : ""}${f.style ? ` font-style="${f.style}"` : ""}`;

function receiptSvg(shop, index) {
  const pad = 8;
  const right = shop.width - pad;
  const mid = shop.width / 2;
  const line = shop.body.size + 4;
  let y = pad + shop.header.size;
  const parts = [`<text x="${mid}" y="${y}" text-anchor="middle" ${style(shop.header)}>${escape(shop.name)}</text>`];
  for (const sub of shop.lines) {
    y += line;
    parts.push(`<text x="${mid}" y="${y}" text-anchor="middle" ${style(shop.body)}>${escape(sub)}</text>`);
  }
  y += line;
  parts.push(`<text x="${mid}" y="${y}" text-anchor="middle" ${style(shop.body)}>${DATES[index]}</text>`);
  y += 6;
  parts.push(`<line x1="${pad}" y1="${y}" x2="${right}" y2="${y}" stroke="#333" stroke-dasharray="3 2"/>`);
  for (const [label, price] of shop.items) {
    y += line;
    parts.push(`<text x="${pad}" y="${y}" ${style(shop.body)}>${escape(label)}</text>`);
    parts.push(`<text x="${right}" y="${y}" text-anchor="end" ${style(shop.body)}>${price.toFixed(2)}</text>`);
  }
  const total = shop.items.reduce((sum, [, price]) => sum + price, 0);
  y += 6;
  parts.push(`<line x1="${pad}" y1="${y}" x2="${right}" y2="${y}" stroke="#333"/>`);
  y += line + 1;
  const bold = { ...shop.body, size: shop.body.size + 1, weight: "bold" };
  parts.push(`<text x="${pad}" y="${y}" ${style(bold)}>TOTAL EUR</text>`);
  parts.push(`<text x="${right}" y="${y}" text-anchor="end" ${style(bold)}>${total.toFixed(2)}</text>`);
  y += line;
  parts.push(`<text x="${mid}" y="${y}" text-anchor="middle" ${style(shop.body)}>Paid by card · Thank you</text>`);
  const height = Math.ceil(y + pad);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${shop.width}" height="${height}"><rect width="100%" height="100%" fill="#f1f0ec"/><g fill="#1e1e1e">${parts.join("")}</g></svg>`;
}

let maxStored = 0;
for (const [index, shop] of SHOPS.entries()) {
  const file = `${OUT}receipt-${String(index + 1).padStart(2, "0")}.jpg`;
  const raw = await sharp(Buffer.from(receiptSvg(shop, index)))
    .jpeg({ quality: 70 })
    .toBuffer();
  await sharp(raw).toFile(file);
  // What PFA stores: re-encoded, never enlarged (receipt-files.service.ts).
  const meta = await sharp(raw).metadata();
  const side = meta.width > meta.height ? "width" : "height";
  const stored = await sharp(raw)
    .resize({ fit: "inside", [side]: side === "width" ? 1125 : 1500, withoutEnlargement: true })
    .toBuffer();
  maxStored = Math.max(maxStored, stored.length);
  console.log(
    `${file.split("/").pop()}  ${meta.width}x${meta.height}  sent ${raw.length} B  stored ${stored.length} B  ${shop.name}`,
  );
}
console.log(`max stored: ${maxStored} B`);
