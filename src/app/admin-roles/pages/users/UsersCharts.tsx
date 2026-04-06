'use client';

import {
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface RoleBreakdownRow {
  role: string;
  count: number;
  sharePct: number;
}

interface MonthlyTrendData {
  labels: string[];
  newUsers: number[];
}

interface UsersRoleData {
  roleBreakdown: RoleBreakdownRow[];
}

interface UsersTrendData {
  monthlyTrend: MonthlyTrendData;
}

interface LegendFormatterArgs {
  value?: string;
  color?: string;
}

export function RoleCompositionChart({ data }: { data: UsersRoleData }) {
  const colors = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6'];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data.roleBreakdown.map((row: RoleBreakdownRow, idx: number) => ({
            name: row.role.replaceAll('_', ' '),
            value: row.count,
            fill: colors[idx % 8],
          }))}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {data.roleBreakdown.map((_entry: RoleBreakdownRow, idx: number) => (
            <Cell key={`cell-${idx}`} fill={colors[idx % 8]} />
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
            const v = value !== undefined ? Number(value) : 0;
            const found = data.roleBreakdown.find((r: RoleBreakdownRow) => r.role.replaceAll('_', ' ') === name);
            const sharePct = found?.sharePct ?? 0;
            return [`${v.toLocaleString()} (${sharePct}%)`, name];
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

export function MonthlyOnboardingTrendChart({ data }: { data: UsersTrendData }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data.monthlyTrend.labels.map((label: string, idx: number) => ({
        month: label,
        newUsers: data.monthlyTrend.newUsers[idx] ?? 0,
      }))}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }} 
        />
        <Legend />
        <Area type="monotone" dataKey="newUsers" fill="#0ea5e9" fillOpacity={0.3} stroke="#0ea5e9" strokeWidth={2} name="New Users" />
        <Bar dataKey="newUsers" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="New Users (Bar)" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
