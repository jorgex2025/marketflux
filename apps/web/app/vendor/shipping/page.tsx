'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

type Shipment = {
  id: string;
  orderId: string;
  trackingNumber: string;
  carrier: string;
  status: string;
};

export default function VendorShippingPage() {
  const qc = useQueryClient();
  const [orderId, setOrderId] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-shipments'],
    queryFn: () =>
      apiClient.get<{ data: Shipment[] }>('/shipping/shipments').then((r) => r.data.data),
  });

  const create = useMutation({
    mutationFn: (payload: { orderId: string; trackingNumber: string; carrier: string }) =>
      apiClient.post('/shipping/shipments', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor-shipments'] });
      setOrderId('');
      setTrackingNumber('');
      setCarrier('');
    },
  });

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Shipping</h1>

      <section className="mb-8 border rounded p-4 max-w-md">
        <h2 className="text-lg font-semibold mb-4">Create Shipment</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate({ orderId, trackingNumber, carrier });
          }}
          className="space-y-3"
        >
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Order ID"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            required
          />
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Tracking Number"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            required
          />
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Carrier (e.g. FedEx)"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={create.isPending}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {create.isPending ? 'Creating…' : 'Create Shipment'}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">My Shipments</h2>
        {isLoading && <p>Loading…</p>}
        {!data?.length && !isLoading && <p className="text-gray-500">No shipments yet.</p>}
        <ul className="space-y-3">
          {data?.map((s) => (
            <li key={s.id} className="border rounded p-3">
              <p className="font-medium">{s.trackingNumber}</p>
              <p className="text-sm text-gray-600">
                {s.carrier} — Order: {s.orderId}
              </p>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{s.status}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
