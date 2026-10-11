import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * What reaches Iknos (PFA-212): the release on every event, and the three Core Web Vitals as info
 * lines that neither the error budget nor the dedupe can swallow.
 */
const posted = (fetchMock: ReturnType<typeof vi.fn>) =>
  fetchMock.mock.calls.flatMap(
    ([, init]) => (JSON.parse((init as RequestInit).body as string) as { events: Record<string, unknown>[] }).events,
  );

const load = async (release?: string) => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_IKNOS_INGEST_URL", "https://iknos.test/api/ingest");
  vi.stubEnv("NEXT_PUBLIC_IKNOS_INGEST_TOKEN", "token");
  vi.stubEnv("NEXT_PUBLIC_IKNOS_SERVICE", "pfa-front");
  if (release) vi.stubEnv("NEXT_PUBLIC_APP_RELEASE", release);
  return import("@lib/report");
};

describe("report", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock = vi.fn(() => Promise.resolve(new Response()));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { pathname: "/dashboard" } });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("stamps the release on an error", async () => {
    const { report } = await load("3fad3b7");

    report({ message: "TypeError: boom" });
    vi.runAllTimers();

    expect(posted(fetchMock)).toEqual([
      expect.objectContaining({ "log.level": "error", message: "TypeError: boom", "service.version": "3fad3b7" }),
    ]);
  });

  it("leaves the release out when the build has none", async () => {
    const { report } = await load();

    report({ message: "TypeError: boom" });
    vi.runAllTimers();

    expect(posted(fetchMock)[0]).not.toHaveProperty(["service.version"]);
  });

  it("sends LCP, INP and CLS as info lines, and nothing else", async () => {
    const { reportWebVital } = await load("3fad3b7");

    for (const name of ["LCP", "INP", "CLS", "FCP", "TTFB"]) {
      reportWebVital({ name, value: 1, rating: "good", id: `v-${name}` });
    }
    vi.runAllTimers();

    const events = posted(fetchMock);
    expect(events.map((e) => (e.web_vital as { name: string }).name)).toEqual(["LCP", "INP", "CLS"]);
    expect(events[0]).toMatchObject({
      "log.level": "info",
      message: "web vital LCP",
      "service.version": "3fad3b7",
      web_vital: { name: "LCP", value: 1, rating: "good", id: "v-LCP" },
    });
  });

  it("keeps vitals out of the error budget and the dedupe", async () => {
    const { report, reportWebVital } = await load();

    for (let i = 0; i < 60; i += 1) report({ message: `error ${i}` });
    reportWebVital({ name: "LCP", value: 1200, id: "a" });
    reportWebVital({ name: "LCP", value: 900, id: "b" });
    vi.runAllTimers();

    const vitals = posted(fetchMock).filter((e) => e.web_vital);
    expect(vitals).toHaveLength(2);
  });
});
