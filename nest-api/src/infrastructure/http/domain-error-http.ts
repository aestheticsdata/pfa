import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { DOMAIN_ERROR_KIND, DomainError } from "@shared-kernel/domain-error";
import type { DomainErrorKind } from "@shared-kernel/interfaces/sharedKernelTypes";

const HTTP_EXCEPTION_BY_KIND: Record<DomainErrorKind, new (response: string | object) => HttpException> = {
  [DOMAIN_ERROR_KIND.notFound]: NotFoundException,
  [DOMAIN_ERROR_KIND.invalidInput]: BadRequestException,
  [DOMAIN_ERROR_KIND.conflict]: ConflictException,
  [DOMAIN_ERROR_KIND.forbidden]: ForbiddenException,
  [DOMAIN_ERROR_KIND.unauthorized]: UnauthorizedException,
};

/**
 * A domain error as the HTTP exception the route used to throw itself (PFA-272): same status, same
 * body, same message — the move of a rule into the domain changes nothing a client can see.
 * Anything else passes through untouched.
 */
export function toHttpException(exception: unknown): unknown {
  if (!(exception instanceof DomainError)) return exception;
  // With details, the body is `{ message, ...details }` — what `new ConflictException({ … })` sent.
  const response = exception.details ? { message: exception.message, ...exception.details } : exception.message;
  const translated = new HTTP_EXCEPTION_BY_KIND[exception.kind](response);
  translated.stack = exception.stack;
  return translated;
}
