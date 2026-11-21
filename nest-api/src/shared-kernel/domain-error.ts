import type { DomainErrorKind } from "@shared-kernel/interfaces/sharedKernelTypes";

/**
 * What kind of rule a domain error broke (PFA-272). The domain names the kind; the HTTP edge picks
 * the status code, so business code never learns it runs behind HTTP.
 */
export const DOMAIN_ERROR_KIND = {
  notFound: "notFound",
  invalidInput: "invalidInput",
  conflict: "conflict",
  forbidden: "forbidden",
  unauthorized: "unauthorized",
} as const;

/**
 * A business rule said no. Subclasses name the rule (`GroupSpansSeveralDays`); the message is the
 * one the client already receives today, kept word for word.
 */
export abstract class DomainError extends Error {
  abstract readonly kind: DomainErrorKind;

  /** Extra fields of the response body, next to `message` (a conflict names what it collides with). */
  constructor(
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainError {
  readonly kind = DOMAIN_ERROR_KIND.notFound;
}

export class InvalidInputError extends DomainError {
  readonly kind = DOMAIN_ERROR_KIND.invalidInput;
}

export class ConflictError extends DomainError {
  readonly kind = DOMAIN_ERROR_KIND.conflict;
}

export class ForbiddenError extends DomainError {
  readonly kind = DOMAIN_ERROR_KIND.forbidden;
}

/** Who is asking is not established: unknown account, wrong password. */
export class UnauthorizedError extends DomainError {
  readonly kind = DOMAIN_ERROR_KIND.unauthorized;
}
