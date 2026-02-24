type TableLoaderProps = {
  columns: number;
  rows?: number;
  className?: string;
};

export function TableLoader({ columns, rows = 5, className = "" }: TableLoaderProps) {
  return (
    <tbody className={`divide-y divide-slate-200 bg-white ${className}`}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <td key={`${rowIndex}-${columnIndex}`} className="px-3 py-3">
              <div
                className="h-3 animate-pulse rounded bg-slate-200"
                style={{ width: `${Math.max(45, 95 - columnIndex * 8)}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
