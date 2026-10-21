/** The value a test just looked up, or a failure naming what was missing — never a `!` (PFA-262). */
export function defined<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) {
    throw new Error(`Expected ${what} to exist`);
  }
  return value;
}
