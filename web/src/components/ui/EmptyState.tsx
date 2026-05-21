type Props = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: string;
};

export function EmptyState({ title, description, action, icon = "○" }: Props) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="mb-3 text-3xl opacity-40" aria-hidden>
        {icon}
      </span>
      <p className="font-display m-0 text-lg text-[var(--text-primary)]">{title}</p>
      {description && <p className="m-0 mt-2 max-w-sm text-sm text-[var(--text-muted)]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
