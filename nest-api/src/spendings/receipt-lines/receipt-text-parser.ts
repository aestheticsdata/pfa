import { FIELD_LIMITS } from "@config/field-limits";
import {
  readQuantityDetail,
  readSize,
  splitColumns,
  splitLeadingCount,
} from "@spendings/receipt-lines/receipt-quantities";
import type { ItemSize, ReceiptLine, ReceiptProposal } from "@spendings/receipt-lines/interfaces/receiptLinesTypes";
import type { StoreIdentity } from "@spendings/stores/interfaces/storesTypes";

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
// The store's address in its header (PFA-219): a street line, then postcode and city.
const STREET =
  /^\d{1,4}\s*(BIS|TER)?[\s,]+(RUE|AVENUE|AV|BD|BOULEVARD|PLACE|PL|CHEMIN|ALLEE|QUAI|ROUTE|IMPASSE|COURS|CHAUSSEE|ZA|ZI|CENTRE)\b/;
const CITY = /\b(\d{5})\s+(\p{L}[\p{L}' -]*\p{L})/u;

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
  /** Its address lines, read in the header after the name (PFA-219). */
  street: string | null;
  city: string | null;
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
    .replace(/^[\s\-*.:|]+|[\s\-*.:€|xX@]+$/g, "")
    .slice(0, FIELD_LIMITS.receiptLineLabel)
    .trim();
  return (label.match(LETTERS)?.length ?? 0) >= MIN_LABEL_LETTERS ? label : null;
}

/**
 * A priced item line read off its text (PFA-219): a count before the label or
 * in the columns before the total, and the size printed in the label.
 */
function itemLine(rest: string, amount: number): ReceiptLine | null {
  const columns = splitColumns(rest.trimEnd(), amount);
  const label = cleanLabel(columns.label);
  if (!label) return null;
  const leading = splitLeadingCount(label);
  const size = readSize(leading.label);
  return {
    label: leading.label,
    amount,
    quantity: columns.quantity > 1 ? columns.quantity : leading.quantity,
    size: size?.size ?? null,
    sizeUnit: size?.unit ?? null,
    productType: null,
  };
}

/** A label priced by the quantity or weight line under it. */
function detailedLine(label: string, amount: number, weight: ItemSize | null): ReceiptLine {
  const leading = splitLeadingCount(label);
  const size = weight ?? readSize(leading.label);
  return {
    label: leading.label,
    amount,
    quantity: leading.quantity,
    size: size?.size ?? null,
    sizeUnit: size?.unit ?? null,
    productType: null,
  };
}

/** The street, or the postcode and city, this header line gives — the slip beside it left out. */
function readAddressPart(state: ParseState, raw: string): void {
  const part = raw
    .split("|")[0]
    .replace(/^[^\p{L}\d]+|[^\p{L}\d]+$/gu, "")
    .replaceAll(/\s+/g, " ")
    .trim();
  const normalized = normalize(part);
  const city = CITY.exec(part);
  if (state.street === null && STREET.test(normalized)) {
    // "8 AVENUE DU PARC 00000 VILLE": street and city on one line.
    state.street = city ? part.slice(0, city.index).trim() : part;
  }
  if (state.city === null && city) state.city = `${city[1]} ${city[2].trim()}`;
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
  // Name, then address, head the receipt: only looked for before the first item.
  if (state.lines.length === 0 && !price) {
    if (state.store === null) state.store = storeNameCandidate(line);
    else readAddressPart(state, line);
  }

  if (DETAIL_LINE.test(line)) {
    const detail = readQuantityDetail(line);
    const last = state.lines.at(-1);
    if (price && state.pendingLabel) {
      const priced = detailedLine(state.pendingLabel, price.amount, detail?.weight ?? null);
      state.lines.push(detail && !detail.weight ? { ...priced, quantity: detail.quantity } : priced);
    } else if (detail && !detail.weight && last && Math.abs(detail.quantity * detail.unitPrice - last.amount) < 0.011) {
      // "2 x 1,20" under an item already priced 2,40: its count.
      last.quantity = detail.quantity;
    }
    state.pendingLabel = null;
    return;
  }
  if (NOISE.test(normalize(line))) {
    state.pendingLabel = null;
    return;
  }

  if (price) {
    const item = itemLine(price.rest, price.amount);
    if (item) {
      state.lines.push(item);
      state.pendingLabel = null;
    }
    return;
  }
  const label = cleanLabel(line);
  if (label) state.pendingLabel = label;
}

export function parseReceiptText(text: string): ReceiptProposal {
  const state: ParseState = { lines: [], pendingLabel: null, store: null, street: null, city: null };
  let total: number | null = null;

  for (const raw of text.split(/\r?\n/)) {
    const normalized = normalize(raw);
    if (TOTAL_LINE.test(normalized) && !PARTIAL_TOTAL.test(normalized)) {
      total = readPrice(raw.trim())?.amount ?? null;
      break;
    }
    readLine(state, raw);
  }

  return { lines: state.lines, total, store: storeOf(state) };
}

/** The store read in the header: its name, and its address when found (PFA-219). */
function storeOf(state: ParseState): StoreIdentity | null {
  if (!state.store) return null;
  const address = [state.street, state.city].filter(Boolean).join(", ").slice(0, FIELD_LIMITS.storeAddress);
  return { name: state.store, address: address || null };
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
