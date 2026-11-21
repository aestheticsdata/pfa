/** Ends every live session of an account (PFA-279); sessions live in Redis. */
export abstract class SessionRevoker {
  abstract revokeAll(accountId: string): Promise<void>;
}
