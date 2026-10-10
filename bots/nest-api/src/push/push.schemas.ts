import { z } from "zod";

export const subscriptionSchema = z.object({
  endpoint: z.url().max(500).startsWith("https://"),
  keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
});

export const unsubscribeSchema = z.object({ endpoint: z.string().max(500) });
