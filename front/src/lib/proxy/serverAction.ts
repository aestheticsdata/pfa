/**
 * The header a Server Action call carries its id in. This front has no Server Actions, so a request
 * naming one is never ours: it is a scanner's probe (PFA-233).
 */
const ACTION_HEADER = "next-action";

export const isServerActionRequest = (headers: Headers): boolean => headers.has(ACTION_HEADER);
