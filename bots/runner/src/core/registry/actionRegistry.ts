import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import type { BotAction } from "@core/interfaces/actionTypes";

const ACTION_FILE = /^[^_.][\w-]*\.(ts|js)$/;
const NOT_ACTION_FILE = /\.(spec|test|d)\.(ts|js)$/;

/**
 * Auto-discovery: every `*.ts` file of the folder is an action, except those starting with `_`
 * (the template) and tests. Each must `export default` a valid `BotAction`; a malformed one, or two
 * actions with the same name, stop the runner at boot rather than fail silently later.
 */
export async function loadActions<TPersona>(dir: string): Promise<BotAction<TPersona>[]> {
  const files = (await readdir(dir)).filter((file) => ACTION_FILE.test(file) && !NOT_ACTION_FILE.test(file)).sort();
  const actions: BotAction<TPersona>[] = [];
  for (const file of files) {
    const mod = (await import(pathToFileURL(join(dir, file)).href)) as { default?: unknown };
    actions.push(validateAction<TPersona>(mod.default, file));
  }
  const seen = new Set<string>();
  for (const action of actions) {
    if (seen.has(action.name)) {
      throw new Error(`Two actions are named "${action.name}"`);
    }
    seen.add(action.name);
  }
  return actions;
}

function validateAction<TPersona>(candidate: unknown, file: string): BotAction<TPersona> {
  const action = candidate as Partial<BotAction<TPersona>> | undefined;
  const valid =
    typeof action === "object" &&
    typeof action.name === "string" &&
    action.name !== "" &&
    typeof action.description === "string" &&
    typeof action.weight === "number" &&
    action.weight > 0 &&
    typeof action.run === "function" &&
    (action.canRun === undefined || typeof action.canRun === "function");
  if (!valid) {
    throw new Error(`${file} must export default a BotAction ({ name, description, weight > 0, run })`);
  }
  return action as BotAction<TPersona>;
}
