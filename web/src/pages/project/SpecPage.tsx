import { useMemo } from "react";import { useParams } from "react-router-dom";
import { DocErrorPanel } from "../../components/docs/DocErrorPanel";
import { DocReaderLayout } from "../../components/docs/DocReaderLayout";
import { MarkdownDoc, parseDocSections } from "../../components/docs/MarkdownDoc";
import { DocSkeleton } from "../../components/ui/Skeleton";
import { useI18n } from "../../i18n/I18nProvider";
import { useDoc } from "../../hooks/useProjectHub";

export function SpecPage() {
  const { t } = useI18n();
  const { slug = "" } = useParams();
  const { data, isLoading, error, refetch } = useDoc(slug, "spec");

  const sections = useMemo(
    () => (data?.content ? parseDocSections(data.content) : []),
    [data?.content],
  );

  if (isLoading) {
    return (
      <div className="surface-panel p-8 md:p-10">
        <DocSkeleton kind="spec" />
      </div>
    );
  }

  if (error) return <DocErrorPanel kind="spec" error={error} onRetry={() => void refetch()} />;

  return (
    <DocReaderLayout tocTitle={t("doc.toc")} sections={sections} path={data?.path}>
      {data && <MarkdownDoc content={data.content} headingIds />}
    </DocReaderLayout>
  );
}
