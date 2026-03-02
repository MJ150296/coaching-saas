import React from 'react';
import ChartCard from '@/shared/components/analytics/ChartCard';
import analytics from '@/shared/lib/analytics.server';

export default async function Page() {
  const { chartData } = await analytics.getAcademicOverview({ months: 12 });

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50/40 to-sky-50/50 p-8">
      <h1 className="text-2xl font-semibold">Academic Analytics</h1>
      <p className="mt-2 text-sm text-gray-600">Overview of academic trends (mock data). Wire to DB for real data.</p>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <ChartCard type="line" data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
        <ChartCard type="bar" data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
      </div>
    </div>
  );
}
