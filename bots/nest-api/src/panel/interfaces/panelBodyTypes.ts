import type { z } from "zod";
import type {
  bulkSchema,
  closeAccountSchema,
  enabledSchema,
  runningSchema,
  targetSchema,
} from "#app/panel/panel.schemas.js";
import type { unsubscribeSchema } from "#app/push/push.schemas.js";

export type RunningBody = z.infer<typeof runningSchema>;
export type TargetBody = z.infer<typeof targetSchema>;
export type EnabledBody = z.infer<typeof enabledSchema>;
export type BulkBody = z.infer<typeof bulkSchema>;
export type CloseAccountBody = z.infer<typeof closeAccountSchema>;
export type UnsubscribeBody = z.infer<typeof unsubscribeSchema>;

/** `/apps/:app/bots/:bot…` */
export interface BotRoute {
  app: string;
  bot: string;
}

/** `/apps/:app/actions/:action` */
export interface ActionRoute {
  app: string;
  action: string;
}
