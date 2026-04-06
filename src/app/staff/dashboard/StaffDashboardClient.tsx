'use client';

import { useCallback, useMemo, useState } from 'react';
import { Badge } from '@/shared/components/ui/Badge';
import { useToast } from '@/shared/components/ui/ToastProvider';
import { DashboardControls, isWithinDateRange } from '@/shared/components/dashboard/DashboardControls';
import type { StaffDashboardPayload } from '@/shared/lib/staff-dashboard.server';

type StaffDashboardClientProps = {
  initialData: StaffDashboardPayload;
  firstName: string;
};

type RequestItem = StaffDashboardPayload['requests'][number];

function priorityVariant(priority: RequestItem['priority']): 'blue' | 'yellow' | 'red' {
  if (priority === 'high') return 'red';
  if (priority === 'medium') return 'yellow';
  return 'blue';
}

function statusVariant(status: RequestItem['status']): 'gray' | 'blue' | 'green' {
  if (status === 'completed') return 'green';
  if (status === 'in-progress') return 'blue';
  return 'gray';
}

export default function StaffDashboardClient({ initialData, firstName }: StaffDashboardClientProps) {
  const { toastMessage } = useToast();
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [data, setData] = useState<StaffDashboardPayload>(initialData);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/staff/dashboard');
      const body = await response.json();
      if (!response.ok) {
        toastMessage(body?.error || 'Failed to load staff dashboard');
        return;
      }

      setData({
        summary: {
          pendingRequests: Number(body?.summary?.pendingRequests ?? 0),
          completedToday: Number(body?.summary?.completedToday ?? 0),
          highPriority: Number(body?.summary?.highPriority ?? 0),
          scheduledBlocks: Number(body?.summary?.scheduledBlocks ?? 0),
        },
        requests: Array.isArray(body?.requests) ? body.requests : [],
        schedule: Array.isArray(body?.schedule) ? body.schedule : [],
      });
    } catch (error) {
      toastMessage(`Error: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }, [toastMessage]);

  const summary = useMemo(() => data.summary, [data.summary]);
  const q = query.trim().toLowerCase();
  const filteredRequests = useMemo(
    () =>
      data.requests.filter((item) =>
        !q || [item.title, item.requester, item.priority, item.status].join(' ').toLowerCase().includes(q)
      ),
    [data.requests, q]
  );
  const filteredSchedule = useMemo(
    () =>
      data.schedule.filter((item) => {
        const matchesQuery = !q || [item.title, item.time, item.owner].join(' ').toLowerCase().includes(q);
        const matchesDate = isWithinDateRange(item.time, dateFrom, dateTo);
        return matchesQuery && matchesDate;
      }),
    [data.schedule, q, dateFrom, dateTo]
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-orange-50/25 to-amber-50/45 py-8">
      <main className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-orange-100 bg-linear-to-r from-orange-600 via-amber-600 to-yellow-600 p-6 shadow-lg shadow-orange-200/70">
          <h1 className="text-2xl font-bold text-white">Welcome back, {firstName}</h1>
          <p className="mt-2 text-sm text-amber-50">
            Operational requests, processing queue, and today&apos;s support schedule.
          </p>
          <div className="mt-4">
            <DashboardControls
              query={query}
              onQueryChange={setQuery}
              dateFrom={dateFrom}
              onDateFromChange={setDateFrom}
              dateTo={dateTo}
              onDateToChange={setDateTo}
              onRefresh={loadDashboard}
              loading={loading}
              searchPlaceholder="Search queue and schedule"
            />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Pending Requests" value={summary.pendingRequests} tone="yellow" loading={loading} />
          <StatCard title="Completed Today" value={summary.completedToday} tone="green" loading={loading} />
          <StatCard title="High Priority" value={summary.highPriority} tone="red" loading={loading} />
          <StatCard title="Schedule Blocks" value={summary.scheduledBlocks} tone="blue" loading={loading} />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 lg:col-span-3">
            <h2 className="text-lg font-semibold text-slate-900">Request Queue</h2>
            <div className="mt-4 space-y-3">
              {filteredRequests.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={priorityVariant(item.priority)}>{item.priority}</Badge>
                      <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">Requester: {item.requester}</p>
                </div>
              ))}
              {filteredRequests.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                  {loading ? 'Loading requests...' : 'No pending request items.'}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900">Recent Schedule</h2>
            <div className="mt-4 space-y-3">
              {filteredSchedule.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.time}</p>
                  <p className="mt-1 text-xs text-slate-500">Owner: {item.owner}</p>
                </div>
              ))}
              {filteredSchedule.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                  {loading ? 'Loading schedule...' : 'No schedule items available.'}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  tone,
  loading,
}: {
  title: string;
  value: number;
  tone: 'blue' | 'green' | 'yellow' | 'red';
  loading: boolean;
}) {
  const toneClass: Record<typeof tone, string> = {
    blue: 'border-blue-200 bg-blue-50/80',
    green: 'border-emerald-200 bg-emerald-50/80',
    yellow: 'border-amber-200 bg-amber-50/80',
    red: 'border-rose-200 bg-rose-50/80',
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${toneClass[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{loading ? '...' : value.toLocaleString()}</p>
    </div>
  );
}
