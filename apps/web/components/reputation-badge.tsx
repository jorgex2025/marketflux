type Badge = 'none' | 'rising' | 'trusted' | 'top_seller';

const badgeConfig: Record<Badge, { label: string; className: string }> = {
  none: { label: '', className: '' },
  rising: { label: '🌱 En ascenso', className: 'bg-blue-100 text-blue-800' },
  trusted: { label: '✅ Confiable', className: 'bg-green-100 text-green-800' },
  top_seller: { label: '🏆 Top Vendedor', className: 'bg-yellow-100 text-yellow-800' },
};

interface ReputationBadgeProps {
  badge: Badge;
  score?: number;
}

export function ReputationBadge({ badge, score }: ReputationBadgeProps) {
  if (badge === 'none') return null;
  const config = badgeConfig[badge];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}
      title={score !== undefined ? `Score: ${score.toFixed(1)}` : undefined}
    >
      {config.label}
    </span>
  );
}
