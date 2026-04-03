'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PlatformConfig } from '@/lib/types/analytics';

export function usePlatformConfig(token: string) {
  const queryClient = useQueryClient();

  const query = useQuery<PlatformConfig[]>({
    queryKey: ['platform-config'],
    queryFn: () => apiClient.get<PlatformConfig[]>('/config', token),
    enabled: Boolean(token),
    staleTime: 10 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      apiClient.patch<PlatformConfig>(`/config/${key}`, { value }, token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['platform-config'] });
    },
  });

  return { ...query, updateConfig: mutation.mutate, isUpdating: mutation.isPending };
}
