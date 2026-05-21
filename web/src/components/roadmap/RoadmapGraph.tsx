import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../../i18n/I18nProvider";
import { useRoadmapViewport } from "../../hooks/useRoadmapViewport";
import type { EnrichedPhase, PhaseStatus } from "../../hooks/useProjectHub";
import type { NodeLayout } from "../../utils/roadmapLayout";
import { edgePath, layoutRoadmap, nodeById } from "../../utils/roadmapLayout";
import { leaderLineEndpoints, relatedPhaseIds } from "../../utils/roadmapGraphHelpers";
import { RoadmapMinimap } from "./RoadmapMinimap";

const STATUS_KEYS = ["done", "active", "pending", "blocked"] as const;

const TASK_DOT: Record<string, string> = {
  done: "var(--phase-done)",
  doing: "var(--phase-active)",
  review: "var(--phase-active)",
  todo: "var(--phase-pending)",
  backlog: "var(--phase-pending)",
};

type Props = {
  slug: string;
  phases: EnrichedPhase[];
  phaseDepths: Record<string, number>;
  compact?: boolean;
  initialSelectedId?: string | null;
};

function phaseById(phases: EnrichedPhase[]): Map<string, EnrichedPhase> {
  return new Map(phases.map((p) => [p.id, p]));
}

function edgeTone(
  from: EnrichedPhase | undefined,
  to: EnrichedPhase | undefined,
  selectedId: string | null,
): "highlight" | "active" | "done" | "muted" {
  if (selectedId && (from?.id === selectedId || to?.id === selectedId)) return "highlight";
  if (to?.status === "active" || from?.status === "active") return "active";
  if (from?.status === "done" && to?.status === "done") return "done";
  return "muted";
}

const EDGE_STROKE: Record<string, { stroke: string; width: number; opacity: number }> = {
  highlight: { stroke: "var(--accent)", width: 2.5, opacity: 1 },
  active: { stroke: "var(--phase-active)", width: 2, opacity: 0.85 },
  done: { stroke: "var(--phase-done)", width: 1.5, opacity: 0.45 },
  muted: { stroke: "var(--text-muted)", width: 1.5, opacity: 0.28 },
};

function computePopoverPosition(
  node: NodeLayout,
  viewport: { scale: number; offsetX: number; offsetY: number },
  viewportW: number,
  viewportH: number,
  popoverW: number,
  popoverH: number,
): { x: number; y: number } {
  const gap = 14;
  const pad = 10;
  const nodeScreenX = viewport.offsetX + node.x * viewport.scale;
  const nodeScreenY = viewport.offsetY + node.y * viewport.scale;
  const nodeScreenW = node.width * viewport.scale;
  const nodeScreenH = node.height * viewport.scale;
  const nodeCenterY = nodeScreenY + nodeScreenH / 2;

  let x = nodeScreenX + nodeScreenW + gap;
  if (x + popoverW > viewportW - pad) {
    x = nodeScreenX - popoverW - gap;
  }
  if (x < pad) x = pad;
  if (x + popoverW > viewportW - pad) x = viewportW - popoverW - pad;

  let y = nodeCenterY - popoverH / 2;
  if (y + popoverH > viewportH - pad) y = viewportH - popoverH - pad;
  if (y < pad) y = pad;

  return { x, y };
}

function PhaseNode({
  phase,
  layout,
  selected,
  hovered,
  dimmed,
  compact,
  onSelect,
  onHover,
  onLeave,
}: {
  phase: EnrichedPhase;
  layout: NodeLayout;
  selected: boolean;
  hovered?: boolean;
  dimmed?: boolean;
  compact?: boolean;
  onSelect: () => void;
  onHover: () => void;
  onLeave: () => void;
}) {
  const { t } = useI18n();
  const status = phase.status as PhaseStatus;
  const statusLabel = (STATUS_KEYS as readonly string[]).includes(status)
    ? t(`graph.status.${status}`)
    : status;
  const emphasized = selected || hovered;

  return (
    <motion.button
      type="button"
      data-phase-node
      id={`phase-${phase.id}`}
      initial={{ opacity: 0, scale: 0.88, y: 8 }}
      animate={{
        opacity: dimmed ? 0.32 : 1,
        scale: hovered && !selected ? 1.04 : 1,
        y: 0,
      }}
      transition={{ delay: layout.x * 0.0008, type: "spring", stiffness: 420, damping: 32 }}
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onFocus={onHover}
      onBlur={onLeave}
      className="focus-ring absolute text-left"
      style={{ left: layout.x, top: layout.y, width: layout.width, height: layout.height }}
      aria-pressed={selected}
    >
      <div
        className={`relative flex h-full flex-col overflow-hidden rounded-xl border transition-all duration-300 ${
          selected
            ? "border-[var(--accent)] shadow-[0_0_0_1px_var(--accent),0_12px_40px_color-mix(in_srgb,var(--accent)_22%,transparent)]"
            : hovered
              ? "border-[var(--accent)]/70 shadow-[var(--shadow-card-hover)]"
              : "border-[var(--border-subtle)] shadow-[var(--shadow-card)]"
        } ${status === "active" ? "phase-node-active-ring ring-1 ring-[var(--phase-active)]/25" : ""}`}
        style={{
          background: `linear-gradient(145deg, var(--bg-elevated) 0%, var(--bg-surface) 100%)`,
        }}
      >
        <div className="h-1 w-full shrink-0" style={{ background: `var(--phase-${status})` }} />
        {status === "done" && (
          <span
            className="phase-done-badge absolute right-2 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--phase-done)] text-[9px] font-bold text-[var(--bg-base)]"
            aria-hidden
          >
            ✓
          </span>
        )}
        <div className={`flex min-h-0 flex-1 flex-col ${compact ? "px-2.5 py-2" : "px-3.5 py-2.5"}`}>
          <div className="mb-1 flex items-center justify-between gap-1">
            <span className={`font-mono text-[10px] ${emphasized ? "text-[var(--accent)]" : "text-[var(--accent)]/80"}`}>
              {phase.id}
            </span>
            <span
              className="rounded-full px-1.5 py-px text-[9px] uppercase tracking-wide"
              style={{
                background: `color-mix(in srgb, var(--phase-${status}) 18%, transparent)`,
                color: `var(--phase-${status})`,
              }}
            >
              {statusLabel}
            </span>
          </div>
          <p
            className={`m-0 flex-1 leading-snug text-[var(--text-primary)] ${
              compact
                ? hovered
                  ? "text-[11px]"
                  : "line-clamp-2 text-[11px]"
                : hovered
                  ? "text-xs font-medium"
                  : "line-clamp-2 text-xs font-medium"
            }`}
            title={phase.title}
          >
            {phase.title.replace(/^Phase \d+[a-z]?:?\s*/i, "")}
          </p>
          {phase.task_details.length > 0 && (
            <div className="mt-1.5 flex items-center gap-1">
              {phase.task_details.slice(0, compact ? 4 : 6).map((task) => (
                <motion.span
                  key={task.id}
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: TASK_DOT[task.status] ?? "var(--phase-pending)" }}
                  title={`${task.id} · ${task.title}`}
                  animate={hovered ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                  transition={{ duration: 0.35 }}
                />
              ))}
              {phase.task_details.length > (compact ? 4 : 6) && (
                <span className="text-[9px] text-[var(--text-muted)]">
                  +{phase.task_details.length - (compact ? 4 : 6)}
                </span>
              )}
            </div>
          )}
          {hovered && !selected && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="m-0 mt-1.5 truncate text-[9px] font-medium text-[var(--accent)]"
            >
              {t("graph.clickToOpen")}
              {phase.task_details.length > 0 &&
                ` · ${t("graph.taskCount", { count: phase.task_details.length })}`}
            </motion.p>
          )}
        </div>
      </div>
    </motion.button>
  );
}

function PhaseDetailPopover({
  slug,
  phase,
  compact,
  style,
  onClose,
  onSelectPhase,
}: {
  slug: string;
  phase: EnrichedPhase;
  compact?: boolean;
  style: { x: number; y: number };
  onClose: () => void;
  onSelectPhase: (id: string) => void;
}) {
  const { t } = useI18n();
  const status = phase.status as PhaseStatus;
  const statusLabel = (STATUS_KEYS as readonly string[]).includes(status)
    ? t(`graph.status.${status}`)
    : status;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      data-phase-detail
      role="dialog"
      aria-label={phase.title}
      initial={{ opacity: 0, scale: 0.96, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 6 }}
      transition={{ duration: 0.18 }}
      className={`absolute z-20 flex flex-col overflow-hidden rounded-xl border border-[var(--accent)]/40 bg-[var(--bg-elevated)]/98 shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur-md ${
        compact ? "w-[280px] max-h-[200px]" : "w-[min(360px,calc(100%-24px))] max-h-[min(420px,65%)]"
      }`}
      style={{ left: style.x, top: style.y }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-[var(--accent)]">{phase.id}</span>
            <span
              className="rounded-full px-2 py-0.5 text-[9px] uppercase"
              style={{
                background: `color-mix(in srgb, var(--phase-${status}) 18%, transparent)`,
                color: `var(--phase-${status})`,
              }}
            >
              {statusLabel}
            </span>
          </div>
          <h3 className="font-display m-0 truncate text-sm font-medium">{phase.title}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="focus-ring shrink-0 rounded-md px-1.5 py-0.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          aria-label={t("graph.closeDetail")}
        >
          ✕
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {phase.plan_ref && (
            <div>
              <p className="m-0 mb-1.5 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                {t("graph.planSection")}
              </p>
              <Link
                to={`/projects/${slug}/plan#${phase.plan_anchor}`}
                className="inline-flex rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-xs text-[var(--accent)] no-underline transition hover:bg-[var(--accent-soft)]"
              >
                {phase.plan_ref}
              </Link>
            </div>
          )}

          {phase.task_details.length > 0 && (
            <div>
              <p className="m-0 mb-1.5 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                {t("graph.tasks")} ({phase.task_details.length})
              </p>
              <ul className="m-0 space-y-1.5 p-0 list-none">
                {phase.task_details.map((task) => (
                  <li key={task.id}>
                    <Link
                      to={`/projects/${slug}/kanban?task=${task.id}`}
                      className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 text-xs no-underline transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                    >
                      <span
                        className="inline-block h-2 w-2 shrink-0 rounded-full"
                        style={{ background: TASK_DOT[task.status] ?? "var(--phase-pending)" }}
                      />
                      <span className="font-mono text-[var(--accent)]">{task.id}</span>
                      <span className="truncate text-[var(--text-primary)]">{task.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {phase.decision_details.length > 0 && (
            <div>
              <p className="m-0 mb-1.5 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                {t("graph.decisions")}
              </p>
              <ul className="m-0 space-y-1.5 p-0 list-none">
                {phase.decision_details.map((d) => (
                  <li key={d.id}>
                    <Link
                      to={`/projects/${slug}/decisions#${d.id}`}
                      className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 text-xs no-underline transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                    >
                      <span className="font-mono text-[var(--accent)]">{d.id}</span>
                      <span className="truncate text-[var(--text-primary)]">{d.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {phase.depends_on.length > 0 && (
            <div>
              <p className="m-0 mb-1.5 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                {t("common.depends")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {phase.depends_on.map((dep) => (
                  <button
                    key={dep}
                    type="button"
                    onClick={() => onSelectPhase(dep)}
                    className="focus-ring rounded-md border border-[var(--border-subtle)] px-2 py-1 font-mono text-xs text-[var(--text-muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    {dep}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function RoadmapGraph({ slug, phases, phaseDepths, compact, initialSelectedId }: Props) {
  const { t } = useI18n();
  const markerPrefix = useId().replace(/:/g, "");
  const popoverMeasureRef = useRef<HTMLDivElement>(null);
  const layout = useMemo(() => layoutRoadmap(phases, phaseDepths, compact), [phases, phaseDepths, compact]);
  const positions = useMemo(() => nodeById(layout.nodes), [layout.nodes]);
  const phasesMap = useMemo(() => phaseById(phases), [phases]);
  const {
    viewportRef,
    viewport,
    setViewport,
    zoomIn,
    zoomOut,
    resetView,
    onWheel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  } = useRoadmapViewport(layout.width, layout.height, true);

  const defaultSelected =
    initialSelectedId ??
    phases.find((p) => p.status === "active")?.id ??
    phases.find((p) => p.status === "pending")?.id ??
    phases[phases.length - 1]?.id ??
    null;

  const [selectedId, setSelectedId] = useState<string | null>(defaultSelected);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });
  const [popoverSize, setPopoverSize] = useState({ w: 0, h: 0 });
  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 });

  const focusId = selectedId ?? hoveredId;

  const relatedIds = useMemo(
    () => (focusId ? relatedPhaseIds(focusId, layout.edges) : null),
    [focusId, layout.edges],
  );

  useEffect(() => {
    if (initialSelectedId) setSelectedId(initialSelectedId);
  }, [initialSelectedId]);

  const selectedPhase = selectedId ? phasesMap.get(selectedId) : undefined;
  const selectedNode = selectedId ? positions.get(selectedId) : undefined;

  useLayoutEffect(() => {
    if (!viewportRef.current) return;
    const vw = viewportRef.current.clientWidth;
    const vh = viewportRef.current.clientHeight;
    setViewportSize({ w: vw, h: vh });
    if (!selectedNode || !popoverMeasureRef.current) return;
    const pw = popoverMeasureRef.current.offsetWidth;
    const ph = popoverMeasureRef.current.offsetHeight;
    setPopoverSize({ w: pw, h: ph });
    setPopoverPos(computePopoverPosition(selectedNode, viewport, vw, vh, pw, ph));
  }, [selectedNode, viewport, compact, viewportRef]);

  const leaderLine =
    selectedNode && popoverSize.w > 0
      ? leaderLineEndpoints(selectedNode, viewport, {
          x: popoverPos.x,
          y: popoverPos.y,
          w: popoverSize.w,
          h: popoverSize.h,
        })
      : null;

  if (phases.length === 0) {
    return <p className="m-0 text-sm text-[var(--text-muted)]">{t("graph.empty")}</p>;
  }

  return (
    <div className="space-y-4">
      <div
        ref={viewportRef}
        className={`relative overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] ${
          compact ? "h-[280px] bg-[var(--bg-base)]/60" : "h-[min(560px,72vh)] bg-[var(--bg-base)]"
        } cursor-grab touch-none`}
        style={{
          backgroundImage: `radial-gradient(circle, color-mix(in srgb, var(--text-muted) 12%, transparent) 1px, transparent 1px)`,
          backgroundSize: compact ? "16px 16px" : "20px 20px",
        }}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/95 p-1 shadow-[var(--shadow-card)] backdrop-blur-sm"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={zoomOut}
            className="focus-ring flex h-7 w-7 items-center justify-center rounded-md text-sm text-[var(--text-muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
            aria-label={t("graph.zoomOut")}
          >
            −
          </button>
          <span className="min-w-[3rem] text-center font-mono text-[10px] text-[var(--text-muted)]">
            {Math.round(viewport.scale * 100)}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            className="focus-ring flex h-7 w-7 items-center justify-center rounded-md text-sm text-[var(--text-muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
            aria-label={t("graph.zoomIn")}
          >
            +
          </button>
          <button
            type="button"
            onClick={resetView}
            className="focus-ring rounded-md px-2 py-1 text-[10px] text-[var(--text-muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
          >
            {t("graph.fitView")}
          </button>
        </div>

        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: layout.width,
            height: layout.height,
            transform: `translate(${viewport.offsetX}px, ${viewport.offsetY}px) scale(${viewport.scale})`,
          }}
        >
          <svg
            className="pointer-events-none absolute inset-0"
            width={layout.width}
            height={layout.height}
            aria-hidden
          >
            <defs>
              <marker id={`${markerPrefix}-arrow`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" fill="var(--text-muted)" fillOpacity="0.45" />
              </marker>
              <marker
                id={`${markerPrefix}-arrow-active`}
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <path d="M0,0 L8,4 L0,8 Z" fill="var(--phase-active)" fillOpacity="0.9" />
              </marker>
              <marker
                id={`${markerPrefix}-arrow-highlight`}
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <path d="M0,0 L8,4 L0,8 Z" fill="var(--accent)" />
              </marker>
            </defs>
            {layout.edges.map(({ from, to }) => {
              const a = positions.get(from);
              const b = positions.get(to);
              if (!a || !b) return null;
              const tone = edgeTone(phasesMap.get(from), phasesMap.get(to), focusId);
              const style = EDGE_STROKE[tone];
              const edgeDimmed =
                relatedIds !== null && !relatedIds.has(from) && !relatedIds.has(to);
              const edgeHovered =
                hoveredId !== null && (from === hoveredId || to === hoveredId);
              const marker =
                tone === "highlight"
                  ? `url(#${markerPrefix}-arrow-highlight)`
                  : tone === "active"
                    ? `url(#${markerPrefix}-arrow-active)`
                    : `url(#${markerPrefix}-arrow)`;
              return (
                <motion.path
                  key={`${from}-${to}`}
                  d={edgePath(a, b)}
                  fill="none"
                  stroke={style.stroke}
                  strokeWidth={edgeHovered ? style.width + 0.75 : style.width}
                  strokeOpacity={edgeDimmed ? 0.12 : edgeHovered ? Math.min(1, style.opacity + 0.2) : style.opacity}
                  markerEnd={edgeDimmed ? undefined : marker}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                />
              );
            })}
          </svg>

          {layout.nodes.map((node) => {
            const phase = phasesMap.get(node.id);
            if (!phase) return null;
            return (
              <PhaseNode
                key={node.id}
                phase={phase}
                layout={node}
                selected={selectedId === node.id}
                hovered={hoveredId === node.id}
                dimmed={relatedIds !== null && !relatedIds.has(node.id)}
                compact={compact}
                onSelect={() => setSelectedId(node.id)}
                onHover={() => setHoveredId(node.id)}
                onLeave={() => setHoveredId(null)}
              />
            );
          })}
        </div>

        {leaderLine && (
          <svg className="pointer-events-none absolute inset-0 z-[15]" aria-hidden>
            <line
              x1={leaderLine.x1}
              y1={leaderLine.y1}
              x2={leaderLine.x2}
              y2={leaderLine.y2}
              stroke="var(--accent)"
              strokeWidth={1.5}
              strokeOpacity={0.65}
              strokeDasharray="4 3"
            />
          </svg>
        )}

        {!compact && phases.length >= 4 && viewportSize.w > 0 && (
          <RoadmapMinimap
            layout={layout}
            nodes={layout.nodes}
            viewport={viewport}
            viewportW={viewportSize.w}
            viewportH={viewportSize.h}
            onPanTo={(offsetX, offsetY) => setViewport((prev) => ({ ...prev, offsetX, offsetY }))}
          />
        )}

        {selectedPhase && (
          <div
            ref={popoverMeasureRef}
            className={`pointer-events-none invisible absolute left-0 top-0 ${
              compact ? "w-[280px] h-[200px]" : "w-[360px] h-[420px]"
            }`}
            aria-hidden
          />
        )}

        <AnimatePresence>
          {selectedPhase && (
            <PhaseDetailPopover
              key={selectedPhase.id}
              slug={slug}
              phase={selectedPhase}
              compact={compact}
              style={popoverPos}
              onClose={() => setSelectedId(null)}
              onSelectPhase={setSelectedId}
            />
          )}
        </AnimatePresence>
      </div>

      {compact && (
        <p className="m-0 text-center text-xs text-[var(--text-muted)]">
          <Link to={`/projects/${slug}/graph`} className="text-[var(--accent)]">
            {t("graph.openFull")}
          </Link>
        </p>
      )}
    </div>
  );
}

export function RoadmapLegend() {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-4 text-xs">
        {STATUS_KEYS.map((key) => (
          <span key={key} className="flex items-center gap-2 text-[var(--text-muted)]">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ background: `var(--phase-${key})` }}
            />
            {t(`graph.status.${key}`)}
          </span>
        ))}
      </div>
      <p className="m-0 text-xs text-[var(--text-muted)]">
        {t("graph.clickHint")} · {t("graph.panZoomHint")} · {t("graph.minimapHint")}
      </p>
    </div>
  );
}
