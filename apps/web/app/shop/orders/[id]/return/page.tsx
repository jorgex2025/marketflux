'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export default function ReturnRequestPage() {
  const { id: orderId } = useParams<{ id: string }>();
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');

  const mutation = useMutation({
    mutationFn: (payload: { orderId: string; reason: string; description: string }) =>
      apiClient.post('/returns', payload),
    onSuccess: () => router.push('/shop/orders'),
  });

  return (
    <main className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Request Return</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate({ orderId, reason, description });
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium mb-1">Reason</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            placeholder="e.g. Defective product"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Describe the issue in detail"
          />
        </div>
        {mutation.isError && (
          <p className="text-red-500 text-sm">
            {(mutation.error as Error).message}
          </p>
        )}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {mutation.isPending ? 'Submitting…' : 'Submit Return Request'}
        </button>
      </form>
    </main>
  );
}
