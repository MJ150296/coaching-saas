import { getAcademicEnterpriseAnalytics } from '@/shared/lib/enterprise-analytics.server';
import { CsvExportButton } from '@/shared/components/ui/CsvExportButton';
import { PdfExportButton } from '@/shared/components/ui/PdfExportButton';
import { MonthlyDeliveryAttendanceChart, AttendanceStatusMixChart } from './AcademicCharts';

type SearchParams = Record<string, string | string[] | undefined>;

function getParam(params: SearchParams, key: string): string | undefined {
  const value = params[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

function MetricCard({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-sm shadow-slate-200/70 hover:shadow-md transition-shadow duration-300">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export default async function AcademicAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const from = parseDate(getParam(resolvedSearchParams, 'from'));
  const to = parseDate(getParam(resolvedSearchParams, 'to'));
  const data = await getAcademicEnterpriseAnalytics({ from, to });

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50/40 to-sky-50/50 py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Hero Header Card */}
        <div className="rounded-2xl border border-indigo-100 bg-linear-to-r from-indigo-600 via-blue-600 to-sky-600 p-6 shadow-lg shadow-indigo-200/70 overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Academic Analytics</h2>
              <p className="mt-2 text-sm text-indigo-50">Session delivery quality, attendance reliability, and class utilization from live academic records.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30 transition-colors cursor-default">Sessions</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30 transition-colors cursor-default">Attendance</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30 transition-colors cursor-default">Performance</span>
            </div>
          </div>
        </div>

        {/* Date Range Filter Section */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-indigo-100 p-2">
              <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Date Range Filter</h3>
              <p className="text-sm text-gray-600 mt-1">Sessions and attendance filtered by range.</p>
            </div>
          </div>
          <form method="GET" className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">From</label>
              <input
                type="date"
                name="from"
                defaultValue={getParam(resolvedSearchParams, 'from') ?? ''}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">To</label>
              <input
                type="date"
                name="to"
                defaultValue={getParam(resolvedSearchParams, 'to') ?? ''}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div className="md:col-span-2 flex items-end gap-2">
              <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 shadow-md hover:shadow-lg hover:bg-indigo-700">
                Apply Date Range
              </button>
            </div>
          </form>
        </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-5">
        <MetricCard title="Sessions" value={data.summary.totalSessions.toLocaleString()} hint={`${data.summary.completedSessions.toLocaleString()} completed`} />
        <MetricCard title="Session Completion" value={`${data.summary.sessionCompletionRatePct}%`} hint={`${data.summary.cancelledSessions.toLocaleString()} cancelled`} />
        <MetricCard title="Attendance Quality" value={`${data.summary.attendanceQualityPct}%`} hint={`${data.summary.attendanceMarks.toLocaleString()} marks`} />
        <MetricCard title="Attendance Coverage" value={`${data.summary.attendanceCoveragePct}%`} />
        <MetricCard title="Total Students" value={data.summary.totalStudents.toLocaleString()} hint="Enrolled students" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">Monthly Delivery vs Attendance Quality</h2>
            <div className="flex items-center gap-2">
              <CsvExportButton
                filename="academic-monthly-delivery-attendance.csv"
                rows={data.trend.labels.map((label, idx) => ({
                  month: label,
                  completedSessions: data.trend.completedSessions[idx] ?? 0,
                  attendanceQualityPct: data.trend.attendanceQualityPct[idx] ?? 0,
                }))}
                columns={[
                  { key: 'month', label: 'Month' },
                  { key: 'completedSessions', label: 'Completed Sessions' },
                  { key: 'attendanceQualityPct', label: 'Attendance Quality %' },
                ]}
              />
              <PdfExportButton
                filename="academic-monthly-delivery-attendance.pdf"
                title="Academic Monthly Delivery vs Attendance"
                rows={data.trend.labels.map((label, idx) => ({
                  month: label,
                  completedSessions: data.trend.completedSessions[idx] ?? 0,
                  attendanceQualityPct: data.trend.attendanceQualityPct[idx] ?? 0,
                }))}
                columns={[
                  { key: 'month', label: 'Month' },
                  { key: 'completedSessions', label: 'Completed Sessions' },
                  { key: 'attendanceQualityPct', label: 'Attendance Quality %' },
                ]}
              />
            </div>
          </div>
          <div className="mt-4">
            <MonthlyDeliveryAttendanceChart data={data} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-800">Attendance Status Mix</h2>
          <div className="mt-4">
            <AttendanceStatusMixChart data={data} />
          </div>
        </div>
      </div>


      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-800">Batch Risk Ranking</h2>
          <div className="flex items-center gap-2">
            <CsvExportButton
              filename="academic-batch-risk.csv"
              rows={data.batchRiskTable}
              columns={[
                { key: 'batchId', label: 'Batch ID' },
                { key: 'activeStudents', label: 'Active Students' },
                { key: 'completedSessions', label: 'Completed Sessions' },
                { key: 'attendanceCoveragePct', label: 'Coverage %' },
                { key: 'absenceRatePct', label: 'Absence %' },
                { key: 'riskScore', label: 'Risk Score' },
              ]}
            />
            <PdfExportButton
              filename="academic-batch-risk.pdf"
              title="Academic Batch Risk Ranking"
              rows={data.batchRiskTable}
              columns={[
                { key: 'batchId', label: 'Batch ID' },
                { key: 'activeStudents', label: 'Active Students' },
                { key: 'completedSessions', label: 'Completed Sessions' },
                { key: 'attendanceCoveragePct', label: 'Coverage %' },
                { key: 'absenceRatePct', label: 'Absence %' },
                { key: 'riskScore', label: 'Risk Score' },
              ]}
            />
          </div>
        </div>
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
                  <td className="px-3 py-2 text-xs text-slate-600">
                    <a
                      href={`/admin-roles/manage-setting/coaching?tab=attendance&batchId=${encodeURIComponent(row.batchId)}`}
                      className="font-medium text-slate-700 hover:text-slate-900 hover:underline"
                    >
                      {row.batchId}
                    </a>
                  </td>
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

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-800">Recent Sessions (Drill to Attendance)</h2>
          <div className="flex items-center gap-2">
            <CsvExportButton
              filename="academic-recent-sessions.csv"
              rows={data.recentSessions}
              columns={[
                { key: 'sessionId', label: 'Session ID' },
                { key: 'topic', label: 'Topic' },
                { key: 'batchId', label: 'Batch ID' },
                { key: 'sessionDate', label: 'Session Date' },
                { key: 'status', label: 'Status' },
                { key: 'marked', label: 'Marked' },
                { key: 'present', label: 'Present' },
                { key: 'late', label: 'Late' },
                { key: 'absent', label: 'Absent' },
              ]}
            />
            <PdfExportButton
              filename="academic-recent-sessions.pdf"
              title="Academic Recent Sessions"
              rows={data.recentSessions}
              columns={[
                { key: 'sessionId', label: 'Session ID' },
                { key: 'topic', label: 'Topic' },
                { key: 'batchId', label: 'Batch ID' },
                { key: 'sessionDate', label: 'Session Date' },
                { key: 'status', label: 'Status' },
                { key: 'marked', label: 'Marked' },
                { key: 'present', label: 'Present' },
                { key: 'late', label: 'Late' },
                { key: 'absent', label: 'Absent' },
              ]}
            />
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Topic</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Session Date</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Batch ID</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Marked</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Present</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Late</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Absent</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {data.recentSessions.map((row) => (
                <tr key={row.sessionId}>
                  <td className="px-3 py-2 text-sm text-slate-700">
                    <a
                      href={`/admin-roles/manage-setting/coaching?tab=attendance&sessionId=${encodeURIComponent(row.sessionId)}`}
                      className="font-medium text-slate-700 hover:text-slate-900 hover:underline"
                    >
                      {row.topic}
                    </a>
                  </td>
                  <td className="px-3 py-2 text-sm text-slate-700">{row.sessionDate}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{row.batchId}</td>
                  <td className="px-3 py-2 text-right text-sm text-slate-700">{row.marked}</td>
                  <td className="px-3 py-2 text-right text-sm text-slate-700">{row.present}</td>
                  <td className="px-3 py-2 text-right text-sm text-slate-700">{row.late}</td>
                  <td className="px-3 py-2 text-right text-sm text-slate-700">{row.absent}</td>
                  <td className="px-3 py-2 text-sm text-slate-700">{row.status}</td>
                </tr>
              ))}
              {!data.recentSessions.length ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-sm text-slate-500">
                    No sessions found for the selected range.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </div>
  );
}
