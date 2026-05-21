const STORAGE_KEY = "openkb-onboarding-v1";

export type OnboardingStepId = "patch" | "create" | "overview" | "agent";

export type OnboardingState = {
  dismissed: boolean;
  checked: OnboardingStepId[];
};

const DEFAULT: OnboardingState = { dismissed: false, checked: [] };

export function readOnboardingState(): OnboardingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    return {
      dismissed: Boolean(parsed.dismissed),
      checked: Array.isArray(parsed.checked) ? (parsed.checked as OnboardingStepId[]) : [],
    };
  } catch {
    return DEFAULT;
  }
}

export function writeOnboardingState(state: OnboardingState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function toggleOnboardingStep(step: OnboardingStepId): OnboardingState {
  const current = readOnboardingState();
  const checked = current.checked.includes(step)
    ? current.checked.filter((s) => s !== step)
    : [...current.checked, step];
  const next = { ...current, checked };
  writeOnboardingState(next);
  return next;
}

export function dismissOnboarding(): OnboardingState {
  const next = { ...readOnboardingState(), dismissed: true };
  writeOnboardingState(next);
  return next;
}
