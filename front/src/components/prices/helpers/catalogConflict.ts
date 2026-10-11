import { CatalogConflictSchema } from "@src/schemas/prices";
import { z } from "zod";

const HTTP_CONFLICT = 409;

// The request error of a rename onto an existing entry: a 409 naming it.
const ConflictErrorSchema = z.object({
  response: z.object({ status: z.literal(HTTP_CONFLICT), data: CatalogConflictSchema }),
});

/** The store or type a refused rename collided with, to merge into instead (PFA-224); null for any other error. */
const catalogConflict = (error: unknown) => {
  const parsed = ConflictErrorSchema.safeParse(error);
  return parsed.success ? parsed.data.response.data.conflictID : null;
};

export default catalogConflict;
