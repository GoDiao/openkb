import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const ROOT = path.resolve("..");
const WEB_PORT = 5175;
const API_PORT = 8788;
const cacheDir = process.env.UV_CACHE_DIR ?? path.join(ROOT, ".uv-cache");
const playwrightBrowsersPath =
  process.env.PLAYWRIGHT_BROWSERS_PATH ?? path.join(ROOT, ".playwright-browsers");

process.env.PLAYWRIGHT_BROWSERS_PATH = playwrightBrowsersPath;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://127.0.0.1:${WEB_PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: `uv run openkb serve --port ${API_PORT}`,
      cwd: ROOT,
      url: `http://127.0.0.1:${API_PORT}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        ...process.env,
        OPENKB_ROOT: process.env.OPENKB_ROOT ?? ROOT,
        OPENKB_SERVE_PORT: String(API_PORT),
        UV_CACHE_DIR: cacheDir,
      },
    },
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${WEB_PORT}`,
      url: `http://127.0.0.1:${WEB_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
