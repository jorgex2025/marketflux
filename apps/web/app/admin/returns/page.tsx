'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

type ReturnRecord = {
  id: string;
  orderId: string;
  buyerId: string;
  reason: string;
  status: string;
};

export default function AdminReturnsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-returns'],
    queryFn: () => apiClient.get<{ data: ReturnRecord[] }>('/returns').then((r) => r.data.data),
  });

  const refund = useMutation({
    mutationFn: (id: string) => apiClient.post(`/returns/${id}/refund`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-returns'] }),
  });

  if (isLoading) return <p className="p-6">Loading…</p>;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Returns (Admin)</h1>
      {!data?.length && <p className="text-gray-500">No returns.</p>}
      <ul className="space-y-4">
        {data?.map((r) => (
          <li key={r.id} className="border rounded p-4">
            <p className="font-medium">Return #{r.id.slice(0, 8)}</p>
            <p className="text-sm">Order: {r.orderId}</p>
            <p className="text-sm">Reason: {r.reason}</p>
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                r.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-gray-100'
              }`}
            >
              {r.status}
            </span>
            {r.status === 'approved' && (
              <button
                onClick={() => refund.mutate(r.id)}
                disabled={refund.isPending}
                className="ml-3 bg-purple-600 text-white text-sm px-3 py-1 rounded hover:bg-purple-700 disabled:opacity-50"
              >
                Issue Refund
              </button>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
