'use client';

import { useCallback } from 'react';

type PdfColumn<Row> = {
  key: keyof Row & string;
  label?: string;
  format?: (value: Row[keyof Row], row: Row) => string | number;
};

type PdfExportButtonProps<Row extends Record<string, unknown>> = {
  filename: string;
  title: string;
  rows: Row[];
  columns?: Array<PdfColumn<Row>>;
  className?: string;
  label?: string;
};

function toDisplayValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function PdfExportButton<Row extends Record<string, unknown>>({
  filename,
  title,
  rows,
  columns,
  className = '',
  label = 'Export PDF',
}: PdfExportButtonProps<Row>) {
  const handleExport = useCallback(() => {
    if (!rows.length) return;
    const columnList =
      columns ?? (Object.keys(rows[0] ?? {}) as Array<keyof Row & string>).map((key) => ({ key }));

    const headerCells = columnList
      .map((col) => `<th>${escapeHtml(col.label ?? col.key)}</th>`)
      .join('');
    const bodyRows = rows
      .map((row) => {
        const cells = columnList
          .map((col) => {
            const rawValue = row[col.key];
            const value = col.format ? col.format(rawValue, row) : toDisplayValue(rawValue);
            return `<td>${escapeHtml(String(value ?? ''))}</td>`;
          })
          .join('');
        return `<tr>${cells}</tr>`;
      })
      .join('');

    const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(title)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            .meta { font-size: 12px; color: #64748b; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; }
            th { background: #f8fafc; text-transform: uppercase; font-size: 11px; letter-spacing: 0.04em; }
            tr:nth-child(even) td { background: #f8fafc; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(title)}</h1>
          <div class="meta">Generated: ${new Date().toLocaleString()}</div>
          <table>
            <thead><tr>${headerCells}</tr></thead>
            <tbody>${bodyRows}</tbody>
          </table>
        </body>
      </html>`;

    const win = window.open('', '_blank', 'noopener,noreferrer');
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.document.title = filename.replace(/\\.pdf$/i, '');
    win.focus();
    win.print();
  }, [columns, filename, rows, title]);

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

