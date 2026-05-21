import { useCallback, useEffect, useRef, useState } from "react";

export type ViewportState = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

const MIN_SCALE = 0.2;
const MAX_SCALE = 2.5;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function useRoadmapViewport(
  canvasWidth: number,
  canvasHeight: number,
  enabled: boolean,
) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<ViewportState>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const fitToView = useCallback(() => {
    const el = viewportRef.current;
    if (!el || canvasWidth <= 0 || canvasHeight <= 0) return;
    const pad = 24;
    const vw = el.clientWidth;
    const vh = el.clientHeight;
    const sx = (vw - pad * 2) / canvasWidth;
    const sy = (vh - pad * 2) / canvasHeight;
    const scale = clamp(Math.min(sx, sy, 1), MIN_SCALE, MAX_SCALE);
    setViewport({
      scale,
      offsetX: (vw - canvasWidth * scale) / 2,
      offsetY: (vh - canvasHeight * scale) / 2,
    });
  }, [canvasWidth, canvasHeight]);

  useEffect(() => {
    if (enabled) fitToView();
  }, [enabled, fitToView, canvasWidth, canvasHeight]);

  const zoomAt = useCallback((clientX: number, clientY: number, factor: number) => {
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    setViewport((prev) => {
      const newScale = clamp(prev.scale * factor, MIN_SCALE, MAX_SCALE);
      const wx = (mx - prev.offsetX) / prev.scale;
      const wy = (my - prev.offsetY) / prev.scale;
      return {
        scale: newScale,
        offsetX: mx - wx * newScale,
        offsetY: my - wy * newScale,
      };
    });
  }, []);

  const zoomBy = useCallback(
    (factor: number) => {
      const el = viewportRef.current;
      if (!el) return;
      zoomAt(el.clientWidth / 2, el.clientHeight / 2, factor);
    },
    [zoomAt],
  );

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!enabled) return;
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.08 : 1 / 1.08);
    },
    [enabled, zoomAt],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled || e.button !== 0) return;
      if ((e.target as HTMLElement).closest("[data-phase-node], [data-phase-detail]")) return;
      const el = viewportRef.current;
      if (!el) return;
      el.setPointerCapture(e.pointerId);
      dragRef.current = {
        x: e.clientX,
        y: e.clientY,
        ox: viewport.offsetX,
        oy: viewport.offsetY,
      };
      el.style.cursor = "grabbing";
    },
    [enabled, viewport.offsetX, viewport.offsetY],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    setViewport((prev) => ({
      ...prev,
      offsetX: drag.ox + (e.clientX - drag.x),
      offsetY: drag.oy + (e.clientY - drag.y),
    }));
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      dragRef.current = null;
      const el = viewportRef.current;
      if (el?.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      if (el) el.style.cursor = enabled ? "grab" : "default";
    },
    [enabled],
  );

  return {
    viewportRef,
    viewport,
    setViewport,
    fitToView,
    zoomIn: () => zoomBy(1.15),
    zoomOut: () => zoomBy(1 / 1.15),
    resetView: fitToView,
    onWheel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}
