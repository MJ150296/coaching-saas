import { getUsersEnterpriseAnalytics } from '@/shared/lib/enterprise-analytics.server';
import { CsvExportButton } from '@/shared/components/ui/CsvExportButton';
import { PdfExportButton } from '@/shared/components/ui/PdfExportButton';
import { RoleCompositionChart, MonthlyOnboardingTrendChart } from './UsersCharts';

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

export default async function UsersAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const from = parseDate(getParam(resolvedSearchParams, 'from'));
  const to = parseDate(getParam(resolvedSearchParams, 'to'));
  const data = await getUsersEnterpriseAnalytics({ from, to });

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-sky-50/40 to-cyan-50/50 py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Hero Header Card */}
        <div className="rounded-2xl border border-sky-100 bg-linear-to-r from-sky-600 via-cyan-600 to-teal-600 p-6 shadow-lg shadow-sky-200/70 overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Users Analytics</h2>
              <p className="mt-2 text-sm text-sky-50">Real-time user mix, growth velocity, and compliance risk from live tenant data.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30 transition-colors cursor-default">Users</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30 transition-colors cursor-default">Growth</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30 transition-colors cursor-default">Compliance</span>
            </div>
          </div>
        </div>

        {/* Date Range Filter Section */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-sky-100 p-2">
              <svg className="h-5 w-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Date Range Filter</h3>
              <p className="text-sm text-gray-600 mt-1">Monthly trend aligns to selected range.</p>
            </div>
          </div>
          <form method="GET" className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">From</label>
              <input
                type="date"
                name="from"
                defaultValue={getParam(resolvedSearchParams, 'from') ?? ''}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-all duration-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">To</label>
              <input
                type="date"
                name="to"
                defaultValue={getParam(resolvedSearchParams, 'to') ?? ''}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-all duration-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </div>
            <div className="md:col-span-2 flex items-end gap-2">
              <button type="submit" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 shadow-md hover:shadow-lg hover:bg-sky-700">
                Apply Date Range
              </button>
            </div>
          </form>
        </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-5">
        <MetricCard title="Total Users" value={data.summary.totalUsers.toLocaleString()} />
        <MetricCard title="Activation Rate" value={`${data.summary.activationRatePct}%`} hint={`${data.summary.activeUsers.toLocaleString()} active`} />
        <MetricCard title="Verification Rate" value={`${data.summary.verificationRatePct}%`} hint={`${data.summary.verifiedUsers.toLocaleString()} verified`} />
        <MetricCard title="30d Growth" value={`${data.summary.growthPct}%`} hint={`${data.summary.recentJoiners30d.toLocaleString()} joiners`} />
        <MetricCard
          title="Onboarding Risk"
          value={`${data.summary.onboardingRiskScore}`}
          hint={`Role HHI ${data.summary.roleConcentrationHHI}`}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Role Composition</h2>
            <div className="flex items-center gap-2">
              <CsvExportButton
                filename="users-role-composition.csv"
                rows={data.roleBreakdown}
                columns={[
                  { key: 'role', label: 'Role' },
                  { key: 'count', label: 'Count' },
                  { key: 'sharePct', label: 'Share %' },
                ]}
              />
              <PdfExportButton
                filename="users-role-composition.pdf"
                title="Users Role Composition"
                rows={data.roleBreakdown}
                columns={[
                  { key: 'role', label: 'Role' },
                  { key: 'count', label: 'Count' },
                  { key: 'sharePct', label: 'Share %' },
                ]}
              />
            </div>
          </div>
          <RoleCompositionChart data={data} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Monthly Onboarding Trend</h2>
            <div className="flex items-center gap-2">
              <CsvExportButton
                filename="users-monthly-trend.csv"
                rows={data.monthlyTrend.labels.map((label, idx) => ({
                  month: label,
                  newUsers: data.monthlyTrend.newUsers[idx] ?? 0,
                }))}
                columns={[
                  { key: 'month', label: 'Month' },
                  { key: 'newUsers', label: 'New Users' },
                ]}
              />
              <PdfExportButton
                filename="users-monthly-trend.pdf"
                title="Users Monthly Onboarding Trend"
                rows={data.monthlyTrend.labels.map((label, idx) => ({
                  month: label,
                  newUsers: data.monthlyTrend.newUsers[idx] ?? 0,
                }))}
                columns={[
                  { key: 'month', label: 'Month' },
                  { key: 'newUsers', label: 'New Users' },
                ]}
              />
            </div>
          </div>
          <MonthlyOnboardingTrendChart data={data} />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">Compliance Watchlist</h2>
            <div className="flex items-center gap-2">
              <CsvExportButton
                filename="users-compliance-watchlist.csv"
                rows={data.complianceWatchlist}
                columns={[
                  { key: 'id', label: 'User ID' },
                  { key: 'role', label: 'Role' },
                  { key: 'isActive', label: 'Active' },
                  { key: 'emailVerified', label: 'Verified' },
                  { key: 'createdAt', label: 'Created' },
                ]}
              />
              <PdfExportButton
                filename="users-compliance-watchlist.pdf"
                title="Users Compliance Watchlist"
                rows={data.complianceWatchlist}
                columns={[
                  { key: 'id', label: 'User ID' },
                  { key: 'role', label: 'Role' },
                  { key: 'isActive', label: 'Active' },
                  { key: 'emailVerified', label: 'Verified' },
                  { key: 'createdAt', label: 'Created' },
                ]}
              />
            </div>
          </div>
        <p className="mt-1 text-xs text-slate-500">Oldest records with inactive or unverified state.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">User ID</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Verified</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {data.complianceWatchlist.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-2 text-xs text-slate-600">{row.id}</td>
                  <td className="px-3 py-2 text-sm text-slate-700">{row.role.replaceAll('_', ' ')}</td>
                  <td className="px-3 py-2 text-sm text-slate-700">{row.isActive ? 'Active' : 'Inactive'}</td>
                  <td className="px-3 py-2 text-sm text-slate-700">{row.emailVerified ? 'Yes' : 'No'}</td>
                  <td className="px-3 py-2 text-sm text-slate-700">{row.createdAt}</td>
                </tr>
              ))}
              {!data.complianceWatchlist.length ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-500">
                    No users currently violating activation/verification checks.
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
