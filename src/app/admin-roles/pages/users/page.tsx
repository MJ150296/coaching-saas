import { getUsersEnterpriseAnalytics } from '@/shared/lib/enterprise-analytics.server';

function MetricCard({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export default async function UsersAnalyticsPage() {
  const data = await getUsersEnterpriseAnalytics();

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50/40 to-sky-50/50 p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Users Analytics</h1>
      <p className="mt-2 text-sm text-slate-600">Real-time user mix, growth velocity, and compliance risk from live tenant data.</p>

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
          <h2 className="text-sm font-semibold text-slate-800">Role Composition</h2>
          <div className="mt-3 space-y-3">
            {data.roleBreakdown.map((row) => (
              <div key={row.role}>
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <span>{row.role.replaceAll('_', ' ')}</span>
                  <span>
                    {row.count.toLocaleString()} ({row.sharePct}%)
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-sky-500" style={{ width: `${Math.min(100, row.sharePct)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-800">Monthly Onboarding Trend</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {data.monthlyTrend.labels.map((label) => (
                    <th key={label} className="px-2 py-2 text-left font-semibold">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {data.monthlyTrend.newUsers.map((value, idx) => (
                    <td key={`${data.monthlyTrend.labels[idx]}-${value}`} className="px-2 py-2 text-slate-700">
                      {value}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-800">Compliance Watchlist</h2>
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
  );
}
