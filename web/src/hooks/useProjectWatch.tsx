import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useInvalidateProjectSync } from "./useInvalidateProjectSync";

const WatchContext = createContext(false);

export function useWatchConnected() {
  return useContext(WatchContext);
}

function watchWebSocketUrl(slug: string) {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/api/projects/${slug}/watch`;
}

function useProjectWatchInner(slug: string) {
  const invalidate = useInvalidateProjectSync(slug);
  const invalidateRef = useRef(invalidate);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    invalidateRef.current = invalidate;
  }, [invalidate]);

  useEffect(() => {
    if (!slug) return undefined;

    let active = true;
    let socket: WebSocket | null = null;
    let retryTimer: number | undefined;

    const connect = () => {
      if (!active) return;
      socket = new WebSocket(watchWebSocketUrl(slug));

      socket.onopen = () => {
        if (!active) return;
        setConnected(true);
      };

      socket.onmessage = () => {
        invalidateRef.current();
      };

      socket.onclose = () => {
        if (!active) return;
        setConnected(false);
        retryTimer = window.setTimeout(connect, 3000);
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    connect();

    return () => {
      active = false;
      if (retryTimer) window.clearTimeout(retryTimer);
      socket?.close();
      setConnected(false);
    };
  }, [slug]);

  return connected;
}

export function ProjectWatchProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const connected = useProjectWatchInner(slug);
  const value = useMemo(() => connected, [connected]);
  return <WatchContext.Provider value={value}>{children}</WatchContext.Provider>;
}
