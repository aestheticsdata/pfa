import { z } from "zod";

/**
 * `config/apps.json` (live mode, gitignored — copied by the deploy script): one entry per app the
 * back-office drives. Adding an app is one entry here, a theme block and a logo in the front, and
 * its adapter in the runner. The runner's token is never in the file, only the name of the env
 * variable holding it.
 */
export const appsFileSchema = z
  .array(
    z.object({
      id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/),
      name: z.string().min(1).max(64),
      host: z.string().min(1).max(64),
      theme: z
        .string()
        .regex(/^[a-z0-9-]+$/)
        .nullable()
        .default(null),
      timeZone: z.string().default("Europe/Paris"),
      runner: z.object({
        url: z.url().refine((url) => /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(url), {
          message: "The runner's control API is loopback-only",
        }),
        tokenEnv: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
      }),
      alertLogs: z.string().nullable().default(null),
      /** The app's `SYNTHETIC_ALLOWED_IPS`, shown in the panel's footer (informative only). */
      allowedIps: z.string().max(200).nullable().default(null),
    }),
  )
  .min(1);
