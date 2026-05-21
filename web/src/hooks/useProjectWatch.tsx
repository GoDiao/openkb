import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useI18n } from "../i18n/I18nProvider";
import { useToast } from "../components/ui/ToastProvider";
import { useInvalidateProjectSync } from "./useInvalidateProjectSync";
import { type WatchStatus, watchWebSocketUrl } from "./watchTypes";

type WatchContextValue = {
  status: WatchStatus;
};

const WatchContext = createContext<WatchContextValue>({ status: "idle" });

export function useWatchStatus() {
  return useContext(WatchContext).status;
}

export type { WatchStatus } from "./watchTypes";

/** @deprecated use useWatchStatus() === "connected" */
export function useWatchConnected() {
  return useWatchStatus() === "connected";
}

function useProjectWatchInner(slug: string): WatchStatus {
  const { t } = useI18n();
  const { pushToast } = useToast();
  const invalidate = useInvalidateProjectSync(slug);
  const invalidateRef = useRef(invalidate);
  const pushToastRef = useRef(pushToast);
  const tRef = useRef(t);
  const pendingKinds = useRef<Set<string>>(new Set());
  const toastTimer = useRef<number | undefined>(undefined);
  const hadConnection = useRef(false);
  const [status, setStatus] = useState<WatchStatus>("idle");

  useEffect(() => {
    invalidateRef.current = invalidate;
  }, [invalidate]);

  useEffect(() => {
    pushToastRef.current = pushToast;
    tRef.current = t;
  }, [pushToast, t]);

  useEffect(() => {
    if (!slug) {
      setStatus("idle");
      return undefined;
    }

    let active = true;
    let socket: WebSocket | null = null;
    let retryTimer: number | undefined;

    const flushToast = () => {
      const kinds = [...pendingKinds.current];
      pendingKinds.current.clear();
      if (kinds.length === 0) return;

      let message: string;
      if (kinds.length === 1) {
        const kind = kinds[0];
        if (kind === "board") message = tRef.current("watch.toastBoard");
        else if (kind === "state") message = tRef.current("watch.toastState");
        else if (kind === "roadmap") message = tRef.current("watch.toastRoadmap");
        else message = tRef.current("watch.toastSync");
      } else {
        message = tRef.current("watch.toastSync");
      }
      pushToastRef.current(message, "sync");
    };

    const queueToast = (kinds: string[]) => {
      for (const kind of kinds) pendingKinds.current.add(kind);
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(flushToast, 450);
    };

    const connect = () => {
      if (!active) return;
      setStatus(hadConnection.current ? "reconnecting" : "connecting");
      socket = new WebSocket(watchWebSocketUrl(slug));

      socket.onopen = () => {
        if (!active) return;
        if (hadConnection.current) {
          pushToastRef.current(tRef.current("watch.toastReconnected"), "info");
        }
        hadConnection.current = true;
        setStatus("connected");
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(String(event.data)) as { kinds?: string[] };
          if (Array.isArray(data.kinds) && data.kinds.length > 0) {
            queueToast(data.kinds);
          }
        } catch {
          queueToast(["board", "state", "roadmap"]);
        }
        invalidateRef.current();
      };

      socket.onclose = () => {
        if (!active) return;
        if (hadConnection.current) {
          setStatus("reconnecting");
          pushToastRef.current(tRef.current("watch.toastReconnecting"), "info");
        } else {
          setStatus("connecting");
        }
        retryTimer = window.setTimeout(connect, 3000);
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    connect();

    return () => {
      active = false;
      hadConnection.current = false;
      if (retryTimer) window.clearTimeout(retryTimer);
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      socket?.close();
      setStatus("idle");
    };
  }, [slug]);

  return status;
}

export function ProjectWatchProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const status = useProjectWatchInner(slug);
  const value = useMemo(() => ({ status }), [status]);
  return <WatchContext.Provider value={value}>{children}</WatchContext.Provider>;
}
