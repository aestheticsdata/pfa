import type { SessionUser } from "@contexts/identity/domain/interfaces/identityTypes";
import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const GetUserId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<{ user: SessionUser }>();
  return request.user.id;
});
