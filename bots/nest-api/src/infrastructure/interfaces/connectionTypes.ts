/** Where a request came from, as the account routes and the audit log take it. */
export interface RequestConnection {
  ip: string | null;
  userAgent: string | null;
}
