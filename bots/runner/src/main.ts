import { pfaApp } from "@apps/pfa/pfaApp";
import { loadReceipts } from "@apps/pfa/receipts/receiptImages";
import { loadRunnerConfig } from "@core/config/runnerConfig";
import { createControlServer } from "@core/control/controlServer";
import { createRunner } from "@core/engine/bootstrap";
import { logger } from "@core/log/logger";

/**
 * The bot runner process: one app (PFA) for now. Boots with every bot stopped unless the kill
 * switch was on before the restart, and serves its control API on 127.0.0.1 only.
 */
async function main(): Promise<void> {
  const config = loadRunnerConfig(process.env);
  // Fails the boot if the fixed receipt set is not exactly what it must be.
  await loadReceipts();
  const runner = await createRunner(config, pfaApp(process.env));
  runner.resume();

  const server = createControlServer({ runner, token: config.controlToken });
  server.listen(config.controlPort, config.controlHost, () => {
    logger.info("control API listening", {
      host: config.controlHost,
      port: config.controlPort,
      running: runner.isRunning(),
    });
  });

  const shutdown = () => {
    server.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error: unknown) => {
  logger.error("runner failed to start", { error: String(error) });
  process.exit(1);
});
