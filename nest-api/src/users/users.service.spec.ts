import { ConflictException, ForbiddenException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { UsersService } from "./users.service";

/**
 * Unit tests for UsersService (PFA-12): the sign-in guards and the sign-up
 * defaults. Prisma is mocked; bcrypt runs for real at a low cost so the
 * password check is the genuine one.
 */
describe("UsersService", () => {
  const PASSWORD = "correct horse";

  const makeUser = (overrides: Record<string, unknown> = {}) => ({
    ID: "user-1",
    name: "Ada",
    email: "ada@example.com",
    password: bcrypt.hashSync(PASSWORD, 4),
    baseCurrency: "EUR",
    language: "fr",
    disabledAt: null,
    ...overrides,
  });

  const makeService = (users: Record<string, jest.Mock>) => {
    const prisma = { users } as unknown as never;
    return new UsersService(prisma);
  };

  describe("signIn", () => {
    it("rejects an unknown email", async () => {
      const service = makeService({ findUnique: jest.fn().mockResolvedValue(null) });
      await expect(service.signIn("nobody@example.com", PASSWORD)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects a wrong password", async () => {
      const service = makeService({ findUnique: jest.fn().mockResolvedValue(makeUser()) });
      await expect(service.signIn("ada@example.com", "wrong")).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("reveals a disabled account only to someone holding the password", async () => {
      const service = makeService({ findUnique: jest.fn().mockResolvedValue(makeUser({ disabledAt: new Date() })) });
      await expect(service.signIn("ada@example.com", "wrong")).rejects.toBeInstanceOf(UnauthorizedException);
      await expect(service.signIn("ada@example.com", PASSWORD)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("returns the public profile without the password hash", async () => {
      const service = makeService({ findUnique: jest.fn().mockResolvedValue(makeUser()) });
      expect(await service.signIn("ada@example.com", PASSWORD)).toEqual({
        user: { id: "user-1", name: "Ada", email: "ada@example.com", baseCurrency: "EUR", language: "fr" },
      });
    });
  });

  describe("addUser", () => {
    it("refuses an email already registered", async () => {
      const create = jest.fn();
      const service = makeService({ findUnique: jest.fn().mockResolvedValue(makeUser()), create });
      await expect(
        service.addUser({ name: "Ada", email: "ada@example.com", password: PASSWORD } as never),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(create).not.toHaveBeenCalled();
    });

    it("hashes the password, applies the defaults and flags synthetic accounts", async () => {
      const create = jest.fn().mockResolvedValue(undefined);
      const service = makeService({
        findUnique: jest.fn().mockResolvedValue(null),
        create,
        findUniqueOrThrow: jest.fn().mockResolvedValue(makeUser({ email: "bot@synthetic.test" })),
      });

      await service.addUser({ name: "Bot", email: "bot@synthetic.test", password: PASSWORD } as never);

      const { data } = create.mock.calls[0][0];
      expect(data).toMatchObject({ baseCurrency: "EUR", language: "fr", isSynthetic: true });
      expect(data.password).not.toBe(PASSWORD);
      expect(bcrypt.compareSync(PASSWORD, data.password)).toBe(true);
    });

    it("does not flag a regular email as synthetic", async () => {
      const create = jest.fn().mockResolvedValue(undefined);
      const service = makeService({
        findUnique: jest.fn().mockResolvedValue(null),
        create,
        findUniqueOrThrow: jest.fn().mockResolvedValue(makeUser()),
      });

      await service.addUser({ name: "Ada", email: "ada@example.com", password: PASSWORD } as never);

      expect(create.mock.calls[0][0].data.isSynthetic).toBe(false);
    });
  });
});
