'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Badge } from '@/shared/components/ui/Badge';
import { PageLoader } from '@/shared/components/ui/PageLoader';
import { useToast } from '@/shared/components/ui/ToastProvider';

type ChildOverview = {
  id: string;
  name: string;
  classLabel: string;
  attendance: number;
  pendingFees: number;
};

type NoticeItem = {
  id: string;
  title: string;
  date: string;
  category: 'academic' | 'fees' | 'general';
};

type HomeworkItem = {
  id: string;
  childName: string;
  subject: string;
  dueDate: string;
  status: 'assigned' | 'submitted' | 'overdue';
};

type ParentDashboardResponse = {
  summary: {
    childCount: number;
    pendingFees: number;
    activeEnrollments: number;
    overdueItems: number;
  };
  children: ChildOverview[];
  notices: NoticeItem[];
  homework: HomeworkItem[];
};

function noticeVariant(category: NoticeItem['category']): 'blue' | 'orange' | 'gray' {
  if (category === 'academic') return 'blue';
  if (category === 'fees') return 'orange';
  return 'gray';
}

function homeworkVariant(status: HomeworkItem['status']): 'yellow' | 'green' | 'red' {
  if (status === 'submitted') return 'green';
  if (status === 'overdue') return 'red';
  return 'yellow';
}

export default function ParentDashboardPage() {
  const { data: session, status } = useSession();
  const { toastMessage } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ParentDashboardResponse>({
    summary: { childCount: 0, pendingFees: 0, activeEnrollments: 0, overdueItems: 0 },
    children: [],
    notices: [],
    homework: [],
  });

  useEffect(() => {
    if (status !== 'authenticated') return;
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      try {
        const response = await fetch('/api/parent/dashboard');
        const body = await response.json();
        if (!response.ok) {
          toastMessage(body?.error || 'Failed to load parent dashboard');
          return;
        }

        if (!active) return;
        setData({
          summary: {
            childCount: Number(body?.summary?.childCount ?? 0),
            pendingFees: Number(body?.summary?.pendingFees ?? 0),
            activeEnrollments: Number(body?.summary?.activeEnrollments ?? 0),
            overdueItems: Number(body?.summary?.overdueItems ?? 0),
          },
          children: Array.isArray(body?.children) ? body.children : [],
          notices: Array.isArray(body?.notices) ? body.notices : [],
          homework: Array.isArray(body?.homework) ? body.homework : [],
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
      <PageLoader
        message="Loading dashboard..."
        spinnerClassName="h-12 w-12 border-b-2 border-indigo-600"
        containerClassName="min-h-screen flex items-center justify-center bg-slate-50"
        messageClassName="mt-4 text-slate-600"
      />
    );
  }

  const firstName = session?.user?.name?.split(' ')[0] ?? 'Parent';

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50/30 to-pink-50/30 py-8">
      <main className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-indigo-100 bg-linear-to-r from-indigo-600 via-blue-600 to-rose-600 p-6 shadow-lg shadow-indigo-200/70">
          <h1 className="text-2xl font-bold text-white">Welcome, {firstName}</h1>
          <p className="mt-2 text-sm text-indigo-50">
            Track attendance, fee dues, recent payments, and coaching notices for your children.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Children" value={summary.childCount} tone="blue" loading={loading} />
          <StatCard title="Active Enrollments" value={summary.activeEnrollments} tone="green" loading={loading} />
          <StatCard title="Pending Fees" value={summary.pendingFees} tone="orange" loading={loading} />
          <StatCard title="Overdue Items" value={summary.overdueItems} tone="red" loading={loading} />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900">Children Overview</h2>
            <div className="mt-4 space-y-3">
              {data.children.map((child) => (
                <div key={child.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="font-medium text-slate-900">{child.name}</p>
                  <p className="mt-1 text-sm text-slate-600">Class: {child.classLabel}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Pending Fees: {child.pendingFees > 0 ? `INR ${child.pendingFees.toLocaleString()}` : 'None'}
                  </p>
                </div>
              ))}
              {data.children.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                  {loading ? 'Loading children...' : 'No linked children found.'}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 lg:col-span-3">
            <h2 className="text-lg font-semibold text-slate-900">Notices & Updates</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Latest Notices</p>
                {data.notices.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <Badge variant={noticeVariant(item.category)}>{item.category}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{new Date(item.date).toLocaleDateString()}</p>
                  </div>
                ))}
                {data.notices.length === 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                    {loading ? 'Loading notices...' : 'No notices available.'}
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent Payments</p>
                {data.homework.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-slate-900">{item.subject}</p>
                      <Badge variant={homeworkVariant(item.status)}>{item.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{item.childName}</p>
                    <p className="mt-1 text-sm text-slate-600">Date: {new Date(item.dueDate).toLocaleDateString()}</p>
                  </div>
                ))}
                {data.homework.length === 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                    {loading ? 'Loading payments...' : 'No recent payments found.'}
                  </div>
                )}
              </div>
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
  tone: 'blue' | 'green' | 'orange' | 'red';
  loading: boolean;
}) {
  const toneClass: Record<typeof tone, string> = {
    blue: 'border-blue-200 bg-blue-50/80',
    green: 'border-emerald-200 bg-emerald-50/80',
    orange: 'border-orange-200 bg-orange-50/80',
    red: 'border-rose-200 bg-rose-50/80',
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${toneClass[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{loading ? '...' : value.toLocaleString()}</p>
    </div>
  );
}
