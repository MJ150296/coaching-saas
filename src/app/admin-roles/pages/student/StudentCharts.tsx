'use client';

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface StudentStatusData {
  activeCount: number;
  total: number;
}

interface StudentVerificationData {
  verifiedCount: number;
  total: number;
}

interface LegendFormatterArgs {
  value?: string;
  color?: string;
}

export function StatusDistributionChart({ data }: { data: StudentStatusData }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={[
            { name: 'Active', value: data.activeCount, fill: '#10b981' },
            { name: 'Inactive', value: data.total - data.activeCount, fill: '#f59e0b' },
          ]}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
        >
          <Cell fill="#10b981" />
          <Cell fill="#f59e0b" />
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
            const percentage = data.total > 0 ? Math.round((v / data.total) * 100) : 0;
            return [`${v.toLocaleString()} (${percentage}%)`, name];
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

export function VerificationStatusChart({ data }: { data: StudentVerificationData }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        data={[
          { name: 'Verified', count: data.verifiedCount, fill: '#6366f1' },
          { name: 'Unverified', count: data.total - data.verifiedCount, fill: '#ef4444' },
        ]}
        layout="vertical"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" stroke="#64748b" fontSize={12} />
        <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={80} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}
          formatter={(value) => {
            const v = value !== undefined ? Number(value).toLocaleString() : '0';
            return [v, 'Count'];
          }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Students">
          <Cell fill="#6366f1" />
          <Cell fill="#ef4444" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
