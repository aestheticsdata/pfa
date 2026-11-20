import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  NotFoundException,
} from "@nestjs/common";
import { DOMAIN_ERROR_KIND, DomainError } from "@shared-kernel/domain-error";
import type { DomainErrorKind } from "@shared-kernel/interfaces/sharedKernelTypes";

const HTTP_EXCEPTION_BY_KIND: Record<DomainErrorKind, new (message: string) => HttpException> = {
  [DOMAIN_ERROR_KIND.notFound]: NotFoundException,
  [DOMAIN_ERROR_KIND.invalidInput]: BadRequestException,
  [DOMAIN_ERROR_KIND.conflict]: ConflictException,
  [DOMAIN_ERROR_KIND.forbidden]: ForbiddenException,
};

/**
 * A domain error as the HTTP exception the route used to throw itself (PFA-272): same status, same
 * body, same message — the move of a rule into the domain changes nothing a client can see.
 * Anything else passes through untouched.
 */
export function toHttpException(exception: unknown): unknown {
  if (!(exception instanceof DomainError)) return exception;
  const translated = new HTTP_EXCEPTION_BY_KIND[exception.kind](exception.message);
  translated.stack = exception.stack;
  return translated;
}
