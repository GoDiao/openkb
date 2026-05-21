import { useEffect, useId, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { useI18n } from "../../i18n/I18nProvider";

type Row = { id: string; text: string };

type Props = {
  items: string[];
  onSave: (items: string[]) => void;
};

function newRow(text = ""): Row {
  return { id: crypto.randomUUID(), text };
}

function toRows(items: string[]): Row[] {
  if (items.length === 0) return [];
  return items.map((text) => newRow(text));
}

function NextItemRow({
  row,
  index,
  onChange,
  onBlur,
  onRemove,
}: {
  row: Row;
  index: number;
  onChange: (text: string) => void;
  onBlur: () => void;
  onRemove: () => void;
}) {
  const { t } = useI18n();
  const drag = useDragControls();

  return (
    <Reorder.Item
      value={row}
      dragListener={false}
      dragControls={drag}
      className="group flex items-center gap-2 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1.5 shadow-sm transition hover:border-[var(--accent)]/30 hover:shadow-[var(--shadow-card)]"
      whileDrag={{
        scale: 1.02,
        boxShadow: "var(--shadow-card-hover)",
        zIndex: 10,
      }}
    >
      <button
        type="button"
        className="cursor-grab touch-none px-1 text-[var(--text-muted)] opacity-40 transition hover:opacity-100 active:cursor-grabbing"
        aria-label={t("state.dragSort")}
        onPointerDown={(e) => drag.start(e)}
      >
        ⠿
      </button>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent)]">
        {index + 1}
      </span>
      <input
        type="text"
        value={row.text}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={t("state.nextPlaceholder")}
        className="focus-ring min-w-0 flex-1 border-0 bg-transparent px-1 py-1 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label={t("common.remove")}
        className="focus-ring rounded-md px-2 py-1 text-sm text-[var(--text-muted)] opacity-0 transition hover:bg-[var(--priority-p0)]/10 hover:text-[var(--priority-p0)] group-hover:opacity-100"
      >
        ×
      </button>
    </Reorder.Item>
  );
}

export function NextItemsEditor({ items, onSave }: Props) {
  const { t } = useI18n();
  const listId = useId();
  const [rows, setRows] = useState<Row[]>(() => toRows(items));

  useEffect(() => {
    setRows(toRows(items));
  }, [items]);

  function persist(nextRows: Row[]) {
    const cleaned = nextRows.map((r) => r.text.trim()).filter(Boolean);
    onSave(cleaned);
  }

  function handleReorder(next: Row[]) {
    setRows(next);
    persist(next);
  }

  return (
    <div className="space-y-2">
      {rows.length === 0 ? (
        <p className="m-0 rounded-[var(--radius-card)] border border-dashed border-[var(--border-subtle)] px-3 py-4 text-center text-xs text-[var(--text-muted)]">
          {t("state.nextEmpty")}
        </p>
      ) : (
        <Reorder.Group axis="y" values={rows} onReorder={handleReorder} className="flex flex-col gap-2">
          {rows.map((row, index) => (
            <NextItemRow
              key={row.id}
              row={row}
              index={index}
              onChange={(text) => {
                setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, text } : r)));
              }}
              onBlur={() => {
                setRows((prev) => {
                  persist(prev);
                  return prev;
                });
              }}
              onRemove={() => {
                const next = rows.filter((r) => r.id !== row.id);
                setRows(next);
                persist(next);
              }}
            />
          ))}
        </Reorder.Group>
      )}

      <button
        type="button"
        id={listId}
        onClick={() => {
          const next = [...rows, newRow()];
          setRows(next);
        }}
        className="focus-ring flex w-full items-center justify-center gap-1 rounded-[var(--radius-card)] border border-dashed border-[var(--border-subtle)] py-2 text-xs font-medium text-[var(--accent)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
      >
        {t("state.addNext")}
      </button>
    </div>
  );
}
