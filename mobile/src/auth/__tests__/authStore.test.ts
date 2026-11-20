import { AUTH_STATUS, useAuth } from "@auth/authStore";
import { readToken } from "@auth/tokenStore";

describe("auth store", () => {
  beforeEach(async () => {
    await useAuth.getState().signOut();
  });

  it("boots signed out without a stored token", async () => {
    await useAuth.getState().boot();
    expect(useAuth.getState().status).toBe(AUTH_STATUS.signedOut);
  });

  it("opens unlocked right after a sign-in, and keeps the token in the secure store", async () => {
    await useAuth.getState().signIn("tok-1");
    expect(useAuth.getState().status).toBe(AUTH_STATUS.unlocked);
    await expect(readToken()).resolves.toBe("tok-1");
  });

  it("boots locked when a token is stored: a returning user unlocks first", async () => {
    await useAuth.getState().signIn("tok-1");
    await useAuth.getState().boot();
    expect(useAuth.getState().status).toBe(AUTH_STATUS.locked);
  });

  it("only locks an unlocked app", () => {
    useAuth.getState().lock();
    expect(useAuth.getState().status).toBe(AUTH_STATUS.signedOut);
  });

  it("forgets the token on sign-out", async () => {
    await useAuth.getState().signIn("tok-1");
    await useAuth.getState().signOut();
    expect(useAuth.getState().status).toBe(AUTH_STATUS.signedOut);
    await expect(readToken()).resolves.toBeNull();
  });
});
