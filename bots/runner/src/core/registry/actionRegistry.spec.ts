import { copyFile, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadActions } from "@core/registry/actionRegistry";
import { describe, expect, it } from "vitest";

const PFA_ACTIONS = fileURLToPath(new URL("../../apps/pfa/actions", import.meta.url));

describe("action registry", () => {
  it("discovers PFA's actions, and ignores the template", async () => {
    const names = (await loadActions(PFA_ACTIONS)).map((action) => action.name).sort();
    expect(names).toEqual(["dashboard.view", "receipt.upload", "spending.add", "statistics.view"]);
  });

  it("picks up a new action made from the template, with no other change", async () => {
    const dir = await mkdtemp(join(tmpdir(), "actions-"));
    await copyFile(join(PFA_ACTIONS, "_template.ts"), join(dir, "_template.ts"));
    const template = await readFile(join(PFA_ACTIONS, "_template.ts"), "utf8");
    await writeFile(join(dir, "addRecurring.ts"), template.replace('"feature.verb"', '"recurring.add"'));

    const names = (await loadActions(dir)).map((action) => action.name);
    expect(names).toEqual(["recurring.add"]);
  });

  it("stops the boot on a malformed action or a duplicate name", async () => {
    const bad = await mkdtemp(join(tmpdir(), "actions-"));
    await writeFile(join(bad, "broken.ts"), "export default { name: 'x', weight: 0 };\n");
    await expect(loadActions(bad)).rejects.toThrow(/must export default a BotAction/);

    const twice = await mkdtemp(join(tmpdir(), "actions-"));
    const action = "export default { name: 'same', description: 'd', weight: 1, run: async () => {} };\n";
    await writeFile(join(twice, "one.ts"), action);
    await writeFile(join(twice, "two.ts"), action);
    await expect(loadActions(twice)).rejects.toThrow(/Two actions are named "same"/);
  });
});
