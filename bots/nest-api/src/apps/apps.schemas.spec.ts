import { appsFileSchema } from "#app/apps/apps.schemas.js";

const entry = (url: string) => [
  { id: "pfa", name: "pfa", host: "ks-b", runner: { url, tokenEnv: "PFA_RUNNER_TOKEN" } },
];

describe("apps.json", () => {
  it("only accepts a runner on loopback, and never a token in the file", () => {
    expect(appsFileSchema.safeParse(entry("http://127.0.0.1:7300")).success).toBe(true);
    expect(appsFileSchema.safeParse(entry("http://10.0.4.12:7300")).success).toBe(false);
    expect(appsFileSchema.safeParse(entry("https://bots.example.com")).success).toBe(false);
    const withToken = [{ ...entry("http://127.0.0.1:7300")[0], runner: { url: "http://127.0.0.1:7300", token: "x" } }];
    expect(appsFileSchema.safeParse(withToken).success).toBe(false);
  });
});
