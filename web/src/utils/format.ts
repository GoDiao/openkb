export const LOCK_EXPIRING_SOON_MS = 30 * 60 * 1000;

export function lockMsRemaining(expires: string): number | null {
  if (!expires) return null;
  const ms = new Date(expires).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return ms;
}

export function lockRemaining(expires: string, expiredLabel = "Expired"): string | null {
  const ms = lockMsRemaining(expires);
  if (ms === null) return null;
  if (ms <= 0) return expiredLabel;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function lockExpiringSoon(expires: string, thresholdMs = LOCK_EXPIRING_SOON_MS): boolean {
  const ms = lockMsRemaining(expires);
  return ms !== null && ms > 0 && ms < thresholdMs;
}
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
