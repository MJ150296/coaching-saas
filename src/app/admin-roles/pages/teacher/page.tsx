'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/shared/components/ui/Badge';
import { TableLoader } from '@/shared/components/ui/TableLoader';
import { UserRole } from '@/domains/user-management/domain/entities/User';

type TeacherRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  organizationId?: string;
  coachingCenterId?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
};

type UserMetaResponse = {
  items: TeacherRow[];
  total: number;
};

export default function TeacherAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadTeachers() {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({
          role: UserRole.TEACHER,
          withMeta: 'true',
          limit: '500',
          offset: '0',
        });
        const response = await fetch(`/api/admin/users?${params.toString()}`);
        const data = (await response.json()) as UserMetaResponse & { error?: string };
        if (!response.ok) throw new Error(data?.error || 'Failed to load teachers');
        if (!active) return;
        setTeachers(Array.isArray(data.items) ? data.items : []);
        setTotal(Number(data.total ?? 0));
      } catch (err) {
        if (active) setError(String(err));
      } finally {
        if (active) setLoading(false);
      }
    }
    loadTeachers();
    return () => {
      active = false;
    };
  }, []);

  const analytics = useMemo(() => {
    const activeCount = teachers.filter((item) => item.isActive).length;
    const verifiedCount = teachers.filter((item) => item.emailVerified).length;
    const coachingCenters = new Set(teachers.map((item) => item.coachingCenterId).filter(Boolean));
    return { activeCount, verifiedCount, coachingCentersCount: coachingCenters.size };
  }, [teachers]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-emerald-50/35 to-teal-50/40 p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Teacher Analytics</h1>
      <p className="mt-2 text-sm text-slate-600">Teacher table with status and verification analytics.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard title="Total Teachers" value={total} />
        <MetricCard title="Loaded Records" value={teachers.length} />
        <MetricCard title="Active Teachers" value={analytics.activeCount} />
        <MetricCard title="Email Verified" value={analytics.verifiedCount} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Coaching Center</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Created</th>
            </tr>
          </thead>
          {loading ? (
            <TableLoader columns={6} rows={8} />
          ) : (
            <tbody className="divide-y divide-slate-200 bg-white">
              {teachers.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2 text-sm text-slate-700">{item.firstName} {item.lastName}</td>
                  <td className="px-3 py-2 text-sm text-slate-700">{item.email}</td>
                  <td className="px-3 py-2 text-sm text-slate-700">{item.phone || '-'}</td>
                  <td className="px-3 py-2 text-sm">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={item.isActive ? 'green' : 'yellow'}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant={item.emailVerified ? 'blue' : 'gray'}>
                        {item.emailVerified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-sm text-slate-700">{item.coachingCenterId || '-'}</td>
                  <td className="px-3 py-2 text-sm text-slate-700">{new Date(item.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {!teachers.length && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-500">
                    {error || 'No teachers found in current scope.'}
                  </td>
                </tr>
              )}
            </tbody>
          )}
        </table>
      </div>

      <p className="mt-3 text-xs text-slate-500">Distinct coaching centers in dataset: {analytics.coachingCentersCount}</p>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
    </div>
  );
}
