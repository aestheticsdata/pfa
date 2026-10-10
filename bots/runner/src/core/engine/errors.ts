/** The bot's account can't be used (disabled, purged, refused): stop retrying until a human looks. */
export class BotBlockedError extends Error {
  override name = "BotBlockedError";
}

/** The session is gone (expired, revoked): sign in again, then carry on. */
export class SessionExpiredError extends Error {
  override name = "SessionExpiredError";
}
