import { RedisService } from "./redis.service";

/**
 * A Redis outage must be a condition the API reports, not one it dies of (IKN-2): without an
 * `error` listener on the client, the socket error node-redis emits when the server goes away
 * is an unhandled 'error' event — and that kills the process before /api/health can ever
 * answer 503.
 */
describe("RedisService", () => {
  it("survives an error event on the client instead of crashing the process", () => {
    const service = new RedisService();

    expect(() => {
      service.getClient().emit("error", new Error("connection lost"));
    }).not.toThrow();
  });
});
