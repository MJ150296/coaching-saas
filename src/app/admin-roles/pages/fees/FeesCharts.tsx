'use client';

import {
  Bar,
  PieChart,
  Pie,
  Cell,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';

interface TrendData {
  labels: string[];
  billed: number[];
  collected: number[];
  gap: number[];
}

interface MethodMixRow {
  method: string;
  sharePct: number;
}

interface FeesChartData {
  trend: TrendData;
  methodMix: MethodMixRow[];
}

interface LegendFormatterArgs {
  value?: string;
  color?: string;
}

function inr(value: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
}

export function BilledCollectedTrendChart({ data }: { data: FeesChartData }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data.trend.labels.map((label: string, idx: number) => ({
        month: label,
        billed: data.trend.billed[idx] ?? 0,
        collected: data.trend.collected[idx] ?? 0,
        gap: data.trend.gap[idx] ?? 0,
      }))}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}
          formatter={(value, name) => {
            const v = value !== undefined ? inr(Number(value)) : '';
            const n = name !== undefined ? String(name) : '';
            return [`₹${v}`, n];
          }}
        />
        <Legend />
        <Bar dataKey="billed" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Billed" />
        <Bar dataKey="collected" fill="#10b981" radius={[4, 4, 0, 0]} name="Collected" />
        <Line type="monotone" dataKey="gap" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', strokeWidth: 2 }} name="Gap" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function PaymentMethodMixChart({ data }: { data: FeesChartData }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data.methodMix.map((row: MethodMixRow, idx: number) => ({
            name: row.method,
            value: row.sharePct,
            fill: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][idx % 5]
          }))}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {data.methodMix.map((_entry: MethodMixRow, idx: number) => (
            <Cell key={`cell-${idx}`} fill={['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][idx % 5]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}
          formatter={(value, name) => {
            const v = value !== undefined ? String(value) : '';
            const n = name !== undefined ? String(name) : '';
            return [`${v}%`, n];
          }}
        />
        <Legend 
          layout="vertical" 
          verticalAlign="middle" 
          align="right"
          formatter={(value, entry) => {
            const v = value !== undefined ? String(value) : '';
            const e = entry as LegendFormatterArgs;
            return <span style={{ color: e.color }}>{v}</span>;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
