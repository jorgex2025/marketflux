'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { RevenueByDay } from '@/lib/types/analytics';

interface UseSellerAnalyticsOptions {
  token: string;
  sellerId: string;
  days?: number;   // default 30
}

export function useSellerAnalytics({
  token,
  sellerId,
  days = 30,
}: UseSellerAnalyticsOptions) {
  return useQuery<RevenueByDay[]>({
    queryKey: ['seller-analytics', sellerId, days],
    queryFn: () =>
      apiClient.get<RevenueByDay[]>(
        `/analytics/revenue-by-day?sellerId=${sellerId}&days=${days}`,
        token,
      ),
    enabled: Boolean(token && sellerId),
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
