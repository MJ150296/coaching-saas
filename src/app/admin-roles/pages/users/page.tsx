import React from 'react';
import ChartCard from '@/shared/components/analytics/ChartCard';
import analytics from '@/shared/lib/analytics.server';

export default async function Page() {
  const { chartData } = await analytics.getUsersOverview();

  return (
    <div className="p-8 min-h-screen bg-linear-to-br from-slate-50 via-indigo-50/40 to-sky-50/50">
      <h1 className="text-2xl font-semibold">Users Analytics</h1>
      <p className="mt-2 text-sm text-gray-600">Overview of user composition (mock data). Wire to DB for real data.</p>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <ChartCard type="pie" data={chartData} options={{ responsive: true, plugins: { legend: { position: 'right' } } }} />
        <ChartCard type="bar" data={{ labels: chartData.labels, datasets: [{ label: 'Users', data: (chartData.datasets?.[0]?.data ?? []) }] }} options={{ responsive: true }} />
      </div>
    </div>
  );
}
