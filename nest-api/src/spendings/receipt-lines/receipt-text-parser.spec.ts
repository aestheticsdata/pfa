import { parseReceiptPages, parseReceiptText, pickProposal } from "@spendings/receipt-lines/receipt-text-parser";

/**
 * PFA-214 — the shapes below are invented receipts, written after the layouts
 * French tills print: items with a trailing price, quantity and weight details,
 * discounts, VAT codes, then the totals / payment block.
 */
describe("parseReceiptText", () => {
  it("reads item lines up to the total, and the total itself", () => {
    const text = [
      "EPICERIE DES TILLEULS",
      "8 AVENUE DU PARC 00000 VILLE",
      "",
      "BAGUETTE TRADITION        1,20",
      "CAFE MOULU 250G           3,85",
      "CONFITURE ABRICOT         2,49",
      "TOTAL                     7,54",
      "CB                        7,54",
      "TVA 5,5%                  0,39",
    ].join("\n");

    expect(parseReceiptText(text)).toEqual({
      lines: [
        { label: "BAGUETTE TRADITION", amount: 1.2 },
        { label: "CAFE MOULU 250G", amount: 3.85 },
        { label: "CONFITURE ABRICOT", amount: 2.49 },
      ],
      total: 7.54,
    });
  });

  it("prices a label from the quantity line under it", () => {
    const text = ["JUS D'ORANGE", "  3 x 1,10           3,30", "TOTAL 3,30"].join("\n");

    expect(parseReceiptText(text).lines).toEqual([{ label: "JUS D'ORANGE", amount: 3.3 }]);
  });

  it("ignores a quantity line under an already priced item", () => {
    const text = ["EAU GAZEUSE 6X1L        2,40", "   2 x 1,20", "TOTAL 2,40"].join("\n");

    expect(parseReceiptText(text).lines).toEqual([{ label: "EAU GAZEUSE 6X1L", amount: 2.4 }]);
  });

  it("prices a label from a weight line", () => {
    const text = ["TOMATES GRAPPE", "0,512 kg x 3,99 €/kg    2,04", "TOTAL 2,04"].join("\n");

    expect(parseReceiptText(text).lines).toEqual([{ label: "TOMATES GRAPPE", amount: 2.04 }]);
  });

  it("keeps a discount as a negative line", () => {
    const text = ["SAVON LIQUIDE    4,50", "REMISE FIDELITE  -0,90", "TOTAL 3,60"].join("\n");

    expect(parseReceiptText(text).lines).toEqual([
      { label: "SAVON LIQUIDE", amount: 4.5 },
      { label: "REMISE FIDELITE", amount: -0.9 },
    ]);
  });

  it("drops the currency mark, the VAT code and dot leaders", () => {
    const text = ["RIZ BASMATI ........ 2,15 € A", "LENTILLES VERTES 1.89 1", "TOTAL 4,04"].join("\n");

    expect(parseReceiptText(text).lines).toEqual([
      { label: "RIZ BASMATI", amount: 2.15 },
      { label: "LENTILLES VERTES", amount: 1.89 },
    ]);
  });

  it("skips sub-totals and payment chatter, and finds the total under another name", () => {
    const text = [
      "CAHIER A4         2,90",
      "STYLO BLEU        1,10",
      "SOUS-TOTAL        4,00",
      "NET A PAYER       4,00",
      "ESPECES           5,00",
      "RENDU             1,00",
    ].join("\n");

    expect(parseReceiptText(text)).toEqual({
      lines: [
        { label: "CAHIER A4", amount: 2.9 },
        { label: "STYLO BLEU", amount: 1.1 },
      ],
      total: 4,
    });
  });

  it("reads a price the OCR split after the decimal comma", () => {
    expect(parseReceiptText("MIEL 6, 40\nTOTAL 6, 40")).toEqual({
      lines: [{ label: "MIEL", amount: 6.4 }],
      total: 6.4,
    });
  });

  it("drops the quantity and unit-price columns from a label (PFA-216)", () => {
    const text = [
      "Produit            Qté  A régler  Total",
      "LOTION DOUCE",
      "FLACON 500ML        3    4,20    12,60",
      "Total TTC en EUR             12,60",
    ].join("\n");

    expect(parseReceiptText(text)).toEqual({ lines: [{ label: "FLACON 500ML", amount: 12.6 }], total: 12.6 });
  });

  it("reads nothing on a card-payment slip", () => {
    const text = ["CARTE BANCAIRE", "CB EXEMPLE", "No AUTO : 123456", "MONTANT :", "12,60 EUR", "DEBIT"].join("\n");

    expect(parseReceiptText(text)).toEqual({ lines: [], total: null });
  });

  it("finds nothing in a text with no priced line", () => {
    expect(parseReceiptText("MERCI DE VOTRE VISITE\nA BIENTOT")).toEqual({ lines: [], total: null });
  });

  it("leaves out amounts the column cannot hold and labels made of noise", () => {
    const text = ["CANAPE 3 PLACES  12999,00", "%% ~ 3,20", "PAIN 1,00"].join("\n");

    expect(parseReceiptText(text)).toEqual({ lines: [{ label: "PAIN", amount: 1 }], total: null });
  });
});

describe("parseReceiptPages", () => {
  it("takes the items of every slip and the first total found", () => {
    expect(parseReceiptPages(["THE VERT 3,10\nTOTAL 3,10", "CARTE BANCAIRE\nMONTANT :\n3,10 EUR"])).toEqual({
      lines: [{ label: "THE VERT", amount: 3.1 }],
      total: 3.1,
    });
  });
});

describe("pickProposal", () => {
  const lines = (...amounts: number[]) => amounts.map((amount, i) => ({ label: `ITEM ${i}`, amount }));

  it("prefers lines adding up to the total over more lines", () => {
    const addsUp = { lines: lines(1.2, 3.85), total: 5.05 };
    const more = { lines: lines(1.2, 3.85, 9), total: 5.05 };
    expect(pickProposal([more, addsUp])).toBe(addsUp);
  });

  it("then a found total, then the most lines", () => {
    const withTotal = { lines: lines(2), total: 9 };
    const noTotal = { lines: lines(2, 3), total: null };
    expect(pickProposal([noTotal, withTotal])).toBe(withTotal);
    expect(pickProposal([{ lines: lines(1), total: null }, noTotal])).toBe(noTotal);
  });

  it("keeps the first reading on a tie, and has an empty proposal for none", () => {
    const first = { lines: lines(1), total: null };
    expect(pickProposal([first, { lines: lines(2), total: null }])).toBe(first);
    expect(pickProposal([])).toEqual({ lines: [], total: null });
  });
});
