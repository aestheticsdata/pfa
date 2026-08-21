import { buildInvoiceUploadFormData } from "@components/spendings/services/invoiceUploadFormData";
import { describe, expect, it } from "vitest";

const file = new File(["x"], "receipt.png", { type: "image/png" });

describe("buildInvoiceUploadFormData", () => {
  it("builds the spending upload body with the file as the last part", () => {
    const formData = buildInvoiceUploadFormData(
      { ID: "s-1", itemType: "spending", label: "lunch", userID: "u-1", date: "2026-08-21" },
      file,
    );

    // Order matters server-side: the text fields must precede the file part.
    expect([...formData.keys()]).toEqual(["userID", "itemType", "date", "label", "spendingID", "invoiceImageUpload"]);
    expect(formData.get("itemType")).toBe("spending");
    expect(formData.get("date")).toBe("2026-08-21");
    expect(formData.get("spendingID")).toBe("s-1");
    expect(formData.get("invoiceImageUpload")).toBe(file);
  });

  it("uses dateFrom instead of date for a recurring", () => {
    const formData = buildInvoiceUploadFormData(
      { ID: "r-1", itemType: "recurring", label: "rent", userID: "u-1", dateFrom: "2026-08-01" },
      file,
    );

    expect(formData.get("itemType")).toBe("recurring");
    expect(formData.get("dateFrom")).toBe("2026-08-01");
    expect(formData.get("date")).toBeNull();
  });
});
