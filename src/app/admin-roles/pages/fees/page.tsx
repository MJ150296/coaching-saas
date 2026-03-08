import { getFeesEnterpriseAnalytics } from '@/shared/lib/enterprise-analytics.server';

function inr(value: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
}

function MetricCard({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export default async function FeesAnalyticsPage() {
  const data = await getFeesEnterpriseAnalytics();

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50/40 to-sky-50/50 p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Fees Analytics</h1>
      <p className="mt-2 text-sm text-slate-600">Revenue realization, overdue risk, and payment behavior from live ledger and payment data.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-5">
        <MetricCard title="Total Billed" value={`INR ${inr(data.summary.totalBilled)}`} />
        <MetricCard title="Total Collected" value={`INR ${inr(data.summary.totalPaid)}`} hint={`${data.summary.collectionRatePct}% collection rate`} />
        <MetricCard title="Outstanding" value={`INR ${inr(data.summary.outstandingAmount)}`} />
        <MetricCard title="Overdue" value={`INR ${inr(data.summary.overdueAmount)}`} hint={`${data.summary.overdueRatePct}% of outstanding`} />
        <MetricCard title="Payer Concentration" value={`${data.summary.payerConcentrationTop10Pct}%`} hint={`Gini ${data.summary.payerDistributionGini}`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-800">Billed vs Collected Trend (12 months)</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-2 py-2 text-left">Month</th>
                  <th className="px-2 py-2 text-right">Billed</th>
                  <th className="px-2 py-2 text-right">Collected</th>
                  <th className="px-2 py-2 text-right">Gap</th>
                </tr>
              </thead>
              <tbody>
                {data.trend.labels.map((label, idx) => (
                  <tr key={label} className="border-t border-slate-100">
                    <td className="px-2 py-2 text-slate-700">{label}</td>
                    <td className="px-2 py-2 text-right text-slate-700">{inr(data.trend.billed[idx] ?? 0)}</td>
                    <td className="px-2 py-2 text-right text-slate-700">{inr(data.trend.collected[idx] ?? 0)}</td>
                    <td className="px-2 py-2 text-right text-slate-700">{inr(data.trend.gap[idx] ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-800">Payment Method Mix</h2>
          <div className="mt-3 space-y-3">
            {data.methodMix.map((row) => (
              <div key={row.method}>
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <span>{row.method}</span>
                  <span>
                    INR {inr(row.amount)} ({row.sharePct}%)
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${Math.min(100, row.sharePct)}%` }} />
                </div>
              </div>
            ))}
            {!data.methodMix.length ? <p className="text-sm text-slate-500">No payment records found.</p> : null}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-800">High-Risk Student Fee Accounts</h2>
        <p className="mt-1 text-xs text-slate-500">Ranked by overdue severity and outstanding concentration.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Student</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Outstanding</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Overdue</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Overdue %</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Oldest Due</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Risk Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {data.riskTable.map((row) => (
                <tr key={row.studentId}>
                  <td className="px-3 py-2 text-sm text-slate-700">{row.studentName}</td>
                  <td className="px-3 py-2 text-right text-sm text-slate-700">INR {inr(row.outstanding)}</td>
                  <td className="px-3 py-2 text-right text-sm text-slate-700">INR {inr(row.overdue)}</td>
                  <td className="px-3 py-2 text-right text-sm text-slate-700">{row.overduePct}%</td>
                  <td className="px-3 py-2 text-sm text-slate-700">{row.oldestDueDate}</td>
                  <td className="px-3 py-2 text-right text-sm font-semibold text-slate-800">{row.riskScore}</td>
                </tr>
              ))}
              {!data.riskTable.length ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-500">
                    No outstanding fee risk records found.
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
