import type { AuthResponseSchema, AuthUserSchema } from "@src/schemas/auth";
import type { z } from "zod";

// Inferred from the zod schemas so the runtime contract and the compile-time one
// can never drift apart. This stays the import site for the rest of the app
// (@auth/types); the schemas themselves live with the other API schemas.
export type AuthUser = z.infer<typeof AuthUserSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
