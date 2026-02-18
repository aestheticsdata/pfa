import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { JwtPayload } from "@spendings/guards/jwt-auth.guard";

export const GetUserId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
  return request.user.id;
});
