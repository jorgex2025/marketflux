'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-6xl mb-4">⚠️</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Algo salió mal</h1>
          <p className="text-gray-500 mb-6">{error.message ?? 'Error inesperado'}</p>
          <button
            onClick={reset}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-indigo-700"
          >
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  );
}
