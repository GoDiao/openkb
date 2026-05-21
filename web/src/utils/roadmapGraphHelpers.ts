import type { ViewportState } from "../hooks/useRoadmapViewport";
import type { NodeLayout, RoadmapLayout } from "./roadmapLayout";

export function relatedPhaseIds(selectedId: string, edges: RoadmapLayout["edges"]): Set<string> {
  const related = new Set<string>([selectedId]);
  for (const edge of edges) {
    if (edge.from === selectedId) related.add(edge.to);
    if (edge.to === selectedId) related.add(edge.from);
  }
  return related;
}

export function leaderLineEndpoints(
  node: NodeLayout,
  viewport: ViewportState,
  popover: { x: number; y: number; w: number; h: number },
): { x1: number; y1: number; x2: number; y2: number } {
  const nodeCenterY = viewport.offsetY + (node.y + node.height / 2) * viewport.scale;
  const nodeRight = viewport.offsetX + (node.x + node.width) * viewport.scale;
  const nodeLeft = viewport.offsetX + node.x * viewport.scale;
  const popoverCenterY = popover.y + popover.h / 2;
  const popoverOnRight = popover.x >= nodeRight - 4;

  if (popoverOnRight) {
    return {
      x1: nodeRight,
      y1: nodeCenterY,
      x2: popover.x,
      y2: popoverCenterY,
    };
  }
  return {
    x1: nodeLeft,
    y1: nodeCenterY,
    x2: popover.x + popover.w,
    y2: popoverCenterY,
  };
}

export type MinimapMetrics = {
  width: number;
  height: number;
  scale: number;
  pad: number;
};

export function minimapMetrics(layout: RoadmapLayout, maxW = 132, maxH = 88): MinimapMetrics {
  const pad = 6;
  const scale = Math.min((maxW - pad * 2) / layout.width, (maxH - pad * 2) / layout.height);
  return {
    width: layout.width * scale + pad * 2,
    height: layout.height * scale + pad * 2,
    scale,
    pad,
  };
}

export function viewportRectInCanvas(
  viewport: ViewportState,
  viewportW: number,
  viewportH: number,
): { x: number; y: number; w: number; h: number } {
  return {
    x: -viewport.offsetX / viewport.scale,
    y: -viewport.offsetY / viewport.scale,
    w: viewportW / viewport.scale,
    h: viewportH / viewport.scale,
  };
}

export function canvasPointFromMinimap(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  metrics: MinimapMetrics,
): { x: number; y: number } {
  const lx = clientX - rect.left - metrics.pad;
  const ly = clientY - rect.top - metrics.pad;
  return {
    x: lx / metrics.scale,
    y: ly / metrics.scale,
  };
}

export function viewportForCanvasCenter(
  canvasX: number,
  canvasY: number,
  viewport: ViewportState,
  viewportW: number,
  viewportH: number,
): Pick<ViewportState, "offsetX" | "offsetY"> {
  return {
    offsetX: viewportW / 2 - canvasX * viewport.scale,
    offsetY: viewportH / 2 - canvasY * viewport.scale,
  };
}
