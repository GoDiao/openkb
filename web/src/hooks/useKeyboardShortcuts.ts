import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PROJECT_ROUTE_SHORTCUTS } from "../constants/projectShortcuts";

const GLOBAL_ROUTES: Record<string, string> = {
  h: "/help",
  p: "/",
};

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

export function useKeyboardShortcuts(enabled = true) {
  const navigate = useNavigate();
  const { slug = "" } = useParams();
  const pendingG = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return undefined;

    const clearPending = () => {
      pendingG.current = false;
      if (timer.current) window.clearTimeout(timer.current);
    };

    const handler = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "g") {
        pendingG.current = true;
        if (timer.current) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(clearPending, 900);
        return;
      }

      if (!pendingG.current) return;

      const key = e.key.toLowerCase();
      clearPending();

      if (!slug && GLOBAL_ROUTES[key]) {
        e.preventDefault();
        navigate(GLOBAL_ROUTES[key]);
        return;
      }

      if (!slug) return;

      if (key in PROJECT_ROUTE_SHORTCUTS) {
        e.preventDefault();
        const segment = PROJECT_ROUTE_SHORTCUTS[key];
        navigate(segment ? `/projects/${slug}/${segment}` : `/projects/${slug}`);
        return;
      }

      if (GLOBAL_ROUTES[key]) {
        e.preventDefault();
        navigate(GLOBAL_ROUTES[key]);
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      clearPending();
    };
  }, [enabled, navigate, slug]);
}
