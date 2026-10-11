import type { z } from "zod";

/** Stands in for a key the user chose — a category name, a year — rather than one the schema declares. */
export const REDACTED_KEY = "<key>";

/** The fields of a zod definition this walk reads; the rest of `_zod.def` is left alone. */
interface WalkedDef {
  type: string;
  shape?: Record<string, z.core.$ZodType>;
  element?: z.core.$ZodType;
  valueType?: z.core.$ZodType;
  innerType?: z.core.$ZodType;
  in?: z.core.$ZodType;
  out?: z.core.$ZodType;
}

const WRAPPERS = new Set(["nullable", "optional", "default", "prefault", "nonoptional", "readonly", "catch"]);

const defOf = (schema: z.core.$ZodType) => schema._zod.def as WalkedDef;

/** Down to the schema that actually owns the next path segment. */
const unwrap = (schema: z.core.$ZodType) => {
  let node = schema;
  for (;;) {
    const def = defOf(node);
    if (WRAPPERS.has(def.type) && def.innerType) {
      node = def.innerType;
    } else if (def.type === "pipe" && def.in && def.out) {
      // A preprocess is pipe(transform → schema), a transform is pipe(schema → transform):
      // either way the side that is not the transform is the one with a shape.
      node = defOf(def.in).type === "transform" ? def.out : def.in;
    } else {
      return node;
    }
  }
};

/**
 * A zod issue path, safe to report (PFA-177).
 *
 * Keys the schema declares are field names and stay; indices stay; every other key is data — a
 * `z.record` keyed by the user's category names — and is replaced by `REDACTED_KEY`. Anything the
 * walk cannot place is redacted too: when in doubt, the path loses precision, never privacy.
 */
export const redactIssuePath = (schema: z.core.$ZodType, path: readonly PropertyKey[]) => {
  const safe: PropertyKey[] = [];
  let node: z.core.$ZodType | undefined = schema;

  for (const segment of path) {
    const def = node ? defOf(unwrap(node)) : undefined;

    if (def?.type === "object" && typeof segment === "string" && def.shape && segment in def.shape) {
      safe.push(segment);
      node = def.shape[segment];
    } else if (def?.type === "array" && typeof segment === "number") {
      safe.push(segment);
      node = def.element;
    } else if (def?.type === "record") {
      safe.push(REDACTED_KEY);
      node = def.valueType;
    } else {
      safe.push(typeof segment === "number" ? segment : REDACTED_KEY);
      node = undefined;
    }
  }

  return safe;
};
