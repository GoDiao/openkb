import type { ReactNode } from "react";
import { DocTableOfContents } from "./DocTableOfContents";
import type { DocSection } from "./MarkdownDoc";
import { useDocReadProgress } from "../../hooks/useDocReadProgress";
import { useDocScrollSpy } from "../../hooks/useDocScrollSpy";

type Props = {
  tocTitle: string;
  sections: DocSection[];
  path?: string;
  phaseStatus?: Map<string, string>;
  children: ReactNode;
};

export function DocReaderLayout({ tocTitle, sections, path, phaseStatus, children }: Props) {
  const sectionIds = sections.map((s) => s.id);
  const { activeId, scrollTo } = useDocScrollSpy(sectionIds);
  const readProgress = useDocReadProgress(sectionIds);

  return (
    <>
      {sections.length > 1 && readProgress > 0 && (
        <div
          className="doc-read-progress lg:block"
          style={{ width: `${readProgress}%` }}
          aria-hidden
        />
      )}
      <div className="flex gap-6 pb-20 lg:pb-0">
        <DocTableOfContents
          title={tocTitle}
          sections={sections}
          activeId={activeId}
          readProgress={readProgress}
          onSelect={scrollTo}
          phaseStatus={phaseStatus}
        />
        <div className="surface-panel min-w-0 flex-1 overflow-hidden">
          {path && (
            <div className="border-b border-[var(--border-subtle)] px-6 py-3 md:px-10">
              <p className="m-0 truncate font-mono text-[11px] text-[var(--text-muted)]">{path}</p>
            </div>
          )}
          <div className="px-6 py-8 md:px-10 md:py-10">{children}</div>
        </div>
      </div>
    </>
  );
}
