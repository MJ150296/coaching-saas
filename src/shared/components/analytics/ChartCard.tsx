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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

export type ChartCardProps = {
  type: 'line' | 'bar' | 'pie';
  data: any;
  options?: any;
  className?: string;
  height?: number;
};

export default function ChartCard({ type, data, options, className = '', height }: ChartCardProps) {
  return (
    <div className={`rounded-lg bg-white p-4 shadow-sm ${className}`}>
      {type === 'line' && <Line data={data} options={options} height={height} />}
      {type === 'bar' && <Bar data={data} options={options} height={height} />}
      {type === 'pie' && <Pie data={data} options={options} height={height} />}
    </div>
  );
}
