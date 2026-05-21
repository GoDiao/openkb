import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { DocErrorPanel } from "../../components/docs/DocErrorPanel";
import { DocReaderLayout } from "../../components/docs/DocReaderLayout";
import { MarkdownDoc, parseDocSections } from "../../components/docs/MarkdownDoc";
import { DocSkeleton } from "../../components/ui/Skeleton";
import { useI18n } from "../../i18n/I18nProvider";
import { useDoc, useRoadmap } from "../../hooks/useProjectHub";

export function PlanPage() {
  const { t } = useI18n();
  const { slug = "" } = useParams();
  const { data, isLoading, error, refetch } = useDoc(slug, "plan");
  const { data: roadmapData } = useRoadmap(slug);

  const sections = useMemo(
    () => (data?.content ? parseDocSections(data.content) : []),
    [data?.content],
  );

  const phaseStatus = useMemo(() => {
    const map = new Map<string, string>();
    roadmapData?.roadmap.phases.forEach((p) => {
      if (p.plan_ref) map.set(p.plan_ref, p.status);
    });
    return map;
  }, [roadmapData]);

  if (isLoading) {
    return (
      <div className="surface-panel p-8 md:p-10">
        <DocSkeleton kind="plan" />
      </div>
    );
  }

  if (error) return <DocErrorPanel kind="plan" error={error} onRetry={() => void refetch()} />;

  return (
    <DocReaderLayout
      tocTitle={t("plan.toc")}
      sections={sections}
      path={data?.path}
      phaseStatus={phaseStatus}
    >
      {data && <MarkdownDoc content={data.content} headingIds />}
    </DocReaderLayout>
  );
}
