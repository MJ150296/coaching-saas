import { getAcademicEnterpriseAnalytics } from '@/shared/lib/enterprise-analytics.server';

function MetricCard({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export default async function AcademicAnalyticsPage() {
  const data = await getAcademicEnterpriseAnalytics();

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50/40 to-sky-50/50 p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Academic Analytics</h1>
      <p className="mt-2 text-sm text-slate-600">Session delivery quality, attendance reliability, and class utilization from live academic records.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-5">
        <MetricCard title="Sessions" value={data.summary.totalSessions.toLocaleString()} hint={`${data.summary.completedSessions.toLocaleString()} completed`} />
        <MetricCard title="Session Completion" value={`${data.summary.sessionCompletionRatePct}%`} hint={`${data.summary.cancelledSessions.toLocaleString()} cancelled`} />
        <MetricCard title="Attendance Quality" value={`${data.summary.attendanceQualityPct}%`} hint={`${data.summary.attendanceMarks.toLocaleString()} marks`} />
        <MetricCard title="Attendance Coverage" value={`${data.summary.attendanceCoveragePct}%`} />
        <MetricCard title="Seat Utilization" value={`${data.summary.sectionSeatUtilizationPct}%`} hint={`${data.summary.totalStudents.toLocaleString()} enrolled`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-800">Monthly Delivery vs Attendance Quality</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-2 py-2 text-left">Month</th>
                  <th className="px-2 py-2 text-right">Completed Sessions</th>
                  <th className="px-2 py-2 text-right">Attendance Quality %</th>
                </tr>
              </thead>
              <tbody>
                {data.trend.labels.map((label, idx) => (
                  <tr key={label} className="border-t border-slate-100">
                    <td className="px-2 py-2 text-slate-700">{label}</td>
                    <td className="px-2 py-2 text-right text-slate-700">{data.trend.completedSessions[idx] ?? 0}</td>
                    <td className="px-2 py-2 text-right text-slate-700">{data.trend.attendanceQualityPct[idx] ?? 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-800">Attendance Status Mix</h2>
          <div className="mt-3 space-y-3">
            {[
              { label: 'Present', value: data.summary.presentRatePct, color: 'bg-emerald-500' },
              { label: 'Late', value: data.summary.lateRatePct, color: 'bg-amber-500' },
              { label: 'Absent', value: data.summary.absentRatePct, color: 'bg-rose-500' },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <span>{row.label}</span>
                  <span>{row.value}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100">
                  <div className={`h-2 rounded-full ${row.color}`} style={{ width: `${Math.min(100, row.value)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-800">Class Utilization (Top by Seat Pressure)</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Class</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Sections</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Students</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Avg/Section</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Known Capacity</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {data.classUtilizationTable.map((row) => (
                <tr key={row.classId}>
                  <td className="px-3 py-2 text-sm text-slate-700">{row.className}</td>
                  <td className="px-3 py-2 text-right text-sm text-slate-700">{row.sections}</td>
                  <td className="px-3 py-2 text-right text-sm text-slate-700">{row.students}</td>
                  <td className="px-3 py-2 text-right text-sm text-slate-700">{row.avgStudentsPerSection}</td>
                  <td className="px-3 py-2 text-right text-sm text-slate-700">{row.knownCapacity}</td>
                  <td className="px-3 py-2 text-right text-sm font-semibold text-slate-800">{row.utilizationPct}%</td>
                </tr>
              ))}
              {!data.classUtilizationTable.length ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-500">
                    No class utilization records available.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-800">Batch Risk Ranking</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Batch ID</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Active Students</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Completed Sessions</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Coverage %</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Absence %</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Risk Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {data.batchRiskTable.map((row) => (
                <tr key={row.batchId}>
                  <td className="px-3 py-2 text-xs text-slate-600">{row.batchId}</td>
                  <td className="px-3 py-2 text-right text-sm text-slate-700">{row.activeStudents}</td>
                  <td className="px-3 py-2 text-right text-sm text-slate-700">{row.completedSessions}</td>
                  <td className="px-3 py-2 text-right text-sm text-slate-700">{row.attendanceCoveragePct}%</td>
                  <td className="px-3 py-2 text-right text-sm text-slate-700">{row.absenceRatePct}%</td>
                  <td className="px-3 py-2 text-right text-sm font-semibold text-slate-800">{row.riskScore}</td>
                </tr>
              ))}
              {!data.batchRiskTable.length ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-500">
                    No batch risk signals found.
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
