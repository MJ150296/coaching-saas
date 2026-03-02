'use client';

import { useEffect, useMemo, useState } from 'react';
import { TableLoader } from '@/shared/components/ui/TableLoader';

type ClassRow = {
  id: string;
  name: string;
  level?: string;
  organizationId?: string;
  schoolId?: string;
};

type SectionRow = {
  id: string;
  classMasterId: string;
  classTeacherId?: string;
};

type EnrollmentRow = {
  id: string;
  classMasterId: string;
};

type MetaResponse<T> = {
  items: T[];
  total: number;
};

type EnrollmentResponse = {
  enrollments: EnrollmentRow[];
  total: number;
};

export default function ClassesAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [totalClasses, setTotalClasses] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [classRes, sectionRes, enrollmentRes] = await Promise.all([
          fetch('/api/admin/class-masters?withMeta=true&limit=500&offset=0'),
          fetch('/api/admin/sections?withMeta=true&limit=500&offset=0'),
          fetch('/api/admin/enrollments?limit=1000&offset=0'),
        ]);

        const classData = (await classRes.json()) as MetaResponse<ClassRow> & { error?: string };
        const sectionData = (await sectionRes.json()) as MetaResponse<SectionRow> & { error?: string };
        const enrollmentData = (await enrollmentRes.json()) as EnrollmentResponse & { error?: string };

        if (!classRes.ok) throw new Error(classData?.error || 'Failed to load class masters');
        if (!sectionRes.ok) throw new Error(sectionData?.error || 'Failed to load sections');
        if (!enrollmentRes.ok) throw new Error(enrollmentData?.error || 'Failed to load enrollments');

        if (!active) return;
        setClasses(Array.isArray(classData.items) ? classData.items : []);
        setSections(Array.isArray(sectionData.items) ? sectionData.items : []);
        setEnrollments(Array.isArray(enrollmentData.enrollments) ? enrollmentData.enrollments : []);
        setTotalClasses(Number(classData.total ?? 0));
      } catch (err) {
        if (active) setError(String(err));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const sectionCountByClass = useMemo(() => {
    const map = new Map<string, number>();
    for (const section of sections) {
      map.set(section.classMasterId, (map.get(section.classMasterId) ?? 0) + 1);
    }
    return map;
  }, [sections]);

  const enrollmentCountByClass = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of enrollments) {
      map.set(item.classMasterId, (map.get(item.classMasterId) ?? 0) + 1);
    }
    return map;
  }, [enrollments]);

  const totalSections = sections.length;
  const totalEnrollments = enrollments.length;
  const avgStudentsPerClass = classes.length ? Math.round((totalEnrollments / classes.length) * 10) / 10 : 0;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-violet-50/35 to-indigo-50/45 p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Classes Analytics</h1>
      <p className="mt-2 text-sm text-slate-600">Class-wise sections and enrollment distribution.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard title="Total Classes" value={totalClasses} />
        <MetricCard title="Loaded Classes" value={classes.length} />
        <MetricCard title="Total Sections" value={totalSections} />
        <MetricCard title="Avg Students/Class" value={avgStudentsPerClass} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Class</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Level</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Sections</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Enrolled Students</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Class ID</th>
            </tr>
          </thead>
          {loading ? (
            <TableLoader columns={5} rows={8} />
          ) : (
            <tbody className="divide-y divide-slate-200 bg-white">
              {classes.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2 text-sm font-medium text-slate-800">{item.name}</td>
                  <td className="px-3 py-2 text-sm text-slate-700">{item.level || '-'}</td>
                  <td className="px-3 py-2 text-sm text-slate-700">{sectionCountByClass.get(item.id) ?? 0}</td>
                  <td className="px-3 py-2 text-sm text-slate-700">{enrollmentCountByClass.get(item.id) ?? 0}</td>
                  <td className="px-3 py-2 text-xs text-slate-500">{item.id}</td>
                </tr>
              ))}
              {!classes.length && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-500">
                    {error || 'No class data found in current scope.'}
                  </td>
                </tr>
              )}
            </tbody>
          )}
        </table>
      </div>
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
