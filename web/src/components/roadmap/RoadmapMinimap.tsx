import type { ViewportState } from "../../hooks/useRoadmapViewport";
import type { NodeLayout, RoadmapLayout } from "../../utils/roadmapLayout";
import {
  canvasPointFromMinimap,
  minimapMetrics,
  viewportForCanvasCenter,
  viewportRectInCanvas,
} from "../../utils/roadmapGraphHelpers";

type Props = {
  layout: RoadmapLayout;
  nodes: NodeLayout[];
  viewport: ViewportState;
  viewportW: number;
  viewportH: number;
  onPanTo: (offsetX: number, offsetY: number) => void;
};

export function RoadmapMinimap({ layout, nodes, viewport, viewportW, viewportH, onPanTo }: Props) {
  const metrics = minimapMetrics(layout);
  const vis = viewportRectInCanvas(viewport, viewportW, viewportH);

  function handlePointer(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const pt = canvasPointFromMinimap(e.clientX, e.clientY, rect, metrics);
    const next = viewportForCanvasCenter(pt.x, pt.y, viewport, viewportW, viewportH);
    onPanTo(next.offsetX, next.offsetY);
  }

  return (
    <div
      className="absolute bottom-3 right-3 z-10 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/95 p-1 shadow-[var(--shadow-card)] backdrop-blur-sm"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <svg
        width={metrics.width}
        height={metrics.height}
        className="block cursor-crosshair touch-none"
        onPointerDown={handlePointer}
        aria-hidden
      >
        {nodes.map((node) => (
          <rect
            key={node.id}
            x={metrics.pad + node.x * metrics.scale}
            y={metrics.pad + node.y * metrics.scale}
            width={Math.max(2, node.width * metrics.scale)}
            height={Math.max(2, node.height * metrics.scale)}
            rx={1}
            fill="var(--accent)"
            fillOpacity={0.35}
          />
        ))}
        <rect
          x={metrics.pad + vis.x * metrics.scale}
          y={metrics.pad + vis.y * metrics.scale}
          width={Math.max(4, vis.w * metrics.scale)}
          height={Math.max(4, vis.h * metrics.scale)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1.5}
        />
      </svg>
    </div>
  );
}
