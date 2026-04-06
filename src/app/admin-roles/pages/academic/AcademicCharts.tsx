'use client';

import {
  Line,
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
  ComposedChart,
} from 'recharts';

interface TrendData {
  labels: string[];
  completedSessions: number[];
  attendanceQualityPct: number[];
}

interface SummaryData {
  presentRatePct: number;
  lateRatePct: number;
  absentRatePct: number;
}

interface AcademicChartData {
  trend: TrendData;
  summary: SummaryData;
}

interface LegendFormatterArgs {
  value?: string;
  color?: string;
}

export function MonthlyDeliveryAttendanceChart({ data }: { data: AcademicChartData }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data.trend.labels.map((label: string, idx: number) => ({
        month: label,
        completedSessions: data.trend.completedSessions[idx] ?? 0,
        attendanceQualityPct: data.trend.attendanceQualityPct[idx] ?? 0,
      }))}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
        <YAxis yAxisId="left" stroke="#64748b" fontSize={12} />
        <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }} 
        />
        <Legend />
        <Bar yAxisId="left" dataKey="completedSessions" fill="#6366f1" radius={[4, 4, 0, 0]} name="Completed Sessions" />
        <Line yAxisId="right" type="monotone" dataKey="attendanceQualityPct" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', strokeWidth: 2 }} name="Attendance Quality %" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function AttendanceStatusMixChart({ data }: { data: AcademicChartData }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={[
            { name: 'Present', value: data.summary.presentRatePct, fill: '#10b981' },
            { name: 'Late', value: data.summary.lateRatePct, fill: '#f59e0b' },
            { name: 'Absent', value: data.summary.absentRatePct, fill: '#ef4444' },
          ]}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          <Cell fill="#10b981" />
          <Cell fill="#f59e0b" />
          <Cell fill="#ef4444" />
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
