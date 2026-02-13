import { StepMeta } from './types';

interface StepTabsCardProps {
  enforceSequence: boolean;
  setEnforceSequence: (value: boolean) => void;
  visibleStepIndexes: number[];
  currentStep: number;
  completion: boolean[];
  maxUnlockedVisiblePosition: number;
  stepMeta: StepMeta[];
  onSelectStep: (stepIndex: number) => void;
}

export function StepTabsCard({
  enforceSequence,
  setEnforceSequence,
  visibleStepIndexes,
  currentStep,
  completion,
  maxUnlockedVisiblePosition,
  stepMeta,
  onSelectStep,
}: StepTabsCardProps) {
  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
          <input
            type="checkbox"
            checked={enforceSequence}
            onChange={(e) => setEnforceSequence(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Enforce sequential mode
        </label>
        <span className="text-xs font-medium text-gray-500">
          {enforceSequence ? 'Strict onboarding flow for first setup' : 'Flexible mode for partial updates'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {visibleStepIndexes.map((stepIndex, visibleIdx) => {
          const step = stepMeta[stepIndex];
          const active = stepIndex === currentStep;
          const done = completion[stepIndex];
          const locked = enforceSequence && visibleIdx > maxUnlockedVisiblePosition;

          return (
            <button
              key={step.title}
              disabled={locked}
              onClick={() => onSelectStep(stepIndex)}
              aria-current={active ? 'step' : undefined}
              aria-label={`Step ${visibleIdx + 1}: ${step.title}${locked ? ' (locked)' : ''}`}
              title={step.description}
              className={`rounded-md border px-3 py-3 text-left transition ${
                active
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : done
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : locked
                  ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide">Step {visibleIdx + 1}</p>
                <span className="text-xs">
                  {done ? 'Done' : locked ? 'Locked' : active ? 'Active' : 'Pending'}
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold">{step.title}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
