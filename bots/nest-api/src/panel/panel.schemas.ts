import { z } from "zod";
import { BOT_VIEW_STATE, LOAD_PACE, POPULATION } from "#app/contracts/panel.js";

const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM, 24 h (00:00–23:59)");
const id = z.string().min(1).max(64);

export const targetSchema = z.object({ target: z.number().int().min(0).max(500) });
export const rampSchema = z.object({
  step: z.number().int().min(1).max(500),
  everySec: z.number().int().min(1).max(3600),
});
export const loadPaceSchema = z.object({ pace: z.enum([LOAD_PACE.daily, LOAD_PACE.burst]) });
export const quietHoursSchema = z
  .object({ from: clock, to: clock })
  .refine((hours) => hours.from !== hours.to, { message: "From and To must differ" });
export const enabledSchema = z.object({ enabled: z.boolean() });
export const bulkSchema = z.object({ ids: z.array(id).min(1).max(1000), enabled: z.boolean() });
export const closeAccountSchema = z.object({ purge: z.boolean() });

export const botsQuerySchema = z.object({
  population: z.enum([POPULATION.all, POPULATION.daily, POPULATION.load]).default(POPULATION.all),
  state: z.enum(["all", ...Object.values(BOT_VIEW_STATE)]).default("all"),
  q: z.string().max(100).default(""),
  page: z.coerce.number().int().min(0).default(0),
});
