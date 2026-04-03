import { type ReactNode } from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: { value: number; label: string }; // e.g. { value: 12.5, label: 'vs last month' }
  isLoading?: boolean;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  isLoading = false,
}: KpiCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <div className="h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="mt-3 h-8 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      </div>
    );
  }

  const trendPositive = trend && trend.value >= 0;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
        {icon && <span className="text-zinc-400">{icon}</span>}
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
      {subtitle && (
        <p className="mt-1 text-xs text-zinc-400">{subtitle}</p>
      )}
      {trend && (
        <p
          className={`mt-2 text-xs font-medium ${
            trendPositive ? 'text-emerald-600' : 'text-red-500'
          }`}
        >
          {trendPositive ? '▲' : '▼'} {Math.abs(trend.value)}% {trend.label}
        </p>
      )}
    </div>
  );
}
