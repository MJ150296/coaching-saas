'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Badge } from '@/shared/components/ui/Badge';
import { useToast } from '@/shared/components/ui/ToastProvider';

type ClassItem = {
  id: string;
  classLabel: string;
  subject: string;
  slot: string;
  room: string;
  studentCount: number;
};

type TaskItem = {
  id: string;
  title: string;
  classLabel: string;
  dueDate: string;
  status: 'pending' | 'in-review' | 'completed';
};

type TeacherDashboardResponse = {
  summary: {
    totalClasses: number;
    totalStudents: number;
    pendingTasks: number;
    completedTasks: number;
  };
  todayClasses: ClassItem[];
  tasks: TaskItem[];
};

function taskVariant(status: TaskItem['status']): 'yellow' | 'blue' | 'green' {
  if (status === 'completed') return 'green';
  if (status === 'in-review') return 'blue';
  return 'yellow';
}

export default function TeacherDashboardPage() {
  const { data: session, status } = useSession();
  const { toastMessage } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TeacherDashboardResponse>({
    summary: { totalClasses: 0, totalStudents: 0, pendingTasks: 0, completedTasks: 0 },
    todayClasses: [],
    tasks: [],
  });

  useEffect(() => {
    if (status !== 'authenticated') return;
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      try {
        const response = await fetch('/api/teacher/dashboard');
        const body = await response.json();
        if (!response.ok) {
          toastMessage(body?.error || 'Failed to load teacher dashboard');
          return;
        }

        if (!active) return;
        setData({
          summary: {
            totalClasses: Number(body?.summary?.totalClasses ?? 0),
            totalStudents: Number(body?.summary?.totalStudents ?? 0),
            pendingTasks: Number(body?.summary?.pendingTasks ?? 0),
            completedTasks: Number(body?.summary?.completedTasks ?? 0),
          },
          todayClasses: Array.isArray(body?.todayClasses) ? body.todayClasses : [],
          tasks: Array.isArray(body?.tasks) ? body.tasks : [],
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
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const firstName = session?.user?.name?.split(' ')[0] ?? 'Teacher';

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-emerald-50/25 to-teal-50/40 py-8">
      <main className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-emerald-100 bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 shadow-lg shadow-emerald-200/70">
          <h1 className="text-2xl font-bold text-white">Welcome back, {firstName}</h1>
          <p className="mt-2 text-sm text-emerald-50">
            Today&apos;s classroom overview, grading queue, and timetable at one place.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Classes Today" value={summary.totalClasses} tone="blue" loading={loading} />
          <StatCard title="Students Today" value={summary.totalStudents} tone="green" loading={loading} />
          <StatCard title="Pending Tasks" value={summary.pendingTasks} tone="yellow" loading={loading} />
          <StatCard title="Completed" value={summary.completedTasks} tone="gray" loading={loading} />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 lg:col-span-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Today&apos;s Classes</h2>
              <Badge variant="green">{data.todayClasses.length} sessions</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {data.todayClasses.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{item.subject} · {item.classLabel}</p>
                    <p className="text-sm font-medium text-slate-600">{item.slot}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">Room: {item.room} · Students: {item.studentCount}</p>
                </div>
              ))}
              {data.todayClasses.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                  {loading ? 'Loading classes...' : 'No classes found for today.'}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900">Task Queue</h2>
            <div className="mt-4 space-y-3">
              {data.tasks.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <Badge variant={taskVariant(item.status)}>{item.status.replace('-', ' ')}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{item.classLabel} · Due {new Date(item.dueDate).toLocaleDateString()}</p>
                </div>
              ))}
              {data.tasks.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                  {loading ? 'Loading tasks...' : 'No tasks available.'}
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
  tone: 'gray' | 'blue' | 'green' | 'yellow';
  loading: boolean;
}) {
  const toneClass: Record<typeof tone, string> = {
    gray: 'border-slate-200 bg-slate-50/80',
    blue: 'border-blue-200 bg-blue-50/80',
    green: 'border-emerald-200 bg-emerald-50/80',
    yellow: 'border-amber-200 bg-amber-50/80',
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${toneClass[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{loading ? '...' : value.toLocaleString()}</p>
    </div>
  );
}
