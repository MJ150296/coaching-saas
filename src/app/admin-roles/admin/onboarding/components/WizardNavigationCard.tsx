interface WizardNavigationCardProps {
  currentVisibleStepPosition: number;
  visibleStepCount: number;
  onBack: () => void;
  onNext: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
}

export function WizardNavigationCard({
  currentVisibleStepPosition,
  visibleStepCount,
  onBack,
  onNext,
  canGoBack,
  canGoNext,
}: WizardNavigationCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow">
      <button
        onClick={onBack}
        disabled={!canGoBack}
        aria-label="Go to previous onboarding step"
        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Back
      </button>
      <div className="rounded-md bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
        Step {Math.max(currentVisibleStepPosition + 1, 1)} of {Math.max(visibleStepCount, 1)}
      </div>
      <button
        onClick={onNext}
        disabled={!canGoNext}
        aria-label="Go to next onboarding step"
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
