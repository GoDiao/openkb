import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CopyButton } from "../ui/CopyButton";
import { useI18n } from "../../i18n/I18nProvider";
import {
  dismissOnboarding,
  readOnboardingState,
  toggleOnboardingStep,
  type OnboardingStepId,
} from "../../hooks/useOnboardingChecklist";

type StepDef = {
  id: OnboardingStepId;
  titleKey: string;
  descKey: string;
  href?: string;
  command?: string;
};

const STEPS: StepDef[] = [
  {
    id: "patch",
    titleKey: "onboarding.steps.patch.title",
    descKey: "onboarding.steps.patch.desc",
    href: "/help",
    command: "uv run openkb agent install",
  },
  { id: "create", titleKey: "onboarding.steps.create.title", descKey: "onboarding.steps.create.desc", href: "/" },
  { id: "overview", titleKey: "onboarding.steps.overview.title", descKey: "onboarding.steps.overview.desc", href: "/help" },
  {
    id: "agent",
    titleKey: "onboarding.steps.agent.title",
    descKey: "onboarding.steps.agent.desc",
    command: "openkb context --json",
  },
];

type Props = {
  projectSlug?: string;
  variant?: "list" | "overview";
};

function ProgressRing({ percent }: { percent: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;

  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
      <svg className="-rotate-90" width="48" height="48" aria-hidden>
        <circle cx="24" cy="24" r={r} fill="none" stroke="var(--border-subtle)" strokeWidth="3" />
        <motion.circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span className="absolute font-mono text-[10px] font-medium tabular-nums text-[var(--accent)]">
        {percent}%
      </span>
    </div>
  );
}

export function OnboardingChecklist({ projectSlug, variant = "list" }: Props) {
  const { t } = useI18n();
  const [state, setState] = useState(readOnboardingState);

  if (state.dismissed) return null;

  const doneCount = STEPS.filter((s) => state.checked.includes(s.id)).length;
  const percent = Math.round((doneCount / STEPS.length) * 100);
  const allDone = doneCount === STEPS.length;

  function toggle(id: OnboardingStepId) {
    setState(toggleOnboardingStep(id));
  }

  function dismiss() {
    setState(dismissOnboarding());
  }

  return (
    <motion.div
      className={`surface-panel overflow-hidden border border-[var(--accent)]/20 ${
        variant === "overview" ? "mb-6" : ""
      }`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="border-b border-[var(--border-subtle)] bg-[var(--accent-soft)]/20 px-5 py-4 md:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <ProgressRing percent={percent} />
            <div>
              <p className="m-0 text-xs font-medium uppercase tracking-[0.16em] text-[var(--accent)]">
                {t("onboarding.kicker")}
              </p>
              <h2 className="font-display m-0 mt-1 text-lg font-semibold">{t("onboarding.title")}</h2>
              <p className="m-0 mt-1 text-sm leading-relaxed text-[var(--text-muted)]">{t("onboarding.subtitle")}</p>
              <p className="m-0 mt-2 text-xs text-[var(--text-muted)]">
                {t("onboarding.progress", { current: doneCount, total: STEPS.length })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="btn-ghost focus-ring shrink-0"
          >
            {t("onboarding.dismiss")}
          </button>
        </div>
      </div>

      <ul className="m-0 list-none space-y-0 p-0">
        {STEPS.map((step, i) => {
          const done = state.checked.includes(step.id);
          const overviewHref = step.id === "overview" && projectSlug ? `/projects/${projectSlug}` : step.href;

          return (
            <motion.li
              key={step.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 + i * 0.06 }}
              className="border-b border-[var(--border-subtle)] last:border-b-0"
            >
              <label className="flex cursor-pointer items-start gap-4 px-5 py-4 transition hover:bg-[var(--bg-base)]/60 md:px-6">
                <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => toggle(step.id)}
                    className="peer sr-only"
                  />
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                      done
                        ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--bg-base)]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent)]"
                    }`}
                  >
                    <AnimatePresence>
                      {done && (
                        <motion.span
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 28 }}
                        >
                          ✓
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-sm font-medium transition ${
                      done ? "text-[var(--text-muted)] line-through decoration-[var(--border-subtle)]" : "text-[var(--text-primary)]"
                    }`}
                  >
                    {t(step.titleKey)}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-[var(--text-muted)]">{t(step.descKey)}</span>
                  {step.command && (
                    <div className="mt-2 flex items-center gap-2">
                      <code className="block min-w-0 flex-1 overflow-x-auto rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 font-mono text-[10px] text-[var(--accent)]">
                        {step.command}
                      </code>
                      <CopyButton text={step.command} />
                    </div>
                  )}
                  {overviewHref && (
                    <Link
                      to={overviewHref}
                      className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--accent)] no-underline transition hover:gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t("onboarding.openLink")}
                      <span aria-hidden>→</span>
                    </Link>
                  )}
                </span>
              </label>
            </motion.li>
          );
        })}
      </ul>

      <AnimatePresence>
        {allDone && (
          <motion.p
            className="m-0 border-t border-[var(--border-subtle)] bg-[var(--accent-soft)]/30 px-5 py-3 text-center text-sm font-medium text-[var(--accent)] md:px-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            {t("onboarding.allDone")}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
