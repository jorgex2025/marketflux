'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PaginatedAuditLogs } from '@/lib/types/analytics';

interface UseAuditLogsOptions {
  token: string;
  page?: number;
  limit?: number;
  resource?: string;
}

export function useAuditLogs({
  token,
  page = 1,
  limit = 20,
  resource,
}: UseAuditLogsOptions) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(resource ? { resource } : {}),
  });

  return useQuery<PaginatedAuditLogs>({
    queryKey: ['audit-logs', page, limit, resource],
    queryFn: () =>
      apiClient.get<PaginatedAuditLogs>(`/audit?${params.toString()}`, token),
    enabled: Boolean(token),
    staleTime: 60 * 1000, // 1 min — audit logs refresh faster
  });
}
