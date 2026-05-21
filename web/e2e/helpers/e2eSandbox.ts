import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export const E2E_SANDBOX_SLUG = "e2e-sandbox";
export const E2E_AGENT = "e2e-sync-agent";

export function openkbRoot() {
  return process.env.OPENKB_ROOT ?? path.resolve("..");
}

export function runOpenkb(args: string, root = openkbRoot()) {
  const shell = process.platform === "win32";
  try {
    execSync(`uv run openkb ${args}`, {
      cwd: root,
      shell,
      env: {
        ...process.env,
        OPENKB_ROOT: root,
        OPENKB_AGENT_ID: E2E_AGENT,
        UV_CACHE_DIR: process.env.UV_CACHE_DIR ?? path.join(root, ".uv-cache"),
      },
      stdio: "pipe",
      encoding: "utf-8",
    });
  } catch (err) {
    const e = err as { stderr?: string; stdout?: string; message?: string };
    throw new Error(e.stderr || e.stdout || e.message || String(err));
  }
}

export function sandboxBoardRoot(root = openkbRoot()) {
  return path.join(root, "workspace", "projects", E2E_SANDBOX_SLUG, "board");
}

/** Remove all task cards from the E2E sandbox (never touch the openkb dogfood board). */
export function wipeSandboxBoard(root = openkbRoot()) {
  const boardRoot = sandboxBoardRoot(root);
  if (!fs.existsSync(boardRoot)) return;

  for (const col of ["backlog", "todo", "doing", "review", "done"]) {
    const dir = path.join(boardRoot, col);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (file.endsWith(".md")) {
        fs.unlinkSync(path.join(dir, file));
      }
    }
  }
}

export function ensureE2eSandbox(root = openkbRoot()) {
  const projectDir = path.join(root, "workspace", "projects", E2E_SANDBOX_SLUG);
  const repo = path.join(root, "web", "e2e-fixtures", "sandbox-repo");

  if (!fs.existsSync(projectDir)) {
    runOpenkb(
      `project create --slug ${E2E_SANDBOX_SLUG} --name "E2E Sandbox" --repo-path ${repo} --json`,
      root,
    );
  }

  wipeSandboxBoard(root);
  runOpenkb(`task create --title "E2E drag seed" --priority P3 --project ${E2E_SANDBOX_SLUG} --json`, root);
}

/** Legacy: remove probe tasks accidentally created on the openkb project before sandbox existed. */
export function cleanupLegacyOpenkbProbes(root = openkbRoot()) {
  const boardRoot = path.join(root, "workspace", "projects", "openkb", "board");
  if (!fs.existsSync(boardRoot)) return;

  for (const col of ["backlog", "todo", "doing", "review", "done"]) {
    const dir = path.join(boardRoot, col);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (/e2e-(sync|state-sync)/i.test(file)) {
        fs.unlinkSync(path.join(dir, file));
      }
    }
  }
}
