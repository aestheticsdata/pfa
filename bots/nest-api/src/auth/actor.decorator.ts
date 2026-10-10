import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { clientIp, clientUserAgent } from "#app/infrastructure/client-ip.js";

import type { Request } from "express";
import type { AuditActor } from "#app/audit/interfaces/auditTypes.js";
import type { SessionUser } from "#app/auth/interfaces/authTypes.js";

/** Who is asking and from where: the shape every audited action takes. */
export const Actor = createParamDecorator((_data: unknown, context: ExecutionContext): AuditActor => {
  const request = context.switchToHttp().getRequest<Request & { user?: SessionUser }>();
  return { email: request.user?.email ?? "unknown", ip: clientIp(request), userAgent: clientUserAgent(request) };
});
