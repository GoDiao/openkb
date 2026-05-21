import { test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OPENKB = "openkb";
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../docs/assets/demo");

test.describe.configure({ mode: "serial" });

test.beforeAll(() => {
  fs.mkdirSync(OUT, { recursive: true });
});

test("capture hub demo screenshots", async ({ page }) => {
  test.setTimeout(120_000);

  await page.setViewportSize({ width: 1440, height: 900 });

  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  await page.screenshot({ path: path.join(OUT, "01-hub-projects.png"), fullPage: true });

  await page.goto(`/projects/${OPENKB}`);
  await page.waitForSelector('[data-testid="overview-progress-ring"]', { timeout: 30_000 });
  await page.screenshot({ path: path.join(OUT, "02-overview.png"), fullPage: true });

  await page.goto(`/projects/${OPENKB}/kanban`);
  await page.waitForSelector('[data-testid="kanban-column-todo"]', { timeout: 30_000 });
  await page.screenshot({ path: path.join(OUT, "03-kanban.png"), fullPage: true });

  await page.goto(`/projects/${OPENKB}/graph`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: path.join(OUT, "04-roadmap.png"), fullPage: true });
});
