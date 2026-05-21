import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  content: string;
  className?: string;
  /** 为 h2/h3 注入锚点 id，供目录跳转 */
  headingIds?: boolean;
};

export function slugifyHeading(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function MarkdownDoc({ content, className = "", headingIds = false }: Props) {
  return (
    <article className={`prose-openkb mx-auto max-w-[72ch] text-[var(--text-primary)] ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-display mb-6 mt-0 text-3xl font-semibold tracking-tight md:text-4xl">
              {children}
            </h1>
          ),
          h2: ({ children }) => {
            const text = String(children);
            const id = headingIds ? slugifyHeading(text) : undefined;
            return (
              <h2
                id={id}
                className={`doc-heading font-display mb-4 mt-10 scroll-mt-28 border-b border-[var(--border-subtle)] pb-3 text-xl font-semibold tracking-tight md:text-2xl ${
                  headingIds ? "doc-heading-anchor" : ""
                }`}
              >
                {children}
              </h2>
            );
          },
          h3: ({ children }) => {
            const text = String(children);
            const id = headingIds ? slugifyHeading(text) : undefined;
            return (
              <h3
                id={id}
                className={`doc-heading mb-3 mt-8 scroll-mt-28 text-base font-semibold text-[var(--accent)] md:text-lg ${
                  headingIds ? "doc-heading-anchor" : ""
                }`}
              >
                {children}
              </h3>
            );
          },
          h4: ({ children }) => (
            <h4 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="mb-4 text-[15px] leading-[1.75] text-[var(--text-primary)]">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 list-none space-y-2 p-0 pl-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 list-decimal space-y-2 pl-6 marker:text-[var(--accent)] [&>li]:pl-0 [&>li]:before:hidden">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="relative pl-5 leading-[1.7] before:absolute before:left-0 before:top-[0.65em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-[var(--accent-soft)] before:content-[''] [&>ul]:mt-2">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-6 border-l-2 border-[var(--accent)] bg-[var(--accent-soft)]/40 px-5 py-3 text-[var(--text-muted)] italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-10 border-0 border-t border-[var(--border-subtle)]" />,
          code: ({ className: cn, children }) =>
            cn ? (
              <code className="doc-code-block block overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-base)] p-4 font-mono text-xs leading-relaxed">
                {children}
              </code>
            ) : (
              <code className="rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 font-mono text-[0.85em] text-[var(--accent)]">
                {children}
              </code>
            ),
          pre: ({ children }) => (
            <pre className="mb-5 overflow-hidden rounded-[var(--radius-card)]">{children}</pre>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="font-medium text-[var(--accent)] underline decoration-[var(--accent)]/30 underline-offset-[3px] transition hover:decoration-[var(--accent)]"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="doc-table-wrap mb-6 overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border-subtle)]">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2.5 text-left font-medium">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-[var(--border-subtle)] px-4 py-2.5">{children}</td>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-[var(--text-primary)]">{children}</strong>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}

export type DocSection = { id: string; level: number; title: string; line: number };

export function parseDocSections(content: string): DocSection[] {
  const sections: DocSection[] = [];
  const lines = content.split("\n");
  lines.forEach((line, i) => {
    const m2 = line.match(/^## (.+)$/);
    const m3 = line.match(/^### (.+)$/);
    if (m2) {
      sections.push({ id: slugifyHeading(m2[1]), level: 2, title: m2[1], line: i });
    } else if (m3) {
      sections.push({ id: slugifyHeading(m3[1]), level: 3, title: m3[1], line: i });
    }
  });
  return sections;
}

/** @deprecated use parseDocSections */
export function parsePlanSections(content: string): DocSection[] {
  return parseDocSections(content);
}
