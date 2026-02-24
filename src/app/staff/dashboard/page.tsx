'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Badge } from '@/shared/components/ui/Badge';
import { useToast } from '@/shared/components/ui/ToastProvider';

type RequestItem = {
  id: string;
  title: string;
  requester: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
};

type ScheduleItem = {
  id: string;
  title: string;
  time: string;
  owner: string;
};

type StaffDashboardResponse = {
  summary: {
    pendingRequests: number;
    completedToday: number;
    highPriority: number;
    scheduledBlocks: number;
  };
  requests: RequestItem[];
  schedule: ScheduleItem[];
};

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

export default function StaffDashboardPage() {
  const { data: session, status } = useSession();
  const { toastMessage } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<StaffDashboardResponse>({
    summary: { pendingRequests: 0, completedToday: 0, highPriority: 0, scheduledBlocks: 0 },
    requests: [],
    schedule: [],
  });

  useEffect(() => {
    if (status !== 'authenticated') return;
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      try {
        const response = await fetch('/api/staff/dashboard');
        const body = await response.json();
        if (!response.ok) {
          toastMessage(body?.error || 'Failed to load staff dashboard');
          return;
        }

        if (!active) return;
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
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [status, toastMessage]);

  const summary = useMemo(() => data.summary, [data.summary]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-orange-600"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const firstName = session?.user?.name?.split(' ')[0] ?? 'Staff';

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-orange-50/25 to-amber-50/45 py-8">
      <main className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-orange-100 bg-linear-to-r from-orange-600 via-amber-600 to-yellow-600 p-6 shadow-lg shadow-orange-200/70">
          <h1 className="text-2xl font-bold text-white">Welcome back, {firstName}</h1>
          <p className="mt-2 text-sm text-amber-50">
            Operational requests, processing queue, and today&apos;s support schedule.
          </p>
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
              {data.requests.map((item) => (
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
              {data.requests.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                  {loading ? 'Loading requests...' : 'No pending request items.'}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900">Recent Schedule</h2>
            <div className="mt-4 space-y-3">
              {data.schedule.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.time}</p>
                  <p className="mt-1 text-xs text-slate-500">Owner: {item.owner}</p>
                </div>
              ))}
              {data.schedule.length === 0 && (
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
