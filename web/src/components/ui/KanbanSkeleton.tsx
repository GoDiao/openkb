import { Skeleton } from "./Skeleton";

export function KanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden pb-4" aria-busy="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex w-[292px] shrink-0 flex-col rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 p-3"
        >
          <Skeleton className="mb-3 h-4 w-24" />
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-[var(--radius-card)]" />
            <Skeleton className="h-16 rounded-[var(--radius-card)]" />
            {i % 2 === 0 && <Skeleton className="h-14 rounded-[var(--radius-card)]" />}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TaskSidebarSkeleton() {
  return (
    <div className="flex h-full flex-col p-6" aria-busy="true">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-3 h-8 w-full" />
      <Skeleton className="mt-6 h-24 w-full rounded-[var(--radius-card)]" />
      <Skeleton className="mt-4 h-32 w-full rounded-[var(--radius-card)]" />
      <Skeleton className="mt-auto h-10 w-full rounded-[var(--radius-card)]" />
    </div>
  );
}

export function StatePanelSkeleton() {
  return (
    <div className="space-y-5 p-6" aria-busy="true">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-28 w-full rounded-[var(--radius-card)]" />
      <Skeleton className="h-20 w-full rounded-[var(--radius-card)]" />
      <Skeleton className="h-24 w-full rounded-[var(--radius-card)]" />
    </div>
  );
}
