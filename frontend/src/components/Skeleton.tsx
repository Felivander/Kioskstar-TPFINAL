interface SkeletonProps {
  className?: string;
  lines?: number;
}

export default function Skeleton({ className = '', lines = 1 }: SkeletonProps) {
  return (
    <div aria-hidden="true" className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton h-4 ${className}`} />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div aria-hidden="true" className="rounded-2xl bg-white p-6 shadow-sm border border-surface-100 space-y-4">
      <div className="skeleton h-5 w-1/3" />
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-4 w-2/3" />
      <div className="skeleton h-10 w-1/4 mt-4" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-hidden="true" className="space-y-3">
      <div className="skeleton h-10 w-full rounded-xl" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-12 w-full rounded-xl" />
      ))}
    </div>
  );
}
