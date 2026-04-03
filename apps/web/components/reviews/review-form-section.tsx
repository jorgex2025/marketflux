'use client';

import { useState } from 'react';
import { ReviewForm } from './review-form';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

export function ReviewFormSection({ productId }: { productId: string }) {
  const { isAuthenticated } = useAuth();
  const [submitted, setSubmitted] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 text-center">
        <p className="text-sm text-gray-500 mb-3">Debes iniciar sesión para dejar una reseña</p>
        <Link href="/login" className="text-indigo-600 font-semibold text-sm hover:underline">Iniciar sesión</Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="bg-green-50 rounded-xl p-6 text-center">
        <p className="text-2xl mb-2">✅</p>
        <p className="text-sm text-green-700 font-medium">Reseña enviada. Será publicada tras moderación.</p>
      </div>
    );
  }

  return <ReviewForm productId={productId} onSuccess={() => setSubmitted(true)} />;
}
