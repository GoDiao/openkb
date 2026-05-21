import { useParams } from "react-router-dom";
import { DocErrorPanel } from "../../components/docs/DocErrorPanel";
import { MarkdownDoc } from "../../components/docs/MarkdownDoc";
import { DocSkeleton } from "../../components/ui/Skeleton";
import { useDoc } from "../../hooks/useProjectHub";

export function SpecPage() {
  const { slug = "" } = useParams();
  const { data, isLoading, error, refetch } = useDoc(slug, "spec");

  if (isLoading) {
    return (
      <div className="surface-panel p-8">
        <DocSkeleton kind="spec" />
      </div>
    );
  }

  if (error) return <DocErrorPanel kind="spec" error={error} onRetry={() => void refetch()} />;

  return (
    <div className="surface-panel p-8">
      <p className="m-0 mb-6 font-mono text-xs text-[var(--text-muted)]">{data?.path}</p>
      {data && <MarkdownDoc content={data.content} headingIds />}
    </div>
  );
}
