import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

// E2E credentials (E2E_EMAIL / E2E_PASSWORD) — see .env.test.local.example
config({ path: ".env.test.local", quiet: true });

const AUTH_STATE = "e2e/.auth/user.json";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    locale: "fr-FR",
  },
  projects: [
    // Logs in once via the real UI and saves the session cookie for the other projects.
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    // Unauthenticated pages (login / signup render).
    {
      name: "public",
      testMatch: /public\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    // Authenticated pages, reusing the saved session.
    {
      name: "chromium",
      testIgnore: [/auth\.setup\.ts/, /public\.spec\.ts/],
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: AUTH_STATE },
    },
  ],
  // Reuses servers already running on :3000 / :6100 (dev workflow), starts them otherwise.
  // Prerequisites when starting from scratch: MySQL + Redis up, seed account created (see e2e/README.md).
  webServer: [
    {
      command: "pnpm dev",
      url: "http://localhost:3000",
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: "pnpm --dir ../nest-api start:dev",
      url: "http://localhost:6100/api/users/csrf",
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
