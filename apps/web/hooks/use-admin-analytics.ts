'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { GmvSummary } from '@/lib/types/analytics';

type Period = 'day' | 'week' | 'month' | 'year';

interface UseAdminAnalyticsOptions {
  token: string;
  period?: Period;
}

export function useAdminAnalytics({
  token,
  period = 'month',
}: UseAdminAnalyticsOptions) {
  return useQuery<GmvSummary>({
    queryKey: ['admin-gmv', period],
    queryFn: () =>
      apiClient.get<GmvSummary>(`/analytics/gmv?period=${period}`, token),
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
  });
}
