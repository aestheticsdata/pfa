import { isSyntheticEmail } from "./synthetic-email.util";

describe("isSyntheticEmail", () => {
  it("accepts the reserved domain, whatever the case", () => {
    expect(isSyntheticEmail("bot-1@synthetic.test")).toBe(true);
    expect(isSyntheticEmail("Bot-1@Synthetic.TEST")).toBe(true);
  });

  it("rejects real-looking and look-alike domains", () => {
    expect(isSyntheticEmail("someone@example.com")).toBe(false);
    expect(isSyntheticEmail("bot@notsynthetic.test")).toBe(false);
    expect(isSyntheticEmail("bot@x.synthetic.test")).toBe(false);
    expect(isSyntheticEmail("bot@synthetic.test.example.com")).toBe(false);
    expect(isSyntheticEmail("synthetic.test@example.com")).toBe(false);
  });

  it("rejects strings without a local part or domain", () => {
    expect(isSyntheticEmail("@synthetic.test")).toBe(false);
    expect(isSyntheticEmail("synthetic.test")).toBe(false);
    expect(isSyntheticEmail("")).toBe(false);
  });
});
