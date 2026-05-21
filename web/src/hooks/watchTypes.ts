export type WatchStatus = "idle" | "connecting" | "connected" | "reconnecting";

export function watchWebSocketUrl(slug: string) {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/api/projects/${slug}/watch`;
}
