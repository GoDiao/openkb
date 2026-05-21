import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CopyCodeBlock } from "../components/ui/CopyButton";
import { useI18n } from "../i18n/I18nProvider";

const PAGE_KEYS = ["overview", "kanban", "spec", "plan", "graph", "decisions"] as const;
const WORKFLOW_KEYS = ["new", "onboard", "sync", "start"] as const;
const KANBAN_DRAG_ROWS = ["column", "state", "session", "lock", "roadmap"] as const;

const SETUP_COMMANDS = {
  install: "uv run openkb agent install",
  serve: "uv run openkb serve",
  context: "openkb context --json",
} as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface-panel p-6">
      <h2 className="font-display m-0 mb-4 text-xl">{title}</h2>
      {children}
    </section>
  );
}

export function HelpPage() {
  const { t } = useI18n();
  const adrExample = t("help.adrPhases.example").replace(/\\n/g, "\n");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display m-0 text-4xl font-semibold tracking-tight">{t("help.title")}</h1>
        <p className="mt-3 leading-relaxed text-[var(--text-muted)]">{t("help.subtitle")}</p>
      </motion.div>

      <Section title={t("help.whatIs.title")}>
        <p className="m-0 leading-relaxed text-[var(--text-primary)]">{t("help.whatIs.body")}</p>
      </Section>

      <Section title={t("help.pages.title")}>
        <ul className="m-0 list-none space-y-4 p-0">
          {PAGE_KEYS.map((key, i) => (
            <motion.li
              key={key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-base)] px-4 py-3"
            >
              <p className="m-0 font-medium text-[var(--accent)]">{t(`help.pages.${key}.title`)}</p>
              <p className="m-0 mt-1 text-sm leading-relaxed text-[var(--text-muted)]">
                {t(`help.pages.${key}.desc`)}
              </p>
            </motion.li>
          ))}
        </ul>
      </Section>

      <Section title={t("help.graphTips.title")}>
        <ul className="m-0 space-y-3 p-0 text-sm leading-relaxed text-[var(--text-primary)]">
          <li className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
            {t("help.graphTips.panZoom")}
          </li>
          <li className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
            {t("help.graphTips.clickPanel")}
          </li>
          <li className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
            {t("help.graphTips.deepLinks")}
          </li>
          <li className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
            {t("help.graphTips.overviewCompact")}
          </li>
        </ul>
      </Section>

      <Section title={t("help.workflows.title")}>
        <div className="space-y-4">
          {WORKFLOW_KEYS.map((key, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] p-4"
            >
              <h3 className="font-display m-0 text-base font-semibold">{t(`help.workflows.${key}.title`)}</h3>
              <dl className="m-0 mt-3 grid gap-2 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{t("help.labels.when")}</dt>
                  <dd className="m-0 mt-0.5 text-[var(--text-primary)]">{t(`help.workflows.${key}.when`)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{t("help.labels.agent")}</dt>
                  <dd className="m-0 mt-0.5 text-[var(--text-primary)]">{t(`help.workflows.${key}.agent`)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{t("help.labels.you")}</dt>
                  <dd className="m-0 mt-0.5 text-[var(--text-primary)]">{t(`help.workflows.${key}.you`)}</dd>
                </div>
              </dl>
            </motion.div>
          ))}
        </div>
      </Section>

      <Section title={t("help.adrPhases.title")}>
        <p className="m-0 leading-relaxed text-[var(--text-primary)]">{t("help.adrPhases.body")}</p>
        <CopyCodeBlock code={adrExample} className="mt-4" />
        <p className="m-0 mt-3 text-sm text-[var(--text-muted)]">{t("help.adrPhases.hint")}</p>
      </Section>

      <Section title={t("help.kanbanDragVsCli.title")}>
        <p className="m-0 leading-relaxed text-[var(--text-primary)]">{t("help.kanbanDragVsCli.intro")}</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-left text-[var(--text-muted)]">
                <th className="py-2 pr-4 font-medium">{t("help.kanbanDragVsCli.colAction")}</th>
                <th className="py-2 pr-4 font-medium">{t("help.kanbanDragVsCli.colUiDrag")}</th>
                <th className="py-2 font-medium">{t("help.kanbanDragVsCli.colCli")}</th>
              </tr>
            </thead>
            <tbody>
              {KANBAN_DRAG_ROWS.map((key) => (
                <tr key={key} className="border-b border-[var(--border-subtle)]/60">
                  <td className="py-2 pr-4 align-top font-medium text-[var(--accent)]">
                    {t(`help.kanbanDragVsCli.rows.${key}.action`)}
                  </td>
                  <td className="py-2 pr-4 align-top text-[var(--text-primary)]">
                    {t(`help.kanbanDragVsCli.rows.${key}.ui`)}
                  </td>
                  <td className="py-2 align-top text-[var(--text-primary)]">
                    {t(`help.kanbanDragVsCli.rows.${key}.cli`)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="m-0 mt-4 text-sm text-[var(--text-primary)]">{t("help.kanbanDragVsCli.agentNote")}</p>
        <p className="m-0 mt-2 text-sm text-[var(--text-muted)]">{t("help.kanbanDragVsCli.helpLink")}</p>
      </Section>

      <Section title={t("help.syncV2.title")}>
        <p className="m-0 leading-relaxed text-[var(--text-primary)]">{t("help.syncV2.body")}</p>
      </Section>

      <Section title={t("help.data.title")}>
        <ul className="m-0 space-y-3 p-0 text-sm leading-relaxed text-[var(--text-primary)]">
          <li className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
            {t("help.data.workspace")}
          </li>
          <li className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
            {t("help.data.repo")}
          </li>
          <li className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
            {t("help.data.link")}
          </li>
        </ul>
      </Section>

      <Section title={t("help.setup.title")}>
        <div className="space-y-4">
          <div>
            <p className="m-0 text-sm leading-relaxed text-[var(--text-primary)]">{t("help.setup.patch")}</p>
            <CopyCodeBlock code={SETUP_COMMANDS.install} className="mt-3" />
          </div>
          <div>
            <p className="m-0 text-sm leading-relaxed text-[var(--text-primary)]">{t("help.setup.cli")}</p>
            <div className="mt-3 space-y-2">
              <CopyCodeBlock code={SETUP_COMMANDS.serve} />
              <CopyCodeBlock code={SETUP_COMMANDS.context} />
            </div>
          </div>
        </div>
      </Section>

      <p className="text-center text-sm">
        <Link to="/" className="text-[var(--accent)] no-underline hover:underline">
          ← {t("nav.projects")}
        </Link>
      </p>
    </div>
  );
}
