export function isBlockerActive(blocker: string | undefined): boolean {
  if (!blocker) return false;
  const t = blocker.trim().toLowerCase();
  return t !== "" && t !== "none" && t !== "—" && t !== "-" && t !== "无" && t !== "none.";
}
