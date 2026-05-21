const BASE = "/api";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type BoardColumn = "backlog" | "todo" | "doing" | "review" | "done";
export type Priority = "P0" | "P1" | "P2" | "P3";

export type Project = {
  slug: string;
  name: string;
  repo_path: string;
  description: string;
  status: "active" | "archived";
  default_branch: string;
  lock_ttl_hours: number;
  created: string;
};

export type Task = {
  id: string;
  slug: string;
  title: string;
  status: BoardColumn;
  priority: Priority;
  assignee: string;
  branch: string;
  created: string;
  updated: string;
  locked_by: string;
  locked_at: string;
  lock_expires: string;
  tags: string[];
  related_files: string[];
  goal: string;
  acceptance: string[];
  context: string;
  notes: string;
};

export type Board = Record<BoardColumn, Task[]>;

export type StateNow = {
  active_task: string;
  owner: string;
  branch: string;
  blocker: string;
};

export type StatePayload = {
  now: StateNow;
  summary: string;
  next_items: string[];
  recent_done: string[];
  decisions: string[];
  watch_out: string[];
  last_updated: string;
  updated_by: string;
};

export type StateResponse = { state: StatePayload };
export type TaskResponse = { task: Task };

export const BOARD_COLUMNS: BoardColumn[] = ["backlog", "todo", "doing", "review", "done"];
