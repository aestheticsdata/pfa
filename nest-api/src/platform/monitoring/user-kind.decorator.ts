import type { UserKind } from "@monitoring/interfaces/monitoringTypes";
import { USER_KIND } from "@monitoring/user-kind";
import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

/**
 * Whether the signed-in user is a person or a synthetic bot, for the business metrics (PFA-212).
 * Read from the session, where sign-in records it — no query per request.
 */
export const GetUserKind = createParamDecorator((_data: unknown, ctx: ExecutionContext): UserKind => {
  const request = ctx.switchToHttp().getRequest<Request>();
  const isSynthetic = (request.session as { isSynthetic?: boolean } | undefined)?.isSynthetic;
  return isSynthetic ? USER_KIND.synthetic : USER_KIND.real;
});
