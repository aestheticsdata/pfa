import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

/**
 * The portfolio demo run: it films the back-office, it tests nothing.
 *
 * One worker, no retries (half a retried take is worse than no take), a long timeout because the
 * run deliberately spends most of its time waiting, and the take at the exact viewport size, so no
 * scaling ever touches the picture. The setup signs in and saves the session, so the film opens on
 * the app picker rather than on a password.
 */
config({ path: ".env.test.local", quiet: true });

const STORAGE_STATE = "e2e/.auth/demo.json";

/** 1080p by default: native, 16:9, and nothing upscales on the way to a landing page. */
const viewport = {
  width: Number(process.env.DEMO_WIDTH ?? 1920),
  height: Number(process.env.DEMO_HEIGHT ?? 1080),
};

/**
 * Renders at twice the resolution and lets the encoder downsample into the same frame: crisper
 * text, for CPU. `DEMO_SCALE=1` is the way out if a slow machine drops frames.
 */
const deviceScaleFactor = Number(process.env.DEMO_SCALE ?? 2);

const chrome = {
  ...devices["Desktop Chrome"],
  viewport,
  deviceScaleFactor,
  // Every time on screen is formatted in the browser (`LocalTime`): pinned to the mock's own zone,
  // so the quiet hours and the clocks agree whatever machine films it.
  locale: "en-GB",
  timezoneId: "Europe/Paris",
  launchOptions: {
    headless: process.env.DEMO_HEADED !== "1",
    args: ["--force-color-profile=srgb", "--hide-scrollbars"],
  },
};

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/demo/preflight.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 8 * 60_000,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3014",
    trace: "off",
    // Off unless asked for: the CDP recorder in `e2e/demo/recorder.ts` captures the same screencast
    // without the 25fps ceiling, and running both would have two clients acking the same frames.
    video: process.env.DEMO_RECORDER === "playwright" ? { mode: "on" as const, size: viewport } : ("off" as const),
  },
  projects: [
    { name: "setup", testMatch: /demo\/demo\.setup\.ts/, use: chrome },
    {
      name: "demo",
      testMatch: /demo\/.*\.demo\.ts/,
      dependencies: ["setup"],
      use: { ...chrome, storageState: STORAGE_STATE },
    },
  ],
});
