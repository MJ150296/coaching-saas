type SectionLoaderProps = {
  lines?: number;
  className?: string;
};

export function SectionLoader({ lines = 3, className = "" }: SectionLoaderProps) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-slate-50/80 p-4 ${className}`}>
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="h-3 w-full animate-pulse rounded bg-slate-200"
            style={{ width: `${Math.max(45, 100 - index * 12)}%` }}
          />
        ))}
      </div>
    </div>
  );
}
