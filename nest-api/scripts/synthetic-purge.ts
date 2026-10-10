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
import { resolve } from "node:path";

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
import { purgeSyntheticAccounts } from "../src/users/synthetic-purge.util";

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
const invoicesPath = process.env.PFA_INVOICES_IMAGES_PATH ?? resolve(__dirname, "..", "invoicesUpload");

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

    console.log(`${accounts.length} synthetic account(s)${dryRun ? " — dry run, nothing deleted" : ""}.`);
    if (dryRun || accounts.length === 0) return;

    const deleted = await purgeSyntheticAccounts(prisma, accounts, invoicesPath);
    console.log(
      `  deleted: users=${deleted.users} spendings=${deleted.spendings} groups=${deleted.groups} ` +
        `recurrings=${deleted.recurrings} dashboards=${deleted.dashboards} exceptionals=${deleted.exceptionals} ` +
        `categories=${deleted.categories} invoiceFolders=${accounts.length}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
