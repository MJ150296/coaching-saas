'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/shared/components/ui/Badge';
import { TableLoader } from '@/shared/components/ui/TableLoader';
import { UserRole } from '@/domains/user-management/domain/entities/User';

type StudentRow = {
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
  items: StudentRow[];
  total: number;
};

export default function StudentAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadStudents() {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({
          role: UserRole.STUDENT,
          withMeta: 'true',
          limit: '500',
          offset: '0',
        });
        const response = await fetch(`/api/admin/users?${params.toString()}`);
        const data = (await response.json()) as UserMetaResponse & { error?: string };
        if (!response.ok) throw new Error(data?.error || 'Failed to load students');
        if (!active) return;
        setStudents(Array.isArray(data.items) ? data.items : []);
        setTotal(Number(data.total ?? 0));
      } catch (err) {
        if (active) setError(String(err));
      } finally {
        if (active) setLoading(false);
      }
    }
    loadStudents();
    return () => {
      active = false;
    };
  }, []);

  const analytics = useMemo(() => {
    const activeCount = students.filter((item) => item.isActive).length;
    const verifiedCount = students.filter((item) => item.emailVerified).length;
    const coachingCenters = new Set(students.map((item) => item.coachingCenterId).filter(Boolean));
    return { activeCount, verifiedCount, coachingCentersCount: coachingCenters.size };
  }, [students]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-cyan-50/40 to-blue-50/50 p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Student Analytics</h1>
      <p className="mt-2 text-sm text-slate-600">Student table with scope-aware summary metrics.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard title="Total Students" value={total} />
        <MetricCard title="Loaded Records" value={students.length} />
        <MetricCard title="Active Students" value={analytics.activeCount} />
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
              {students.map((item) => (
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
              {!students.length && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-500">
                    {error || 'No students found in current scope.'}
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
