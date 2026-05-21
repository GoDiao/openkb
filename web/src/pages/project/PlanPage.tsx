import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { DocErrorPanel } from "../../components/docs/DocErrorPanel";
import { MarkdownDoc, parsePlanSections } from "../../components/docs/MarkdownDoc";
import { DocSkeleton } from "../../components/ui/Skeleton";
import { useI18n } from "../../i18n/I18nProvider";
import { useDoc, useRoadmap } from "../../hooks/useProjectHub";

export function PlanPage() {
  const { t } = useI18n();
  const { slug = "" } = useParams();
  const { data, isLoading, error, refetch } = useDoc(slug, "plan");
  const { data: roadmapData } = useRoadmap(slug);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sections = useMemo(
    () => (data?.content ? parsePlanSections(data.content) : []),
    [data?.content],
  );

  const phaseStatus = useMemo(() => {
    const map = new Map<string, string>();
    roadmapData?.roadmap.phases.forEach((p) => {
      if (p.plan_ref) map.set(p.plan_ref, p.status);
    });
    return map;
  }, [roadmapData]);

  function scrollToSection(sectionId: string) {
    setActiveId(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash || sections.length === 0) return;
    if (sections.some((s) => s.id === hash)) {
      scrollToSection(hash);
    }
  }, [sections]);

  if (isLoading) {
    return (
      <div className="surface-panel p-8">
        <DocSkeleton kind="plan" />
      </div>
    );
  }

  if (error) return <DocErrorPanel kind="plan" error={error} onRetry={() => void refetch()} />;

  return (
    <div className="flex gap-6">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="surface-panel sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto p-4">
          <p className="m-0 mb-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">{t("plan.toc")}</p>
          <ul className="m-0 list-none space-y-1 p-0">
            {sections.map((s) => {
              const status =
                phaseStatus.get(s.title.replace(/^Phase \d+:?\s*/i, "Phase ").split(":")[0]) ??
                phaseStatus.get(s.title.match(/Phase \d+/)?.[0] ?? "");

              return (
                <li key={`${s.line}-${s.title}`}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(s.id)}
                    className={`focus-ring w-full rounded-md px-2 py-1.5 text-left text-xs transition ${
                      s.level === 2 ? "font-medium" : "pl-4 text-[var(--text-muted)]"
                    } ${activeId === s.id ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "hover:bg-[var(--bg-base)]"}`}
                  >
                    {status === "done" && "✓ "}
                    {status === "active" && "● "}
                    {s.title.length > 36 ? `${s.title.slice(0, 36)}…` : s.title}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
      <div className="surface-panel min-w-0 flex-1 p-8">
        <p className="m-0 mb-6 font-mono text-xs text-[var(--text-muted)]">{data?.path}</p>
        {data && <MarkdownDoc content={data.content} headingIds />}
      </div>
    </div>
  );
}
