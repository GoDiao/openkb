import ReactMarkdown from "react-markdown";

import remarkGfm from "remark-gfm";



type Props = {

  content: string;

  className?: string;

  /** 为 h2/h3 注入锚点 id，供 Plan 目录跳转 */

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

    <article

      className={`prose-openkb mx-auto max-w-[72ch] text-[var(--text-primary)] ${className}`}

    >

      <ReactMarkdown

        remarkPlugins={[remarkGfm]}

        components={{

          h1: ({ children }) => (

            <h1 className="font-display mb-4 mt-0 text-3xl font-semibold">{children}</h1>

          ),

          h2: ({ children }) => {

            const text = String(children);

            const id = headingIds ? slugifyHeading(text) : undefined;

            return (

              <h2

                id={id}

                className="font-display mb-3 mt-8 scroll-mt-24 border-b border-[var(--border-subtle)] pb-2 text-xl font-semibold"

              >

                {children}

              </h2>

            );

          },

          h3: ({ children }) => {

            const text = String(children);

            const id = headingIds ? slugifyHeading(text) : undefined;

            return (

              <h3 id={id} className="mb-2 mt-6 scroll-mt-24 text-base font-semibold text-[var(--accent)]">

                {children}

              </h3>

            );

          },

          p: ({ children }) => <p className="mb-3 leading-relaxed text-[var(--text-primary)]">{children}</p>,

          li: ({ children }) => <li className="mb-1 leading-relaxed">{children}</li>,

          code: ({ className: cn, children }) =>

            cn ? (

              <code className="block overflow-x-auto rounded-[var(--radius-card)] bg-[var(--bg-base)] p-4 text-xs">

                {children}

              </code>

            ) : (

              <code className="rounded bg-[var(--accent-soft)] px-1.5 py-0.5 font-mono text-xs text-[var(--accent)]">

                {children}

              </code>

            ),

          a: ({ href, children }) => (

            <a href={href} className="text-[var(--accent)] underline-offset-2 hover:underline">

              {children}

            </a>

          ),

          table: ({ children }) => (

            <div className="mb-4 overflow-x-auto">

              <table className="w-full border-collapse text-sm">{children}</table>

            </div>

          ),

          th: ({ children }) => (

            <th className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-left">

              {children}

            </th>

          ),

          td: ({ children }) => (

            <td className="border border-[var(--border-subtle)] px-3 py-2">{children}</td>

          ),

        }}

      >

        {content}

      </ReactMarkdown>

    </article>

  );

}



export type PlanSection = { id: string; level: number; title: string; line: number };



export function parsePlanSections(content: string): PlanSection[] {

  const sections: PlanSection[] = [];

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


