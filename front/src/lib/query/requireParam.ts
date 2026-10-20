/**
 * A query's required input, asserted inside its fetcher (PFA-253): the factory's `enabled` keeps
 * the query idle while it is null, so reaching this with null is a bug, not a state.
 */
export const requireParam = <Value>(value: Value | null | undefined, name: string): Value => {
  if (value === null || value === undefined) throw new Error(`Query run without its ${name}`);
  return value;
};
