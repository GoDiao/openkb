import { useState } from "react";
import { Link } from "react-router-dom";
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

export function OnboardingChecklist({ projectSlug, variant = "list" }: Props) {
  const { t } = useI18n();
  const [state, setState] = useState(readOnboardingState);

  if (state.dismissed) return null;

  const allDone = STEPS.every((s) => state.checked.includes(s.id));

  function toggle(id: OnboardingStepId) {
    setState(toggleOnboardingStep(id));
  }

  function dismiss() {
    setState(dismissOnboarding());
  }

  return (
    <div
      className={`surface-panel border border-[var(--accent)]/25 ${
        variant === "overview" ? "mb-6 p-5" : "mx-auto mb-8 max-w-lg p-6"
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="m-0 text-xs uppercase tracking-widest text-[var(--accent)]">{t("onboarding.kicker")}</p>
          <h2 className="font-display m-0 mt-1 text-lg font-semibold">{t("onboarding.title")}</h2>
          <p className="m-0 mt-1 text-sm text-[var(--text-muted)]">{t("onboarding.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="focus-ring shrink-0 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          {t("onboarding.dismiss")}
        </button>
      </div>

      <ul className="m-0 list-none space-y-3 p-0">
        {STEPS.map((step) => {
          const done = state.checked.includes(step.id);
          const overviewHref = step.id === "overview" && projectSlug ? `/projects/${projectSlug}` : step.href;
          return (
            <li
              key={step.id}
              className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2.5"
            >
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => toggle(step.id)}
                  className="mt-1 accent-[var(--accent)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-[var(--text-primary)]">{t(step.titleKey)}</span>
                  <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{t(step.descKey)}</span>
                  {step.command && (
                    <code className="mt-2 block overflow-x-auto rounded bg-[var(--bg-elevated)] px-2 py-1 font-mono text-[10px] text-[var(--accent)]">
                      {step.command}
                    </code>
                  )}
                  {overviewHref && (
                    <Link
                      to={overviewHref}
                      className="mt-2 inline-block text-xs text-[var(--accent)] no-underline hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t("onboarding.openLink")} →
                    </Link>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {allDone && <p className="m-0 mt-4 text-center text-sm text-[var(--accent)]">{t("onboarding.allDone")}</p>}
    </div>
  );
}
