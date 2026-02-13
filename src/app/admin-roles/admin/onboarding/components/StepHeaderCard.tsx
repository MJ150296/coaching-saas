interface StepHeaderCardProps {
  title: string;
  description: string;
  currentPosition: number;
  totalSteps: number;
  completionPercent: number;
}

type Theme = {
  badgeClass: string;
  iconWrapClass: string;
  iconClass: string;
};

function themeForStep(step: number): Theme {
  const themes: Theme[] = [
    {
      badgeClass: 'text-blue-600',
      iconWrapClass: 'bg-blue-100',
      iconClass: 'text-blue-600',
    },
    {
      badgeClass: 'text-green-600',
      iconWrapClass: 'bg-green-100',
      iconClass: 'text-green-600',
    },
    {
      badgeClass: 'text-yellow-600',
      iconWrapClass: 'bg-yellow-100',
      iconClass: 'text-yellow-600',
    },
    {
      badgeClass: 'text-purple-600',
      iconWrapClass: 'bg-purple-100',
      iconClass: 'text-purple-600',
    },
  ];

  return themes[(Math.max(step, 1) - 1) % themes.length];
}

function StepIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
      />
    </svg>
  );
}

export function StepHeaderCard({
  title,
  description,
  currentPosition,
  totalSteps,
  completionPercent,
}: StepHeaderCardProps) {
  const theme = themeForStep(currentPosition);

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide ${theme.badgeClass}`}>
            Step {Math.max(currentPosition, 1)} of {Math.max(totalSteps, 1)}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${theme.iconWrapClass}`}>
              <StepIcon className={`h-5 w-5 ${theme.iconClass}`} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">{description}</p>
        </div>
        <div className="rounded-lg bg-blue-50 px-4 py-3 text-right">
          <p className="text-xs font-medium text-blue-600">Workflow Completion</p>
          <p className="text-xl font-bold text-blue-700">{completionPercent}%</p>
        </div>
      </div>
      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
          style={{ width: `${completionPercent}%` }}
        />
      </div>
    </div>
  );
}
