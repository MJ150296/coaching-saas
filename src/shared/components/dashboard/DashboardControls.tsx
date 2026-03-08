'use client';

type DashboardControlsProps = {
  query: string;
  onQueryChange: (value: string) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  onRefresh: () => void;
  loading?: boolean;
  searchPlaceholder?: string;
};

export function DashboardControls({
  query,
  onQueryChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onRefresh,
  loading = false,
  searchPlaceholder = 'Search',
}: DashboardControlsProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex min-w-56 flex-1 flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Search</span>
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      </label>

      <label className="flex min-w-36 flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">From</span>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      </label>

      <label className="flex min-w-36 flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">To</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      </label>

      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  );
}

export function isWithinDateRange(
  value: string | Date | undefined,
  dateFrom: string,
  dateTo: string
): boolean {
  if (!value) return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return true;

  if (dateFrom) {
    const from = new Date(`${dateFrom}T00:00:00.000Z`);
    if (date < from) return false;
  }

  if (dateTo) {
    const to = new Date(`${dateTo}T23:59:59.999Z`);
    if (date > to) return false;
  }

  return true;
}
