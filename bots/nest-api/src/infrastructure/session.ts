import { RedisStore } from "connect-redis";
import session from "express-session";
import { RedisService, SESSION_PREFIX, SESSION_TTL_SECONDS } from "#app/redis/redis.service.js";

import type { RequestHandler } from "express";

export const SESSION_COOKIE = "bots.sid";

/**
 * Redis-backed sessions. The API is only reached by the back-office's own Next server on
 * 127.0.0.1, which relays the cookie both ways and mints the browser's copy itself (Secure,
 * HttpOnly, SameSite=Lax); this hop is plain HTTP on loopback, hence `secure: false` here.
 */
export function sessionMiddleware(redis: RedisService, secret: string): RequestHandler {
  return session({
    name: SESSION_COOKIE,
    store: new RedisStore({ client: redis.getClient(), prefix: SESSION_PREFIX, ttl: SESSION_TTL_SECONDS }),
    secret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { httpOnly: true, secure: false, sameSite: "lax", maxAge: SESSION_TTL_SECONDS * 1000 },
  });
}
