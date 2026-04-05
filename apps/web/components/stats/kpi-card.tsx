'use client';

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  color?: string;
}

export function KpiCard({ title, value, change, icon, color = 'bg-indigo-500' }: KpiCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">{title}</p>
        {icon && <div className={`${color} text-white p-2 rounded-lg`}>{icon}</div>}
      </div>
      <p className="text-2xl font-bold text-zinc-900 mt-2">{typeof value === 'number' ? value.toLocaleString('es-CO') : value}</p>
      {change !== undefined && (
        <p className={`text-xs font-medium mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% vs período anterior
        </p>
      )}
    </div>
  );
}
