import { getFeesEnterpriseAnalytics } from '@/shared/lib/enterprise-analytics.server';
import { CsvExportButton } from '@/shared/components/ui/CsvExportButton';
import { PdfExportButton } from '@/shared/components/ui/PdfExportButton';
import { BilledCollectedTrendChart, PaymentMethodMixChart } from './FeesCharts';

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

function inr(value: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
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

export default async function FeesAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const from = parseDate(getParam(resolvedSearchParams, 'from'));
  const to = parseDate(getParam(resolvedSearchParams, 'to'));
  const data = await getFeesEnterpriseAnalytics({ from, to });

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-amber-50/40 to-orange-50/50 py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Hero Header Card */}
        <div className="rounded-2xl border border-amber-100 bg-linear-to-r from-amber-500 via-orange-500 to-rose-500 p-6 shadow-lg shadow-orange-200/70 overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Fees Analytics</h2>
              <p className="mt-2 text-sm text-orange-50">Revenue realization, overdue risk, and payment behavior from live ledger and payment data.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30 transition-colors cursor-default">Revenue</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30 transition-colors cursor-default">Payments</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30 transition-colors cursor-default">Risk</span>
            </div>
          </div>
        </div>

        {/* Date Range Filter Section */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-amber-100 p-2">
              <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Date Range Filter</h3>
              <p className="text-sm text-gray-600 mt-1">Ledger due dates and payments filtered by range.</p>
            </div>
          </div>
          <form method="GET" className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">From</label>
              <input
                type="date"
                name="from"
                defaultValue={getParam(resolvedSearchParams, 'from') ?? ''}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-all duration-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">To</label>
              <input
                type="date"
                name="to"
                defaultValue={getParam(resolvedSearchParams, 'to') ?? ''}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-all duration-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div className="md:col-span-2 flex items-end gap-2">
              <button type="submit" className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 shadow-md hover:shadow-lg hover:bg-amber-700">
                Apply Date Range
              </button>
            </div>
          </form>
        </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-5">
        <MetricCard title="Total Billed" value={`INR ${inr(data.summary.totalBilled)}`} />
        <MetricCard title="Total Collected" value={`INR ${inr(data.summary.totalPaid)}`} hint={`${data.summary.collectionRatePct}% collection rate`} />
        <MetricCard title="Outstanding" value={`INR ${inr(data.summary.outstandingAmount)}`} />
        <MetricCard title="Overdue" value={`INR ${inr(data.summary.overdueAmount)}`} hint={`${data.summary.overdueRatePct}% of outstanding`} />
        <MetricCard title="Payer Concentration" value={`${data.summary.payerConcentrationTop10Pct}%`} hint={`Gini ${data.summary.payerDistributionGini}`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">Billed vs Collected Trend (12 months)</h2>
            <div className="flex items-center gap-2">
              <CsvExportButton
                filename="fees-billed-collected-trend.csv"
                rows={data.trend.labels.map((label, idx) => ({
                  month: label,
                  billed: data.trend.billed[idx] ?? 0,
                  collected: data.trend.collected[idx] ?? 0,
                  gap: data.trend.gap[idx] ?? 0,
                }))}
                columns={[
                  { key: 'month', label: 'Month' },
                  { key: 'billed', label: 'Billed' },
                  { key: 'collected', label: 'Collected' },
                  { key: 'gap', label: 'Gap' },
                ]}
              />
              <PdfExportButton
                filename="fees-billed-collected-trend.pdf"
                title="Fees Billed vs Collected Trend"
                rows={data.trend.labels.map((label, idx) => ({
                  month: label,
                  billed: data.trend.billed[idx] ?? 0,
                  collected: data.trend.collected[idx] ?? 0,
                  gap: data.trend.gap[idx] ?? 0,
                }))}
                columns={[
                  { key: 'month', label: 'Month' },
                  { key: 'billed', label: 'Billed' },
                  { key: 'collected', label: 'Collected' },
                  { key: 'gap', label: 'Gap' },
                ]}
              />
            </div>
          </div>
          <div className="mt-4">
            <BilledCollectedTrendChart data={data} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">Payment Method Mix</h2>
            <div className="flex items-center gap-2">
              <CsvExportButton
                filename="fees-payment-method-mix.csv"
                rows={data.methodMix}
                columns={[
                  { key: 'method', label: 'Method' },
                  { key: 'amount', label: 'Amount' },
                  { key: 'sharePct', label: 'Share %' },
                ]}
              />
              <PdfExportButton
                filename="fees-payment-method-mix.pdf"
                title="Fees Payment Method Mix"
                rows={data.methodMix}
                columns={[
                  { key: 'method', label: 'Method' },
                  { key: 'amount', label: 'Amount' },
                  { key: 'sharePct', label: 'Share %' },
                ]}
              />
            </div>
          </div>
          <div className="mt-4">
            <PaymentMethodMixChart data={data} />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-800">High-Risk Student Fee Accounts</h2>
          <div className="flex items-center gap-2">
            <CsvExportButton
              filename="fees-high-risk-students.csv"
              rows={data.riskTable}
              columns={[
                { key: 'studentName', label: 'Student' },
                { key: 'studentEmail', label: 'Email' },
                { key: 'outstanding', label: 'Outstanding' },
                { key: 'overdue', label: 'Overdue' },
                { key: 'overduePct', label: 'Overdue %' },
                { key: 'oldestDueDate', label: 'Oldest Due' },
                { key: 'riskScore', label: 'Risk Score' },
              ]}
            />
            <PdfExportButton
              filename="fees-high-risk-students.pdf"
              title="High-Risk Student Fee Accounts"
              rows={data.riskTable}
              columns={[
                { key: 'studentName', label: 'Student' },
                { key: 'studentEmail', label: 'Email' },
                { key: 'outstanding', label: 'Outstanding' },
                { key: 'overdue', label: 'Overdue' },
                { key: 'overduePct', label: 'Overdue %' },
                { key: 'oldestDueDate', label: 'Oldest Due' },
                { key: 'riskScore', label: 'Risk Score' },
              ]}
            />
          </div>
        </div>
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
                  <td className="px-3 py-2 text-sm text-slate-700">
                    {row.studentId ? (
                      <a
                        href={`/profile/users/${encodeURIComponent(row.studentId)}`}
                        className="font-medium text-slate-700 hover:text-slate-900 hover:underline"
                      >
                        {row.studentName}
                      </a>
                    ) : (
                      <span className="font-medium text-slate-700">{row.studentName}</span>
                    )}
                    {row.studentEmail ? (
                      <div className="text-xs text-slate-500">{row.studentEmail}</div>
                    ) : null}
                  </td>
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
    </div>
  );
}
