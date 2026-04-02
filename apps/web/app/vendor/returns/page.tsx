'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

type ReturnRecord = {
  id: string;
  orderId: string;
  reason: string;
  description: string;
  status: string;
  buyerId: string;
};

export default function VendorReturnsPage() {
  const qc = useQueryClient();
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-returns'],
    queryFn: () =>
      apiClient.get<{ data: ReturnRecord[] }>('/returns').then((r) => r.data.data),
  });

  const approve = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/returns/${id}/approve`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendor-returns'] }),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.patch(`/returns/${id}/reject`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendor-returns'] }),
  });

  if (isLoading) return <p className="p-6">Loading returns…</p>;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Returns</h1>
      {!data?.length && <p className="text-gray-500">No return requests.</p>}
      <ul className="space-y-4">
        {data?.map((r) => (
          <li key={r.id} className="border rounded p-4">
            <p className="font-medium">Order: {r.orderId}</p>
            <p className="text-sm text-gray-600">{r.reason}</p>
            <p className="text-sm">{r.description}</p>
            <span
              className={`inline-block text-xs px-2 py-0.5 rounded mt-1 ${
                r.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-700'
                  : r.status === 'approved'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {r.status}
            </span>

            {r.status === 'pending' && (
              <div className="mt-3 space-y-2">
                <button
                  onClick={() => approve.mutate(r.id)}
                  disabled={approve.isPending}
                  className="bg-green-600 text-white text-sm px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Approve
                </button>

                <div className="flex gap-2 items-center">
                  <input
                    className="border rounded px-2 py-1 text-sm flex-1"
                    placeholder="Rejection reason…"
                    value={rejectReasons[r.id] ?? ''}
                    onChange={(e) =>
                      setRejectReasons((prev) => ({ ...prev, [r.id]: e.target.value }))
                    }
                  />
                  <button
                    onClick={() => {
                      const reason = rejectReasons[r.id]?.trim();
                      if (!reason) return;
                      reject.mutate({ id: r.id, reason });
                    }}
                    disabled={reject.isPending || !rejectReasons[r.id]?.trim()}
                    className="bg-red-600 text-white text-sm px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
