import { defineConfig, devices } from "@playwright/test";
import { loadEnvFile } from "node:process";
import { resolve } from "node:path";

loadEnvFile(resolve(import.meta.dirname, "../apps/server/.env.local"));

const desktopAuthState = resolve(import.meta.dirname, ".auth/admin-desktop.json");
const mobileAuthState = resolve(import.meta.dirname, ".auth/admin-mobile.json");

/** See https://playwright.dev/docs/test-configuration. */
export default defineConfig({
  testDir: "./e2e",
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: "http://localhost:3001",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "login-desktop",
      testMatch: /login\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "login-mobile",
      testMatch: /login\.setup\.ts/,
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Desktop Chrome",
      testIgnore: /login\.setup\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: desktopAuthState },
      dependencies: ["login-desktop"],
    },
    {
      name: "Mobile Chrome",
      testIgnore: /login\.setup\.ts/,
      use: { ...devices["Pixel 5"], storageState: mobileAuthState },
      dependencies: ["login-mobile"],
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "cd .. && bun run dev",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
  },
});
