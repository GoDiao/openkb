type Props = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: string;
};

export function EmptyState({ title, description, action, icon = "○" }: Props) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-base)] text-2xl text-[var(--accent)] opacity-80"
        aria-hidden
      >
        {icon}
      </span>
      <p className="font-display text-balance m-0 text-lg text-[var(--text-primary)]">{title}</p>
      {description && (
        <p className="text-balance m-0 mt-2 max-w-sm text-sm leading-relaxed text-[var(--text-muted)]">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
