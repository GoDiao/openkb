import type { EnrichedPhase } from "../hooks/useProjectHub";

export type NodeLayout = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  row: number;
};

export type EdgeLayout = {
  from: string;
  to: string;
};

export type RoadmapLayout = {
  nodes: NodeLayout[];
  edges: EdgeLayout[];
  width: number;
  height: number;
};

export type LayoutMetrics = {
  colW: number;
  nodeH: number;
  rowStep: number;
  padX: number;
  padY: number;
  nodeW: number;
};

function metrics(compact: boolean): LayoutMetrics {
  const colW = compact ? 196 : 248;
  const nodeH = compact ? 68 : 84;
  const rowStep = nodeH + (compact ? 16 : 22);
  const padX = compact ? 28 : 40;
  const padY = compact ? 28 : 36;
  return { colW, nodeH, rowStep, padX, padY, nodeW: colW - (compact ? 56 : 72) };
}

/** Longest-path layering (X columns). */
export function computeLayers(phases: EnrichedPhase[]): Map<string, number> {
  const byId = new Map(phases.map((p) => [p.id, p]));
  const memo = new Map<string, number>();

  function layer(id: string): number {
    const cached = memo.get(id);
    if (cached !== undefined) return cached;
    const phase = byId.get(id);
    if (!phase || phase.depends_on.length === 0) {
      memo.set(id, 0);
      return 0;
    }
    const deps = phase.depends_on.filter((d) => byId.has(d));
    const d = deps.length === 0 ? 0 : 1 + Math.max(...deps.map(layer));
    memo.set(id, d);
    return d;
  }

  for (const p of phases) layer(p.id);
  return memo;
}

/** Barycenter rows + fork spread for parallel branches. */
export function assignRows(phases: EnrichedPhase[], layers: Map<string, number>): Map<string, number> {
  const rows = new Map<string, number>();
  const maxLayer = Math.max(0, ...layers.values());

  const layerNodes: string[][] = Array.from({ length: maxLayer + 1 }, () => []);
  for (const p of phases) {
    layerNodes[layers.get(p.id) ?? 0].push(p.id);
  }

  const roots = layerNodes[0].sort();
  roots.forEach((id, i) => rows.set(id, i));

  for (let L = 1; L <= maxLayer; L++) {
    const pending = layerNodes[L].map((id) => {
      const phase = phases.find((p) => p.id === id)!;
      const parentRows = phase.depends_on.filter((d) => rows.has(d)).map((d) => rows.get(d)!);
      const bc =
        parentRows.length > 0
          ? parentRows.reduce((a, b) => a + b, 0) / parentRows.length
          : 0;
      return { id, bc };
    });
    pending.sort((a, b) => a.bc - b.bc || a.id.localeCompare(b.id));

    for (const { id, bc } of pending) {
      let r = Math.round(bc);
      while ([...rows.values()].includes(r)) r += 1;
      rows.set(id, r);
    }
  }

  for (const parent of phases) {
    const children = phases
      .filter((c) => c.depends_on.includes(parent.id))
      .sort((a, b) => a.id.localeCompare(b.id));
    if (children.length <= 1) continue;
    const center = rows.get(parent.id) ?? 0;
    const half = (children.length - 1) / 2;
    children.forEach((child, i) => {
      rows.set(child.id, Math.round(center - half + i));
    });
  }

  resolveRowCollisions(rows);
  return rows;
}

export function resolveRowCollisions(rows: Map<string, number>): void {
  const ids = [...rows.keys()];
  ids.sort((a, b) => {
    const ra = rows.get(a)!;
    const rb = rows.get(b)!;
    return ra - rb || a.localeCompare(b);
  });

  const occupied = new Set<number>();
  for (const id of ids) {
    let r = rows.get(id)!;
    while (occupied.has(r)) r += 1;
    rows.set(id, r);
    occupied.add(r);
  }
}

export function layoutRoadmap(
  phases: EnrichedPhase[],
  _phaseDepths?: Record<string, number>,
  compact = false,
): RoadmapLayout {
  void _phaseDepths;
  const m = metrics(compact);
  if (phases.length === 0) {
    return { nodes: [], edges: [], width: 0, height: 0 };
  }

  const layers = computeLayers(phases);
  const rows = assignRows(phases, layers);
  const minRow = Math.min(...rows.values());
  const maxRow = Math.max(...rows.values());
  const rowSpan = maxRow - minRow + 1;

  const canvasH = m.padY * 2 + rowSpan * m.rowStep - (m.rowStep - m.nodeH);
  const maxLayer = Math.max(...layers.values());
  const canvasW = m.padX * 2 + maxLayer * m.colW + m.nodeW;

  const nodes: NodeLayout[] = phases.map((phase) => {
    const depth = layers.get(phase.id) ?? 0;
    const row = rows.get(phase.id) ?? 0;
    return {
      id: phase.id,
      x: m.padX + depth * m.colW,
      y: m.padY + (row - minRow) * m.rowStep,
      width: m.nodeW,
      height: m.nodeH,
      depth,
      row,
    };
  });

  const edges: EdgeLayout[] = [];
  for (const phase of phases) {
    for (const dep of phase.depends_on) {
      edges.push({ from: dep, to: phase.id });
    }
  }

  return { nodes, edges, width: canvasW, height: canvasH };
}

export function edgePath(from: NodeLayout, to: NodeLayout): string {
  const x1 = from.x + from.width;
  const y1 = from.y + from.height / 2;
  const x2 = to.x;
  const y2 = to.y + to.height / 2;
  const dx = Math.max(56, (x2 - x1) * 0.5);
  const dy = Math.abs(y2 - y1);
  if (dy < 4) {
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  }
  const midX = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
}

export function nodeById(nodes: NodeLayout[]): Map<string, NodeLayout> {
  return new Map(nodes.map((n) => [n.id, n]));
}
