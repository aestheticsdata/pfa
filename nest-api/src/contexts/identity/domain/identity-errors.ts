import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from "@shared-kernel/domain-error";

// Messages kept word for word: they are what the client has always received.

export class UnknownAccount extends UnauthorizedError {
  constructor() {
    super("User does not exist");
  }
}

export class InvalidCredentials extends UnauthorizedError {
  constructor() {
    super("Invalid credentials");
  }
}

export class AccountDisabled extends ForbiddenError {
  constructor() {
    super("Account disabled");
  }
}

export class EmailTaken extends ConflictError {
  constructor() {
    super("Email already exists");
  }
}

/** The session names an account that is gone. */
export class SessionAccountGone extends UnauthorizedError {
  constructor() {
    super("User not found");
  }
}

/** Not a bot's email, or no such bot: the back-office never touches anything else. */
export class UnknownSyntheticAccount extends NotFoundError {
  constructor() {
    super("Unknown synthetic account");
  }
}
