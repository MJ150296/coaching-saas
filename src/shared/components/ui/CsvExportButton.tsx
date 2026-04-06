'use client';

import { useCallback } from 'react';

type CsvColumn<Row> = {
  key: keyof Row & string;
  label?: string;
  format?: (value: Row[keyof Row], row: Row) => string | number;
};

type CsvExportButtonProps<Row extends Record<string, unknown>> = {
  filename: string;
  rows: Row[];
  columns?: Array<CsvColumn<Row>>;
  className?: string;
  label?: string;
};

function toCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function escapeCsv(value: string): string {
  const needsQuotes = /[",\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function CsvExportButton<Row extends Record<string, unknown>>({
  filename,
  rows,
  columns,
  className = '',
  label = 'Export CSV',
}: CsvExportButtonProps<Row>) {
  const handleExport = useCallback(() => {
    if (!rows.length) return;
    const columnList =
      columns ?? (Object.keys(rows[0] ?? {}) as Array<keyof Row & string>).map((key) => ({ key }));

    const header = columnList.map((col) => escapeCsv(col.label ?? col.key)).join(',');
    const lines = rows.map((row) =>
      columnList
        .map((col) => {
          const rawValue = row[col.key];
          const value = col.format ? col.format(rawValue, row) : toCsvValue(rawValue);
          return escapeCsv(String(value ?? ''));
        })
        .join(',')
    );

    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [columns, filename, rows]);

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={!rows.length}
      className={`rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {label}
    </button>
  );
}

