"use client";
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

type ChartType = 'line' | 'bar' | 'pie';

export type ChartCardProps<T extends ChartType = ChartType> = {
  type: T;
  data: ChartData<T>;
  options?: ChartOptions<T>;
  className?: string;
  height?: number;
};

export default function ChartCard<T extends ChartType>({
  type,
  data,
  options,
  className = '',
  height,
}: ChartCardProps<T>) {
  return (
    <div className={`rounded-lg bg-white p-4 shadow-sm ${className}`}>
      {type === 'line' && <Line data={data as ChartData<'line'>} options={options as ChartOptions<'line'>} height={height} />}
      {type === 'bar' && <Bar data={data as ChartData<'bar'>} options={options as ChartOptions<'bar'>} height={height} />}
      {type === 'pie' && <Pie data={data as ChartData<'pie'>} options={options as ChartOptions<'pie'>} height={height} />}
    </div>
  );
}
