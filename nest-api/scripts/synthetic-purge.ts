/**
 * Deletes every synthetic account (PFA-122) and everything it owns: spendings,
 * spending groups, recurrings, dashboards, exceptionals, categories and its
 * invoices folder. Real accounts are never touched — an account is purged only
 * when it is flagged `isSynthetic` AND its email is on the reserved domain.
 *
 *   pnpm synthetic:purge              # delete
 *   pnpm synthetic:purge -- --dry-run # count only
 *
 * NOTE: a standalone tool, not app code — it imports the gitignored generated
 * Prisma client by relative path, like scripts/seed.ts.
 *
 * See docs/synthetic-users.md.
 */

import { readFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { join, resolve } from "node:path";

// --- inline .env loader (dotenv is not installed), same as scripts/seed.ts ---
function loadEnv(): void {
  const raw = readFileSync(resolve(__dirname, "..", ".env"), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const value = m[2].replace(/^["']|["']$/g, "");
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}
loadEnv();

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";
import { SYNTHETIC_ACCOUNTS_WHERE, isSyntheticEmail } from "../src/users/synthetic-email.util";

function makePrisma(): PrismaClient {
  const parsed = new URL(process.env.DATABASE_URL as string);
  // Force IPv4: the mariadb driver resolves "localhost" to ::1, where MySQL isn't listening locally.
  const host = parsed.hostname === "localhost" ? "127.0.0.1" : parsed.hostname;
  const adapter = new PrismaMariaDb({
    host,
    port: parseInt(parsed.port || "3306", 10),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace("/", ""),
    connectionLimit: 5,
    allowPublicKeyRetrieval: true,
  });
  return new PrismaClient({ adapter });
}

/** Same folder rule as the API (`app.config.ts`): the env override, else `invoicesUpload/`. */
const invoicesDir = (userID: string) =>
  join(process.env.PFA_INVOICES_IMAGES_PATH ?? resolve(__dirname, "..", "invoicesUpload"), userID);

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const prisma = makePrisma();
  try {
    const accounts = await prisma.users.findMany({
      where: SYNTHETIC_ACCOUNTS_WHERE,
      select: { ID: true, email: true },
    });
    // Second check outside SQL: the collation or a LIKE quirk must never widen the match.
    const stray = accounts.filter((a) => !isSyntheticEmail(a.email));
    if (stray.length > 0) {
      throw new Error(`Refusing to purge: ${stray.length} matched account(s) outside the synthetic domain.`);
    }

    const ids = accounts.map((a) => a.ID);
    console.log(`${accounts.length} synthetic account(s)${dryRun ? " — dry run, nothing deleted" : ""}.`);
    if (dryRun || ids.length === 0) return;

    const owned = { userID: { in: ids } };
    const [spendings, groups, recurrings, dashboards, exceptionals, categories, users] = await prisma.$transaction([
      // Spendings first: they reference groups and categories.
      prisma.spendings.deleteMany({ where: owned }),
      prisma.spendingGroups.deleteMany({ where: owned }),
      prisma.recurrings.deleteMany({ where: owned }),
      prisma.dashboards.deleteMany({ where: owned }),
      prisma.exceptionals.deleteMany({ where: owned }),
      prisma.categories.deleteMany({ where: owned }),
      prisma.users.deleteMany({ where: { ...SYNTHETIC_ACCOUNTS_WHERE, ID: { in: ids } } }),
    ]);
    for (const id of ids) await rm(invoicesDir(id), { recursive: true, force: true });

    console.log(
      `  deleted: users=${users.count} spendings=${spendings.count} groups=${groups.count} ` +
        `recurrings=${recurrings.count} dashboards=${dashboards.count} exceptionals=${exceptionals.count} ` +
        `categories=${categories.count} invoiceFolders=${ids.length}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
