import { isServerActionRequest } from "@lib/proxy/serverAction";
import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

/**
 * Only here to turn away Server Action probes (PFA-233). This front has no Server Actions, so every
 * request carrying a `Next-Action` header is unwanted and never reaches Next, which would log each
 * one as an error. The matcher runs it on requests that carry that header and on nothing else, so
 * pages and assets never pass through it.
 */
const proxy = (request: NextRequest): NextResponse =>
  isServerActionRequest(request.headers) ? new NextResponse(null, { status: 400 }) : NextResponse.next();

export default proxy;

export const config = {
  matcher: [{ source: "/((?!_next/static|_next/image).*)", has: [{ type: "header", key: "next-action" }] }],
};
