import { parseAlertLine } from "#app/incidents/alert-line.js";

const line = (fields: Record<string, unknown>) =>
  JSON.stringify({ "log.level": "warn", "@timestamp": "2026-10-10T12:48:04.956Z", ...fields });

describe("parseAlertLine", () => {
  it("reads a refused bot sign-in: email, address, agent, path", () => {
    const alert = parseAlertLine(
      line({
        "event.action": "synthetic-foreign-ip",
        "user.name": "Ceres@synthetic.test",
        "client.ip": "203.0.113.9",
        "user_agent.original": "curl/8.4.0",
        "url.path": "/api/users",
      }),
    );
    expect(alert).toEqual({
      account: "ceres@synthetic.test",
      userId: null,
      ip: "203.0.113.9",
      userAgent: "curl/8.4.0",
      path: "/api/users",
      at: new Date("2026-10-10T12:48:04.956Z"),
    });
  });

  it("names a stolen session by its user id when no email is on the line", () => {
    const alert = parseAlertLine(
      line({ "event.action": "synthetic-foreign-ip", "user.id": "abc-123", "client.ip": "198.51.100.4" }),
    );
    expect(alert?.account).toBe("user:abc-123");
  });

  it("ignores every other line, malformed ones included", () => {
    expect(parseAlertLine(line({ "event.action": "user-login", "client.ip": "1.2.3.4" }))).toBeNull();
    expect(parseAlertLine("PM2 | App [pfa-nest-api:39] online")).toBeNull();
    expect(parseAlertLine('{"event.action":"synthetic-foreign-ip"')).toBeNull();
    expect(
      parseAlertLine(line({ "event.action": "synthetic-foreign-ip", "user.name": "x@synthetic.test" })),
    ).toBeNull();
  });
});
