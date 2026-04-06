import { getProgramsBatchesEnterpriseAnalytics } from '@/shared/lib/enterprise-analytics.server';
import { CsvExportButton } from '@/shared/components/ui/CsvExportButton';
import { PdfExportButton } from '@/shared/components/ui/PdfExportButton';
import { MonthlyEnrollmentSessionsChart, StatusDistributionChart, ProgramPerformanceChart, BatchRiskRankingChart } from './ProgramsBatchesCharts';
import Link from 'next/link';

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

export default async function ProgramsBatchesAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const from = parseDate(getParam(resolvedSearchParams, 'from'));
  const to = parseDate(getParam(resolvedSearchParams, 'to'));
  const data = await getProgramsBatchesEnterpriseAnalytics({ from, to });

  const enrollmentSessionsData = data.trend.labels.map((label: string, idx: number) => ({
    month: label,
    enrollments: data.trend.enrollments[idx] ?? 0,
    sessions: data.trend.sessions[idx] ?? 0,
  }));

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-purple-50/40 to-violet-50/50 py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Hero Header Card */}
        <div className="rounded-2xl border border-purple-100 bg-linear-to-r from-purple-600 via-violet-600 to-indigo-600 p-6 shadow-lg shadow-purple-200/70 overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Programs & Batches Analytics</h2>
              <p className="mt-2 text-sm text-purple-50">Comprehensive view of coaching programs, batch performance, enrollment trends, and attendance quality.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30 transition-colors cursor-default">Programs</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30 transition-colors cursor-default">Batches</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30 transition-colors cursor-default">Performance</span>
            </div>
          </div>
        </div>

        {/* Date Range Filter Section */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-purple-100 p-2">
              <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Date Range Filter</h3>
              <p className="text-sm text-gray-600 mt-1">Programs and batches filtered by range.</p>
            </div>
          </div>
          <form method="GET" className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">From</label>
              <input
                type="date"
                name="from"
                defaultValue={getParam(resolvedSearchParams, 'from') ?? ''}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">To</label>
              <input
                type="date"
                name="to"
                defaultValue={getParam(resolvedSearchParams, 'to') ?? ''}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />
            </div>
            <div className="md:col-span-2 flex items-end gap-2">
              <button type="submit" className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 shadow-md hover:shadow-lg hover:bg-purple-700">
                Apply Date Range
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-5">
          <MetricCard title="Programs" value={data.summary.totalPrograms.toLocaleString()} hint={`${data.summary.activePrograms.toLocaleString()} active`} />
          <MetricCard title="Batches" value={data.summary.totalBatches.toLocaleString()} hint={`${data.summary.activeBatches.toLocaleString()} active`} />
          <MetricCard title="Enrollments" value={data.summary.activeEnrollments.toLocaleString()} hint={`of ${data.summary.totalEnrollments.toLocaleString()} total`} />
          <MetricCard title="Sessions Completed" value={`${data.summary.sessionCompletionRatePct}%`} hint={`${data.summary.completedSessions.toLocaleString()} of ${data.summary.totalSessions.toLocaleString()}`} />
          <MetricCard title="Attendance Quality" value={`${data.summary.attendanceQualityPct}%`} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricCard title="Seat Utilization" value={`${data.summary.seatUtilizationPct}%`} />
          <MetricCard title="Overloaded Batches" value={data.summary.overloadedBatches.toLocaleString()} hint="Batches exceeding capacity" />
          <MetricCard title="Faculty-less Batches" value={data.summary.facultyLessBatches.toLocaleString()} hint="Batches without assigned faculty" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Monthly Enrollment vs Sessions Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-sm font-semibold text-slate-800">Monthly Enrollment vs Sessions</h2>
              <div className="flex items-center gap-2">
                <CsvExportButton
                  filename="programs-batches-monthly-trend.csv"
                  rows={enrollmentSessionsData}
                  columns={[
                    { key: 'month', label: 'Month' },
                    { key: 'enrollments', label: 'Enrollments' },
                    { key: 'sessions', label: 'Sessions' },
                  ]}
                />
                <PdfExportButton
                  filename="programs-batches-monthly-trend.pdf"
                  title="Programs & Batches Monthly Trend"
                  rows={enrollmentSessionsData}
                  columns={[
                    { key: 'month', label: 'Month' },
                    { key: 'enrollments', label: 'Enrollments' },
                    { key: 'sessions', label: 'Sessions' },
                  ]}
                />
              </div>
            </div>
            <MonthlyEnrollmentSessionsChart data={data} />
          </div>

          {/* Status Distribution Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">Status Distribution</h2>
            <StatusDistributionChart data={data} />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Program Performance Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-sm font-semibold text-slate-800">Program Performance (Top 10)</h2>
              <div className="flex items-center gap-2">
                <CsvExportButton
                  filename="programs-performance.csv"
                  rows={data.programRows}
                  columns={[
                    { key: 'name', label: 'Program' },
                    { key: 'code', label: 'Code' },
                    { key: 'activeEnrollments', label: 'Active Enrollments' },
                    { key: 'sessionCompletionRatePct', label: 'Completion Rate %' },
                  ]}
                />
                <PdfExportButton
                  filename="programs-performance.pdf"
                  title="Programs Performance"
                  rows={data.programRows}
                  columns={[
                    { key: 'name', label: 'Program' },
                    { key: 'code', label: 'Code' },
                    { key: 'activeEnrollments', label: 'Active Enrollments' },
                    { key: 'sessionCompletionRatePct', label: 'Completion Rate %' },
                  ]}
                />
              </div>
            </div>
            <ProgramPerformanceChart data={data} />
          </div>

          {/* Batch Risk Ranking Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-sm font-semibold text-slate-800">Batch Risk Ranking (Top 10)</h2>
              <div className="flex items-center gap-2">
                <CsvExportButton
                  filename="batches-risk-ranking.csv"
                  rows={data.batchRows}
                  columns={[
                    { key: 'name', label: 'Batch' },
                    { key: 'riskScore', label: 'Risk Score' },
                    { key: 'seatUtilizationPct', label: 'Utilization %' },
                    { key: 'attendanceQualityPct', label: 'Attendance Quality %' },
                  ]}
                />
                <PdfExportButton
                  filename="batches-risk-ranking.pdf"
                  title="Batch Risk Ranking"
                  rows={data.batchRows}
                  columns={[
                    { key: 'name', label: 'Batch' },
                    { key: 'riskScore', label: 'Risk Score' },
                    { key: 'seatUtilizationPct', label: 'Utilization %' },
                    { key: 'attendanceQualityPct', label: 'Attendance Quality %' },
                  ]}
                />
              </div>
            </div>
            <BatchRiskRankingChart data={data} />
          </div>
        </div>

        {/* Program Performance Table */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Program Performance Details</h2>
            <div className="flex items-center gap-2">
              <CsvExportButton
                filename="programs-performance-details.csv"
                rows={data.programRows}
                columns={[
                  { key: 'name', label: 'Program' },
                  { key: 'code', label: 'Code' },
                  { key: 'classLevel', label: 'Class Level' },
                  { key: 'board', label: 'Board' },
                  { key: 'status', label: 'Status' },
                  { key: 'batches', label: 'Batches' },
                  { key: 'activeEnrollments', label: 'Active Enrollments' },
                  { key: 'totalEnrollments', label: 'Total Enrollments' },
                  { key: 'completedSessions', label: 'Completed Sessions' },
                  { key: 'totalSessions', label: 'Total Sessions' },
                  { key: 'sessionCompletionRatePct', label: 'Completion Rate %' },
                ]}
              />
              <PdfExportButton
                filename="programs-performance-details.pdf"
                title="Programs Performance Details"
                rows={data.programRows}
                columns={[
                  { key: 'name', label: 'Program' },
                  { key: 'code', label: 'Code' },
                  { key: 'classLevel', label: 'Class Level' },
                  { key: 'board', label: 'Board' },
                  { key: 'status', label: 'Status' },
                  { key: 'batches', label: 'Batches' },
                  { key: 'activeEnrollments', label: 'Active Enrollments' },
                  { key: 'totalEnrollments', label: 'Total Enrollments' },
                  { key: 'completedSessions', label: 'Completed Sessions' },
                  { key: 'totalSessions', label: 'Total Sessions' },
                  { key: 'sessionCompletionRatePct', label: 'Completion Rate %' },
                ]}
              />
            </div>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Program</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Code</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Level</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Board</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Batches</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Active Enrollments</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Sessions</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {data.programRows.map((row) => (
                  <tr key={row.programId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2 text-sm font-medium text-slate-700">{row.name}</td>
                    <td className="px-3 py-2 text-sm text-slate-600">{row.code ?? '-'}</td>
                    <td className="px-3 py-2 text-sm text-slate-600">{row.classLevel ?? '-'}</td>
                    <td className="px-3 py-2 text-sm text-slate-600">{row.board ?? '-'}</td>
                    <td className="px-3 py-2 text-sm text-slate-600">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-sm text-slate-700">{row.batches}</td>
                    <td className="px-3 py-2 text-right text-sm text-slate-700">{row.activeEnrollments.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-sm text-slate-700">{row.completedSessions}/{row.totalSessions}</td>
                    <td className="px-3 py-2 text-right text-sm font-semibold text-slate-800">{row.sessionCompletionRatePct}%</td>
                  </tr>
                ))}
                {!data.programRows.length ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-sm text-slate-500">
                      No programs found for the selected range.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        {/* Batch Risk Ranking Table */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Batch Risk Ranking</h2>
            <div className="flex items-center gap-2">
              <CsvExportButton
                filename="batches-risk-ranking-details.csv"
                rows={data.batchRows}
                columns={[
                  { key: 'name', label: 'Batch' },
                  { key: 'programId', label: 'Program ID' },
                  { key: 'facultyName', label: 'Faculty' },
                  { key: 'capacity', label: 'Capacity' },
                  { key: 'activeEnrollments', label: 'Active Enrollments' },
                  { key: 'seatUtilizationPct', label: 'Utilization %' },
                  { key: 'completedSessions', label: 'Completed Sessions' },
                  { key: 'attendanceQualityPct', label: 'Attendance Quality %' },
                  { key: 'attendanceCoveragePct', label: 'Coverage %' },
                  { key: 'riskScore', label: 'Risk Score' },
                ]}
              />
              <PdfExportButton
                filename="batches-risk-ranking-details.pdf"
                title="Batch Risk Ranking Details"
                rows={data.batchRows}
                columns={[
                  { key: 'name', label: 'Batch' },
                  { key: 'programId', label: 'Program ID' },
                  { key: 'facultyName', label: 'Faculty' },
                  { key: 'capacity', label: 'Capacity' },
                  { key: 'activeEnrollments', label: 'Active Enrollments' },
                  { key: 'seatUtilizationPct', label: 'Utilization %' },
                  { key: 'completedSessions', label: 'Completed Sessions' },
                  { key: 'attendanceQualityPct', label: 'Attendance Quality %' },
                  { key: 'attendanceCoveragePct', label: 'Coverage %' },
                  { key: 'riskScore', label: 'Risk Score' },
                ]}
              />
            </div>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Batch</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Faculty</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Capacity</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Enrolled</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Utilization</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Sessions</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Attendance Quality</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Coverage</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Risk Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {data.batchRows.map((row) => (
                  <tr key={row.batchId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2 text-sm text-slate-700">
                      <Link
                        href={`/admin-roles/manage-setting/coaching?tab=attendance&batchId=${encodeURIComponent(row.batchId)}`}
                        className="font-medium text-slate-700 hover:text-slate-900 hover:underline"
                      >
                        {row.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-600">{row.facultyName}</td>
                    <td className="px-3 py-2 text-right text-sm text-slate-700">{row.capacity}</td>
                    <td className="px-3 py-2 text-right text-sm text-slate-700">{row.activeEnrollments}</td>
                    <td className="px-3 py-2 text-right text-sm text-slate-700">
                      <span className={row.seatUtilizationPct > 100 ? 'text-rose-600 font-semibold' : ''}>
                        {row.seatUtilizationPct}%
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-sm text-slate-700">{row.completedSessions}/{row.totalSessions}</td>
                    <td className="px-3 py-2 text-right text-sm text-slate-700">{row.attendanceQualityPct}%</td>
                    <td className="px-3 py-2 text-right text-sm text-slate-700">{row.attendanceCoveragePct}%</td>
                    <td className="px-3 py-2 text-right text-sm font-semibold text-slate-800">{row.riskScore}</td>
                  </tr>
                ))}
                {!data.batchRows.length ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-sm text-slate-500">
                      No batches found for the selected range.
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
