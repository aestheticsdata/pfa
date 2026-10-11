import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

/** Strict outside production, tolerant in it — one switch for every response schema (PFA-177). */
const load = async (nodeEnv: string) => {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", nodeEnv);
  const { apiObject } = await import("@src/schemas/apiObject");
  return apiObject({ ID: z.string() });
};

describe("apiObject", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects a key the api added, in dev and in tests", async () => {
    for (const env of ["development", "test"]) {
      const schema = await load(env);
      expect(schema.safeParse({ ID: "a", added: 1 }).error?.issues[0]?.code).toBe("unrecognized_keys");
    }
  });

  it("strips a key the api added in production, never breaking the UI", async () => {
    const schema = await load("production");
    expect(schema.parse({ ID: "a", added: 1 })).toEqual({ ID: "a" });
  });

  it("still rejects a missing field in production", async () => {
    const schema = await load("production");
    expect(schema.safeParse({}).success).toBe(false);
  });
});
