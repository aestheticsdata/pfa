import { FIELD_LIMITS } from "@config/field-limits";
import type { ReceiptLine, ReceiptProposal } from "@spendings/receipt-lines/interfaces/receiptLinesTypes";

/**
 * Raw OCR text of a receipt → its line items (PFA-214).
 *
 * A heuristic, not a grammar: receipts differ per store, and the user checks
 * every proposal before it is saved. Item lines read "LABEL ... 12,34"; a
 * quantity / weight line ("2 x 1,50 3,00", "0,512 kg x 3,99 €/kg 2,04") prices
 * the label on the line above it; the first TOTAL ends the items, since what
 * follows is payment, VAT and change.
 */

// The price closing a line, optionally followed by a currency mark and the
// VAT code many tills print after it: one character or in parentheses
// ("2,30 € A", "2.30 1", "4.30 (01)" — PFA-217).
const PRICE_AT_END = /(-?)\s?(?<![\d.,])(\d{1,4})[.,] ?(\d{2})\s*(?:€|EUR|EURO)?(?:\s+(?:[A-D0-9*]|\(\w{1,3}\)))?\s*$/i;

// What starts the totals block. Sub-totals and partial totals are not the total.
const TOTAL_LINE = /^(TOTAL|NET A PAYER|A PAYER|MONTANT (TTC|DU))\b/;
const PARTIAL_TOTAL = /^(SOUS[ -]?TOTAL|TOTAL (HT|TVA|REMISE|ECONOMIE))/;

// Lines that carry a price but are no item: payment, VAT, till chatter, the card slip.
const NOISE =
  /\b(SOUS[ -]?TOTAL|TVA|HT|TTC|CB|CARTE|ESPECES|RENDU|MONNAIE|VISA|MASTERCARD|PAIEMENT|SANS CONTACT|TICKET|CAISSE|SIRET|TEL|MERCI|NB ART(ICLES?)?|MONTANT|DEBIT|AUTO)\b/;

// The quantity and unit-price columns left between a label and its total:
// "NAT KARITE 1L  4  5,99" keeps "NAT KARITE 1L" (PFA-216).
const TRAILING_COLUMNS = /(\s+(\d+([.,]\d+)?|[xX*@]))+$/;

// A line made only of figures, multiply signs and units: a quantity or weight detail.
const DETAIL_LINE = /^(?:[\d\s.,xX*@=€/-]|KG|G|L|PCE?S?|EUR)*$/i;

const LETTERS = /\p{L}/gu;
const MIN_LABEL_LETTERS = 2;
const MAX_AMOUNT = 9999.99;

// Header lines that are not the store's name (PFA-218): address, postcode,
// contact, dates and numbers, the person on duty, a greeting.
const NOT_A_STORE_NAME = [
  /\b(RUE|AVENUE|AV|BD|BOULEVARD|PLACE|CHEMIN|ALLEE|QUAI|ROUTE|IMPASSE|COURS|CEDEX|BP)\b/,
  /\b\d{5}\b/,
  /HTTP|WWW|\.(FR|COM|NET)\b|@/,
  /\d{2}[/.-]\d{2}/,
  /^(MR|MME|MLLE|M\.)\s/,
  /^(BIENVENUE|WELCOME|BONJOUR)\b/,
  /\b(SIRET|SIREN|NAF|RCS|APE|FAX|DUPLICATA|VENTE|FACTURE)\b/,
];
// A name is mostly letters, with a word of three letters at least.
const MIN_STORE_LETTERS = 4;
const MIN_STORE_LETTER_SHARE = 0.6;
const STORE_WORD = /\p{L}{3,}/u;

interface ParseState {
  lines: ReceiptLine[];
  /** A label read on its own line, waiting for the detail line that prices it. */
  pendingLabel: string | null;
  /** The store's name, read on the first header line that can be one. */
  store: string | null;
}

/** Upper-cased, accents stripped, spaces collapsed: what the keyword tests read. */
function normalize(line: string): string {
  return line.normalize("NFD").replaceAll(/\p{M}/gu, "").toUpperCase().replaceAll(/\s+/g, " ").trim();
}

function readPrice(line: string): { amount: number; rest: string } | null {
  const match = PRICE_AT_END.exec(line);
  if (!match) return null;
  const amount = Number(`${match[1]}${match[2]}.${match[3]}`);
  if (Math.abs(amount) > MAX_AMOUNT) return null;
  return { amount, rest: line.slice(0, match.index) };
}

/** Dot leaders, stray symbols and spacing trimmed; null when too little text is left to be a label. */
function cleanLabel(raw: string): string | null {
  const label = raw
    .replaceAll(/[.·_*]{2,}/g, " ")
    .replaceAll(/\s+/g, " ")
    .replace(/^[\s\-*.:|]+|[\s\-*.:€|]+$/g, "")
    .replace(TRAILING_COLUMNS, "")
    .slice(0, FIELD_LIMITS.receiptLineLabel)
    .trim();
  return (label.match(LETTERS)?.length ?? 0) >= MIN_LABEL_LETTERS ? label : null;
}

/**
 * The store's name if this header line can be one, else null. Text after a
 * bar is another slip run into the line and is left out.
 */
export function storeNameCandidate(raw: string): string | null {
  const name = raw
    .split("|")[0]
    .replace(/^[^\p{L}\d]+|[^\p{L}\d]+$/gu, "")
    .replaceAll(/\s+/g, " ")
    .slice(0, FIELD_LIMITS.storeName)
    .trim();
  const normalized = normalize(name);
  if (NOISE.test(normalized) || NOT_A_STORE_NAME.some((pattern) => pattern.test(normalized))) return null;
  const letters = name.match(LETTERS)?.length ?? 0;
  const visible = name.replaceAll(/\s/g, "").length;
  if (letters < MIN_STORE_LETTERS || letters / visible < MIN_STORE_LETTER_SHARE || !STORE_WORD.test(name)) {
    return null;
  }
  return name;
}

function readLine(state: ParseState, raw: string): void {
  const line = raw.trim();
  if (!line) return;
  const price = readPrice(line);
  // The name heads the receipt: only looked for before the first item.
  if (state.store === null && state.lines.length === 0 && !price) {
    state.store = storeNameCandidate(line);
  }

  if (DETAIL_LINE.test(line)) {
    if (price && state.pendingLabel) {
      state.lines.push({ label: state.pendingLabel, amount: price.amount });
    }
    state.pendingLabel = null;
    return;
  }
  if (NOISE.test(normalize(line))) {
    state.pendingLabel = null;
    return;
  }

  const label = cleanLabel(price ? price.rest : line);
  if (!label) return;
  if (price) {
    state.lines.push({ label, amount: price.amount });
    state.pendingLabel = null;
  } else {
    state.pendingLabel = label;
  }
}

export function parseReceiptText(text: string): ReceiptProposal {
  const state: ParseState = { lines: [], pendingLabel: null, store: null };

  for (const raw of text.split(/\r?\n/)) {
    const normalized = normalize(raw);
    if (TOTAL_LINE.test(normalized) && !PARTIAL_TOTAL.test(normalized)) {
      return { lines: state.lines, total: readPrice(raw.trim())?.amount ?? null, store: state.store };
    }
    readLine(state, raw);
  }

  return { lines: state.lines, total: null, store: state.store };
}

/**
 * Several slips read apart: the items of each, the first total found, and the
 * store of the first slip that is a receipt — one with items or a total. A
 * card slip has neither, and names the store only in passing (PFA-218).
 */
export function parseReceiptPages(pages: string[]): ReceiptProposal {
  const proposals = pages.map(parseReceiptText);
  const receipts = proposals.filter((proposal) => proposal.lines.length > 0 || proposal.total !== null);
  return {
    lines: proposals.flatMap((proposal) => proposal.lines),
    total: proposals.find((proposal) => proposal.total !== null)?.total ?? null,
    store: receipts.find((proposal) => proposal.store !== null)?.store ?? null,
  };
}

/** Lines adding up to the total read, within a cent. */
function addsUp(proposal: ReceiptProposal): boolean {
  if (proposal.total === null || proposal.lines.length === 0) return false;
  const sum = proposal.lines.reduce((acc, line) => acc + line.amount, 0);
  return Math.abs(sum - proposal.total) < 0.005;
}

/**
 * The reading that holds up best (PFA-216): lines adding up to the receipt's
 * total first, then a total found at all, then the most lines.
 */
export function pickProposal(proposals: ReceiptProposal[]): ReceiptProposal {
  const score = (proposal: ReceiptProposal) => [
    addsUp(proposal) ? 1 : 0,
    proposal.total === null ? 0 : 1,
    proposal.lines.length,
  ];
  const better = (a: ReceiptProposal, b: ReceiptProposal) => {
    const [sa, sb] = [score(a), score(b)];
    const diff = sa.findIndex((value, i) => value !== sb[i]);
    return diff >= 0 && sa[diff] > sb[diff] ? a : b;
  };
  return proposals.reduce((best, proposal) => better(proposal, best), { lines: [], total: null, store: null });
}
