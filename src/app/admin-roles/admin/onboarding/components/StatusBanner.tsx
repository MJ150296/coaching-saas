import { StepStatus } from './types';

export function StatusBanner({ status }: { status: StepStatus }) {
  if (status.type === 'idle') return null;

  const toneClass =
    status.type === 'success'
      ? 'border-green-200 bg-green-50 text-green-700'
      : status.type === 'error'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-yellow-200 bg-yellow-50 text-yellow-700';

  return (
    <div
      role={status.type === 'error' ? 'alert' : 'status'}
      aria-live={status.type === 'error' ? 'assertive' : 'polite'}
      className={`mt-4 rounded-xl border px-3 py-2 text-sm font-medium ${toneClass}`}
    >
      {status.message}
    </div>
  );
}
