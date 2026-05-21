import path from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { E2E_AGENT, E2E_SANDBOX_SLUG, openkbRoot, runOpenkb } from "./helpers/e2eSandbox";

const OPENKB_DOGFOOD = "openkb";
const ROOT = openkbRoot();

/** dnd-kit PointerSensor needs pointer move >6px, not HTML5 dragTo. */
async function pointerDragToColumn(page: Page, card: Locator, column: Locator) {
  await card.scrollIntoViewIfNeeded();
  await column.scrollIntoViewIfNeeded();

  const src = await card.boundingBox();
  const tgt = await column.boundingBox();
  if (!src || !tgt) throw new Error("Kanban drag: missing bounding box");

  const startX = src.x + src.width / 2;
  const startY = src.y + src.height / 2;
  const endX = tgt.x + tgt.width / 2;
  const endY = tgt.y + 80;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 12, startY + 12, { steps: 4 });
  await page.mouse.move(endX, endY, { steps: 30 });
  await page.mouse.up();
}

test.describe("Hub basics", () => {
  test("theme persists after reload", async ({ page }) => {
    await page.goto(`/projects/${E2E_SANDBOX_SLUG}/kanban`);
    await page.waitForSelector('[data-testid="kanban-column-todo"]', { timeout: 15_000 });

    const themeBtn = page.getByRole("button", { name: /Choose theme|选择主题/i });
    await themeBtn.click();
    await page.getByRole("option", { name: /Ocean|海蓝/i }).click();

    const theme = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(theme).toBe("ocean");

    await page.reload();
    await page.waitForSelector('[data-testid="kanban-column-todo"]');

    const themeAfter = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(themeAfter).toBe("ocean");
  });

  test("kanban drag moves task between columns", async ({ page }) => {
    await page.goto(`/projects/${E2E_SANDBOX_SLUG}/kanban`);
    await page.waitForSelector('[data-testid="kanban-column-backlog"]', { timeout: 15_000 });

    const backlog = page.getByTestId("kanban-column-backlog");
    const todo = page.getByTestId("kanban-column-todo");
    const card = backlog.locator('[data-testid^="task-card-"]').first();

    if ((await card.count()) === 0) {
      test.skip(true, "No tasks in backlog to drag");
      return;
    }

    const taskTestId = await card.getAttribute("data-testid");
    expect(taskTestId).toBeTruthy();

    const moveDone = page.waitForResponse(
      (r) => r.url().includes("/tasks/") && r.url().includes("/move") && r.ok(),
      { timeout: 10_000 },
    );

    await pointerDragToColumn(page, card, todo);
    await moveDone;

    await expect(todo.locator(`[data-testid="${taskTestId}"]`)).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("CLI ↔ UI sync", () => {
  test("cli done moves task to done column within 3s", async ({ page, request }) => {
    const title = `E2E sync ${Date.now()}`;
    const createRes = await request.post(`/api/projects/${E2E_SANDBOX_SLUG}/tasks`, {
      data: { title, priority: "P3" },
    });
    expect(createRes.ok()).toBeTruthy();
    const task = (await createRes.json()).task as { id: string };

    const checkoutRes = await request.post(
      `/api/projects/${E2E_SANDBOX_SLUG}/tasks/${task.id}/checkout`,
      { data: { agent_id: E2E_AGENT } },
    );
    expect(checkoutRes.ok()).toBeTruthy();

    await expect
      .poll(async () => {
        const boardRes = await request.get(`/api/projects/${E2E_SANDBOX_SLUG}/board`);
        const doing = (await boardRes.json()).doing as { id: string }[];
        return doing.some((t) => t.id === task.id);
      })
      .toBe(true);

    await page.goto(`/projects/${E2E_SANDBOX_SLUG}/kanban`);
    await page.waitForSelector('[data-testid="kanban-column-doing"]', { timeout: 15_000 });

    runOpenkb(`done ${task.id} --project ${E2E_SANDBOX_SLUG} --json`);

    const doneCol = page.getByTestId("kanban-column-done");
    await expect(doneCol.locator(`[data-testid="task-card-${task.id}"]`)).toBeVisible({ timeout: 5000 });
  });

  test("cli done clears active task and adds recent done on overview", async ({ page, request }) => {
    const title = `E2E state sync ${Date.now()}`;
    const createRes = await request.post(`/api/projects/${E2E_SANDBOX_SLUG}/tasks`, {
      data: { title, priority: "P3" },
    });
    const task = (await createRes.json()).task as { id: string };

    await request.post(`/api/projects/${E2E_SANDBOX_SLUG}/tasks/${task.id}/checkout`, {
      data: { agent_id: E2E_AGENT },
    });

    await page.goto(`/projects/${E2E_SANDBOX_SLUG}`);
    await expect(page.getByRole("heading", { name: /Project state|项目状态/i })).toBeVisible({
      timeout: 15_000,
    });

    runOpenkb(`done ${task.id} --project ${E2E_SANDBOX_SLUG} --json`);

    await expect
      .poll(
        async () => {
          const res = await request.get(`/api/projects/${E2E_SANDBOX_SLUG}/state`);
          return (await res.json()).state.now.active_task as string;
        },
        { timeout: 3500 },
      )
      .toBe("none");

    await page.reload();
    await expect(page.locator("aside dl dd").first()).toHaveText("none", { timeout: 10_000 });

    const recentBtn = page.locator("aside").getByRole("button", { name: /Recent done|最近完成/i });
    await recentBtn.click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 3500 });
  });
});

test.describe("Hub docs", () => {
  test("spec and plan pages render repo_path markdown", async ({ page }) => {
    await page.goto(`/projects/${OPENKB_DOGFOOD}/spec`);
    await expect(page.getByRole("heading", { name: /OpenKB Design Spec/i })).toBeVisible({
      timeout: 15_000,
    });

    await page.goto(`/projects/${OPENKB_DOGFOOD}/plan`);
    await expect(page.getByText(/Repository Foundation|Phase 0/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("missing plan path shows doc error panel", async ({ page }) => {
    const slug = "e2e-doc-error";
    const repo = path.join(ROOT, "web", "e2e-fixtures", "empty-repo");
    try {
      runOpenkb(`project create --slug ${slug} --name "E2E Doc Error" --repo-path ${repo} --json`);
    } catch {
      // project already exists from a prior run
    }
    runOpenkb(
      `project set-docs --project ${slug} --spec docs/missing-spec-e2e.md --plan docs/missing-plan-e2e.md --json`,
    );

    await page.goto(`/projects/${slug}/plan`);
    await expect(page.getByRole("heading", { name: /Cannot load Plan|无法加载计划/i })).toBeVisible({
      timeout: 15_000,
    });
  });
});
