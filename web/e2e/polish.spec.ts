import { expect, test } from "@playwright/test";
import { E2E_SANDBOX_SLUG } from "./helpers/e2eSandbox";

const OPENKB = "openkb";

async function pressGoShortcut(page: import("@playwright/test").Page, letter: string) {
  await page.keyboard.press("g");
  await page.keyboard.press(letter);
}

async function waitForProjectReady(page: import("@playwright/test").Page) {
  await page.waitForSelector('[data-testid="overview-progress-ring"], [data-testid="kanban-column-todo"]', {
    timeout: 25_000,
  });
}

test.describe("Keyboard shortcuts & a11y", () => {
  test("g+k navigates to kanban from overview", async ({ page }) => {
    await page.goto(`/projects/${E2E_SANDBOX_SLUG}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-testid="overview-progress-ring"]', { timeout: 25_000 });
    await pressGoShortcut(page, "k");
    await expect(page).toHaveURL(new RegExp(`/projects/${E2E_SANDBOX_SLUG}/kanban$`));
  });

  test("Ctrl+/ opens shortcuts help modal", async ({ page }) => {
    await page.goto(`/projects/${E2E_SANDBOX_SLUG}`);
    await waitForProjectReady(page);
    await page.keyboard.press("Control+/");
    await expect(page.getByTestId("shortcuts-help-modal")).toBeVisible();
    await expect(page.getByRole("dialog", { name: /Keyboard shortcuts|键盘快捷键/i })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("shortcuts-help-modal")).toBeHidden();
  });

  test("project tabs expose aria-keyshortcuts", async ({ page }) => {
    await page.goto(`/projects/${E2E_SANDBOX_SLUG}/kanban`);
    await page.waitForSelector('[data-testid="kanban-column-todo"]', { timeout: 20_000 });

    const kanbanTab = page.locator('a[href$="/kanban"]').first();
    await expect(kanbanTab).toHaveAttribute("aria-keyshortcuts", "g k");

    const specTab = page.locator(`a[href="/projects/${E2E_SANDBOX_SLUG}/spec"]`).first();
    await expect(specTab).toHaveAttribute("aria-keyshortcuts", "g s");
  });
});

test.describe("Live sync badge", () => {
  test("shows connected status on project pages", async ({ page }) => {
    await page.goto(`/projects/${E2E_SANDBOX_SLUG}`);
    const badge = page.getByTestId("watch-status-badge");
    await expect(badge).toBeVisible({ timeout: 25_000 });
    await expect(badge).toHaveAttribute("role", "status");
    await expect
      .poll(async () => badge.innerText(), { timeout: 25_000 })
      .toMatch(/Live sync|实时同步|Connecting|连接中/i);
  });
});

test.describe("Overview charts", () => {
  test("progress ring and board chart render on overview", async ({ page }) => {
    await page.goto(`/projects/${OPENKB}`);
    await expect(page.getByTestId("overview-progress-ring")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("overview-board-chart")).toBeVisible();
    await expect(page.getByTestId("overview-board-bar-todo")).toBeVisible();
  });

  test("roadmap section lazy-mounts when scrolled into view", async ({ page }) => {
    await page.goto(`/projects/${OPENKB}`);
    await page.waitForSelector('[data-testid="overview-progress-ring"]', { timeout: 20_000 });

    const lazyHost = page.getByTestId("overview-roadmap-lazy");
    if ((await lazyHost.count()) === 0) {
      test.skip(true, "Project has no roadmap section");
      return;
    }

    await lazyHost.scrollIntoViewIfNeeded();
    await expect(lazyHost.locator("svg, canvas, [data-testid]").first()).toBeVisible({
      timeout: 25_000,
    });
  });
});
