'use client';

import {
  BarChart,
  Bar,
  Line,
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
  enrollments: number[];
  sessions: number[];
}

interface SummaryData {
  activePrograms: number;
  totalPrograms: number;
  activeBatches: number;
  totalBatches: number;
  activeEnrollments: number;
  totalEnrollments: number;
}

interface ProgramRow {
  name: string;
  sessionCompletionRatePct: number;
  activeEnrollments: number;
  batches: number;
}

interface BatchRow {
  name: string;
  riskScore: number;
  seatUtilizationPct: number;
  attendanceQualityPct: number;
}

interface ProgramsBatchesChartData {
  trend: TrendData;
  summary: SummaryData;
  programRows: ProgramRow[];
  batchRows: BatchRow[];
}

export function MonthlyEnrollmentSessionsChart({ data }: { data: ProgramsBatchesChartData }) {
  const enrollmentSessionsData = data.trend.labels.map((label: string, idx: number) => ({
    month: label,
    enrollments: data.trend.enrollments[idx] ?? 0,
    sessions: data.trend.sessions[idx] ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={enrollmentSessionsData}>
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
        <Bar dataKey="enrollments" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Enrollments" />
        <Line type="monotone" dataKey="sessions" stroke="#06b6d4" strokeWidth={2} name="Sessions" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function StatusDistributionChart({ data }: { data: ProgramsBatchesChartData }) {
  const statusData = [
    { name: 'Active Programs', value: data.summary.activePrograms, total: data.summary.totalPrograms, fill: '#10b981' },
    { name: 'Active Batches', value: data.summary.activeBatches, total: data.summary.totalBatches, fill: '#06b6d4' },
    { name: 'Active Enrollments', value: data.summary.activeEnrollments, total: data.summary.totalEnrollments, fill: '#8b5cf6' },
  ].map(item => ({ ...item, percentage: item.total > 0 ? Math.round((item.value / item.total) * 100) : 0 }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={statusData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${Math.round((percent || 0) * 100)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {statusData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
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
            const v = value !== undefined ? Number(value).toLocaleString() : '';
            const n = name !== undefined ? String(name) : '';
            return [v, n];
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ProgramPerformanceChart({ data }: { data: ProgramsBatchesChartData }) {
  const programPerformanceData = data.programRows.slice(0, 10).map((row: ProgramRow) => ({
    name: row.name.length > 15 ? row.name.substring(0, 15) + '...' : row.name,
    completionRate: row.sessionCompletionRatePct,
    activeEnrollments: row.activeEnrollments,
    batches: row.batches,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={programPerformanceData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" stroke="#64748b" fontSize={12} />
        <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={100} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }} 
        />
        <Legend />
        <Bar dataKey="completionRate" fill="#10b981" name="Completion Rate %" radius={[0, 4, 4, 0]} />
        <Bar dataKey="activeEnrollments" fill="#8b5cf6" name="Active Enrollments" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function BatchRiskRankingChart({ data }: { data: ProgramsBatchesChartData }) {
  const batchRiskData = data.batchRows.slice(0, 10).map((row: BatchRow) => ({
    name: row.name.length > 15 ? row.name.substring(0, 15) + '...' : row.name,
    riskScore: row.riskScore,
    utilization: row.seatUtilizationPct,
    quality: row.attendanceQualityPct,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={batchRiskData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" stroke="#64748b" fontSize={12} />
        <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={100} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }} 
        />
        <Legend />
        <Bar dataKey="riskScore" fill="#ef4444" name="Risk Score" radius={[0, 4, 4, 0]} />
        <Bar dataKey="utilization" fill="#f59e0b" name="Utilization %" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
