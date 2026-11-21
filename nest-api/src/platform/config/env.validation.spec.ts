import { validate } from "@config/env.validation";

/** The start-up check (PFA-264): a missing or malformed variable stops the boot, by name. */
describe("validate (environment)", () => {
  const base = {
    PORT: "6100",
    DATABASE_URL: "mysql://user:secret@localhost:3306/pfa",
    SESSION_SECRET: "a-session-secret-long-enough",
  };
  const production = {
    ...base,
    NODE_ENV: "production",
    PFA_INVOICES_IMAGES_PATH: "/srv/invoices",
    DB_USER: "backup",
    DB_PASSWORD: "secret",
    DB: "pfa",
    PFA_DUMP_PATH: "/srv/dumps",
    PFA_BACKUP_SERVER_PATH: "/srv/remote-dumps",
    PFA_BACKUP_SERVER_IP: "192.0.2.10",
    DEBIAN_OVH_VPS_SSH_USER: "backup",
    DEBIAN_OVH_VPS_SSH_KEY_PATH: "/srv/key",
    PFA_BACKUP_INVOICES_SERVER_PATH: "/srv/remote-invoices",
  };

  it("accepts a development environment without the production-only variables", () => {
    expect(validate(base)).toEqual(base);
  });

  it("accepts a complete production environment", () => {
    expect(validate(production)).toEqual(production);
  });

  it("names a missing required variable", () => {
    const { SESSION_SECRET: _omitted, ...withoutSecret } = base;
    expect(() => validate(withoutSecret)).toThrow(/SESSION_SECRET/);
  });

  it("names a production-only variable missing in production", () => {
    const { DB_USER: _omitted, ...withoutDbUser } = production;
    expect(() => validate(withoutDbUser)).toThrow(/DB_USER/);
  });

  it("refuses a malformed value", () => {
    expect(() => validate({ ...base, COOKIE_SECURE: "yes" })).toThrow(/COOKIE_SECURE/);
    expect(() => validate({ ...base, DATABASE_URL: "localhost:3306" })).toThrow(/DATABASE_URL/);
  });
});
