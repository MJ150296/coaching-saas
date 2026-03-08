import { getClassesEnterpriseAnalytics } from '@/shared/lib/enterprise-analytics.server';

function MetricCard({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export default async function ClassesAnalyticsPage() {
  const data = await getClassesEnterpriseAnalytics();

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-violet-50/35 to-indigo-50/45 p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Classes Analytics</h1>
      <p className="mt-2 text-sm text-slate-600">Enterprise class load analytics with seat pressure, staffing coverage, and distribution risk.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-5">
        <MetricCard title="Total Classes" value={data.summary.totalClasses.toLocaleString()} />
        <MetricCard title="Total Sections" value={data.summary.totalSections.toLocaleString()} />
        <MetricCard title="Total Enrollments" value={data.summary.totalEnrollments.toLocaleString()} />
        <MetricCard title="Students / Section" value={`${data.summary.studentsPerSection}`} hint={`${data.summary.studentsPerTeacher} students / teacher`} />
        <MetricCard title="Distribution Risk" value={`${data.summary.enrollmentDistributionGini}`} hint={`Top 20% hold ${data.summary.enrollmentConcentrationTop20Pct}%`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard title="Sectionless Classes" value={data.summary.sectionlessClasses.toLocaleString()} />
        <MetricCard title="Overloaded Sections" value={data.summary.overloadedSections.toLocaleString()} />
        <MetricCard title="Teachers" value={data.summary.totalTeacherCount.toLocaleString()} />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-800">Class Density Leaderboard</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Class</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Level</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Sections</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Students</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Avg / Section</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Teacher Coverage</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Seat Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {data.classRows.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-2 text-sm font-medium text-slate-800">{row.className}</td>
                  <td className="px-3 py-2 text-sm text-slate-700">{row.level}</td>
                  <td className="px-3 py-2 text-right text-sm text-slate-700">{row.sections}</td>
                  <td className="px-3 py-2 text-right text-sm text-slate-700">{row.students}</td>
                  <td className="px-3 py-2 text-right text-sm text-slate-700">{row.avgStudentsPerSection}</td>
                  <td className="px-3 py-2 text-right text-sm text-slate-700">{row.teacherCoveragePct}%</td>
                  <td className="px-3 py-2 text-right text-sm font-semibold text-slate-800">{row.seatUtilizationPct}%</td>
                </tr>
              ))}
              {!data.classRows.length ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-sm text-slate-500">
                    No class analytics found in current tenant scope.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-800">Section Hotspots</h2>
        <p className="mt-1 text-xs text-slate-500">Sorted by highest seat utilization pressure.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Section</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Class ID</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Students</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Capacity</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {data.sectionHotspots.map((row) => (
                <tr key={row.sectionId}>
                  <td className="px-3 py-2 text-sm text-slate-700">{row.sectionName}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{row.classMasterId}</td>
                  <td className="px-3 py-2 text-right text-sm text-slate-700">{row.students}</td>
                  <td className="px-3 py-2 text-right text-sm text-slate-700">{row.capacity}</td>
                  <td className="px-3 py-2 text-right text-sm font-semibold text-slate-800">{row.utilizationPct}%</td>
                </tr>
              ))}
              {!data.sectionHotspots.length ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-500">
                    No section pressure indicators available.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
