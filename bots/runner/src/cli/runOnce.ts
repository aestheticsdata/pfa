import { pfaApp } from "@apps/pfa/pfaApp";
import { loadRunnerConfig } from "@core/config/runnerConfig";
import { createRunner } from "@core/engine/bootstrap";

/**
 * Dev tool: one visit of one bot, now, whatever the kill switch says — every other guard (synthetic
 * domain, caps, upload budget, fixed receipts) still applies.
 *
 *   pnpm bot:once -- saturnus 5
 */
async function main(): Promise<void> {
  const [botId = "saturnus", actions = "4"] = process.argv.slice(2).filter((arg) => arg !== "--");
  const runner = await createRunner(loadRunnerConfig(process.env), pfaApp(process.env));
  await runner.runWake(botId, { actions: Number(actions), thinkTimeMs: 500, force: true });
  console.log(
    JSON.stringify(
      runner.snapshotBots().find((bot) => bot.id === botId),
      null,
      2,
    ),
  );
  console.log(JSON.stringify(runner.snapshotActions(), null, 2));
}

void main();
