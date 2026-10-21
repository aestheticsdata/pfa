import {
  parseReceiptPages,
  parseReceiptText,
  pickProposal,
  storeNameCandidate,
} from "@spendings/receipt-lines/receipt-text-parser";

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

    expect(parseReceiptText(text)).toMatchObject({
      lines: [
        { label: "BAGUETTE TRADITION", amount: 1.2 },
        { label: "CAFE MOULU 250G", amount: 3.85 },
        { label: "CONFITURE ABRICOT", amount: 2.49 },
      ],
      total: 7.54,
      store: { name: "EPICERIE DES TILLEULS", address: "8 AVENUE DU PARC, 00000 VILLE" },
    });
  });

  it("prices a label from the quantity line under it", () => {
    const text = ["JUS D'ORANGE", "  3 x 1,10           3,30", "TOTAL 3,30"].join("\n");

    expect(parseReceiptText(text).lines).toMatchObject([{ label: "JUS D'ORANGE", amount: 3.3, quantity: 3 }]);
  });

  it("ignores a quantity line under an already priced item", () => {
    const text = ["EAU GAZEUSE 6X1L        2,40", "   2 x 1,20", "TOTAL 2,40"].join("\n");

    expect(parseReceiptText(text).lines).toMatchObject([
      // The count line under it is its quantity; the pack is its size (PFA-219).
      { label: "EAU GAZEUSE 6X1L", amount: 2.4, quantity: 2, size: 6, sizeUnit: "l" },
    ]);
  });

  it("prices a label from a weight line", () => {
    const text = ["TOMATES GRAPPE", "0,512 kg x 3,99 €/kg    2,04", "TOTAL 2,04"].join("\n");

    expect(parseReceiptText(text).lines).toMatchObject([
      { label: "TOMATES GRAPPE", amount: 2.04, quantity: 1, size: 0.512, sizeUnit: "kg" },
    ]);
  });

  it("keeps a discount as a negative line", () => {
    const text = ["SAVON LIQUIDE    4,50", "REMISE FIDELITE  -0,90", "TOTAL 3,60"].join("\n");

    expect(parseReceiptText(text).lines).toMatchObject([
      { label: "SAVON LIQUIDE", amount: 4.5 },
      { label: "REMISE FIDELITE", amount: -0.9 },
    ]);
  });

  it("drops the currency mark, the VAT code and dot leaders", () => {
    const text = ["RIZ BASMATI ........ 2,15 € A", "LENTILLES VERTES 1.89 1", "TOTAL 4,04"].join("\n");

    expect(parseReceiptText(text).lines).toMatchObject([
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

    expect(parseReceiptText(text)).toMatchObject({
      lines: [
        { label: "CAHIER A4", amount: 2.9 },
        { label: "STYLO BLEU", amount: 1.1 },
      ],
      total: 4,
    });
  });

  it("reads a price the OCR split after the decimal comma", () => {
    expect(parseReceiptText("MIEL 6, 40\nTOTAL 6, 40")).toMatchObject({
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

    expect(parseReceiptText(text)).toMatchObject({
      lines: [{ label: "FLACON 500ML", amount: 12.6, quantity: 3, size: 500, sizeUnit: "ml" }],
      total: 12.6,
    });
  });

  it("reads a VAT code in parentheses after the price, and a stray bar before it (PFA-217)", () => {
    const text = [
      "1 FIGUES SECHEES TURQUIE *   3.20 (01)",
      "1 FIGUES SECHEES TURQUIE * | 3,20 (01)",
      "Montant total éligible : 6.40 Euro",
      "TOTAL (Euro)                 6.40",
    ].join("\n");

    expect(parseReceiptText(text)).toMatchObject({
      lines: [
        // The count in front leaves the label (PFA-219).
        { label: "FIGUES SECHEES TURQUIE", amount: 3.2, quantity: 1 },
        { label: "FIGUES SECHEES TURQUIE", amount: 3.2, quantity: 1 },
      ],
      total: 6.4,
    });
  });

  it("reads nothing on a card-payment slip", () => {
    const text = ["CARTE BANCAIRE", "CB EXEMPLE", "No AUTO : 123456", "MONTANT :", "12,60 EUR", "DEBIT"].join("\n");

    expect(parseReceiptText(text)).toMatchObject({ lines: [], total: null });
  });

  it("finds nothing in a text with no priced line", () => {
    expect(parseReceiptText("MERCI DE VOTRE VISITE\nA BIENTOT")).toMatchObject({ lines: [], total: null });
  });

  it("leaves out amounts the column cannot hold and labels made of noise", () => {
    const text = ["CANAPE 3 PLACES  12999,00", "%% ~ 3,20", "PAIN 1,00"].join("\n");

    expect(parseReceiptText(text)).toMatchObject({ lines: [{ label: "PAIN", amount: 1 }], total: null });
  });
});

describe("store name (PFA-218)", () => {
  it("is the first header line that can be one, past address, phone and the person on duty", () => {
    const text = [
      "= ~",
      "Le Comptoir des Saisons",
      "Mme EXEMPLE",
      "4 rue des Lilas",
      "00000 VILLE",
      "TEL 00.00.00.00.00",
      "http://exemple.fr",
      "TICKET DE VENTE",
      "POIRES      2,40",
      "TOTAL       2,40",
    ].join("\n");

    expect(parseReceiptText(text).store).toEqual({
      name: "Le Comptoir des Saisons",
      address: "4 rue des Lilas, 00000 VILLE",
    });
  });

  it("leaves out the slip run into the same line", () => {
    expect(parseReceiptText("EPICERIE DU PARC | CARTE BANCAIRE\nPAIN 1,00").store).toEqual({
      name: "EPICERIE DU PARC",
      address: null,
    });
  });

  it("is not looked for once the items start", () => {
    expect(parseReceiptText("PAIN 1,00\nBOULANGERIE CENTRALE\nTOTAL 1,00").store).toBeNull();
  });

  it.each([
    "CARTE BANCAIRE",
    "Le 01/01/2026 a 10:00",
    "SIRET 000 000 000",
    "A0000000421010",
    "LCL",
  ])("%s is no store name", (line) => {
    expect(storeNameCandidate(line)).toBeNull();
  });

  it("comes from a receipt slip, never from the card slip beside it", () => {
    const card = "CARTE BANCAIRE\nPRIMEUR DU MARCHE\nMONTANT :\n2,40 EUR";
    const receipt = "Primeur du Marché\nPOIRES 2,40\nTOTAL 2,40";
    expect(parseReceiptPages([card, receipt]).store?.name).toBe("Primeur du Marché");
  });
});

describe("parseReceiptPages", () => {
  it("takes the items of every slip and the first total found", () => {
    expect(parseReceiptPages(["THE VERT 3,10\nTOTAL 3,10", "CARTE BANCAIRE\nMONTANT :\n3,10 EUR"])).toMatchObject({
      store: null,
      lines: [{ label: "THE VERT", amount: 3.1 }],
      total: 3.1,
    });
  });
});

describe("pickProposal", () => {
  const lines = (...amounts: number[]) =>
    amounts.map((amount, i) => ({
      label: `ITEM ${i}`,
      amount,
      quantity: 1,
      size: null,
      sizeUnit: null,
      productType: null,
    }));

  it("prefers lines adding up to the total over more lines", () => {
    const addsUp = { lines: lines(1.2, 3.85), total: 5.05, store: null };
    const more = { lines: lines(1.2, 3.85, 9), total: 5.05, store: null };
    expect(pickProposal([more, addsUp])).toBe(addsUp);
  });

  it("then a found total, then the most lines", () => {
    const withTotal = { lines: lines(2), total: 9, store: null };
    const noTotal = { lines: lines(2, 3), total: null, store: null };
    expect(pickProposal([noTotal, withTotal])).toBe(withTotal);
    expect(pickProposal([{ lines: lines(1), total: null, store: null }, noTotal])).toBe(noTotal);
  });

  it("keeps the first reading on a tie, and has an empty proposal for none", () => {
    const first = { lines: lines(1), total: null, store: null };
    expect(pickProposal([first, { lines: lines(2), total: null, store: null }])).toBe(first);
    expect(pickProposal([])).toEqual({ lines: [], total: null, store: null });
  });
});
