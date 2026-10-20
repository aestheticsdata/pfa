import catalogConflict from "@components/prices/helpers/catalogConflict";
import { describe, expect, it } from "vitest";

const httpError = (status: number, data: unknown) => Object.assign(new Error("failed"), { response: { status, data } });

describe("catalogConflict", () => {
  it("names the entry a rename collided with", () => {
    expect(catalogConflict(httpError(409, { message: "exists", conflictID: "s-2" }))).toBe("s-2");
  });

  it("is null for an entry in use, another status, or no HTTP error", () => {
    expect(catalogConflict(httpError(409, { message: "Store is in use" }))).toBeNull();
    expect(catalogConflict(httpError(400, { conflictID: "s-2" }))).toBeNull();
    expect(catalogConflict(new Error("offline"))).toBeNull();
  });
});
