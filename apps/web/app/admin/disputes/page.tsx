'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

type Dispute = {
  id: string;
  orderId: string;
  buyerId: string;
  reason: string;
  description: string;
  status: string;
  resolution?: string;
};

export default function AdminDisputesPage() {
  const qc = useQueryClient();

    const { data, isLoading } = useQuery({
      queryKey: ['admin-disputes'],
      queryFn: () =>
        apiClient.get<Dispute[]>('/disputes'),
    });

  const resolve = useMutation({
    mutationFn: ({
      id,
      status,
      resolution,
    }: {
      id: string;
      status: string;
      resolution: string;
    }) => apiClient.patch(`/disputes/${id}`, { status, resolution }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-disputes'] }),
  });

  if (isLoading) return <p className="p-6">Loading…</p>;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Disputes (Admin)</h1>
      {!data?.length && <p className="text-gray-500">No disputes.</p>}
      <ul className="space-y-4">
         {data?.map((d: Dispute) => (
          <li key={d.id} className="border rounded p-4">
            <p className="font-medium">Dispute #{d.id.slice(0, 8)}</p>
            <p className="text-sm">Order: {d.orderId}</p>
            <p className="text-sm">Reason: {d.reason}</p>
            <p className="text-sm text-gray-600">{d.description}</p>
            <span
              className={`text-xs px-2 py-0.5 rounded mt-1 inline-block ${
                d.status === 'open' || d.status === 'under_review'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {d.status}
            </span>
            {d.resolution && (
              <p className="text-xs text-gray-500 mt-1">Resolution: {d.resolution}</p>
            )}
            {(d.status === 'open' || d.status === 'under_review') && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() =>
                    resolve.mutate({
                      id: d.id,
                      status: 'resolved',
                      resolution: 'Resolved in favor of buyer',
                    })
                  }
                  disabled={resolve.isPending}
                  className="bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Favor Buyer
                </button>
                <button
                  onClick={() =>
                    resolve.mutate({
                      id: d.id,
                      status: 'resolved',
                      resolution: 'Resolved in favor of seller',
                    })
                  }
                  disabled={resolve.isPending}
                  className="bg-orange-600 text-white text-sm px-3 py-1 rounded hover:bg-orange-700 disabled:opacity-50"
                >
                  Favor Seller
                </button>
                <button
                  onClick={() =>
                    resolve.mutate({
                      id: d.id,
                      status: 'closed',
                      resolution: 'Closed without resolution',
                    })
                  }
                  disabled={resolve.isPending}
                  className="bg-gray-500 text-white text-sm px-3 py-1 rounded hover:bg-gray-600 disabled:opacity-50"
                >
                  Close
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
