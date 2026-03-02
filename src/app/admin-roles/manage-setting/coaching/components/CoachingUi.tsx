import type { ReactNode } from 'react';

export function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
        active ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {label}
    </button>
  );
}

export function FormCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <div className="mt-3 grid grid-cols-1 gap-3">{children}</div>
    </div>
  );
}

export function PrimaryButton({
  disabled,
  onClick,
  loading,
  text,
}: {
  disabled: boolean;
  onClick: () => void;
  loading: boolean;
  text: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50"
    >
      {loading ? 'Saving...' : text}
    </button>
  );
}

export function TableCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <div className="mt-2 max-h-72 overflow-auto rounded-lg border border-slate-200">{children}</div>
    </div>
  );
}
