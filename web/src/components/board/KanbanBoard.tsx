import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { BOARD_COLUMNS, type Board, type BoardColumn, type Task } from "../../api/client";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";

type Props = {
  board: Board;
  onMove: (taskId: string, column: BoardColumn) => void;
  onTaskClick: (task: Task) => void;
};

export function KanbanBoard({ board, onMove, onTaskClick }: Props) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function findTask(id: string): Task | undefined {
    for (const col of BOARD_COLUMNS) {
      const t = board[col]?.find((x) => x.id === id);
      if (t) return t;
    }
    return undefined;
  }

  function handleDragStart(e: DragStartEvent) {
    const task = findTask(String(e.active.id));
    setActiveTask(task ?? null);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveTask(null);
    const taskId = String(e.active.id);
    const overId = e.over?.id;
    if (!overId) return;
    const col = String(overId) as BoardColumn;
    if (BOARD_COLUMNS.includes(col)) {
      const task = findTask(taskId);
      if (task && task.status !== col) {
        onMove(taskId, col);
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
        {BOARD_COLUMNS.map((col) => (
          <KanbanColumn
            key={col}
            column={col}
            tasks={board[col] ?? []}
            onTaskClick={onTaskClick}
            activeId={activeTask?.id ?? null}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 200, easing: "ease-out" }}>
        {activeTask ? (
          <div className="w-[280px] rotate-2 opacity-95">
            <TaskCard task={activeTask} onClick={() => {}} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
