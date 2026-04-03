'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '../../../lib/auth-client';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    token ? 'loading' : 'error',
  );

  useEffect(() => {
    if (!token) return;
    authClient.verifyEmail({ query: { token } })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 text-center space-y-4">
        {status === 'loading' && (
          <><div className="text-4xl animate-spin">⌛</div><p>Verificando tu correo...</p></>
        )}
        {status === 'success' && (
          <>
            <div className="text-4xl">✅</div>
            <h2 className="text-xl font-bold">Correo verificado</h2>
            <p className="text-sm text-gray-500">Tu cuenta está lista.</p>
            <Link href="/" className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm
              font-semibold text-white hover:bg-indigo-700">
              Ir al inicio
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-4xl">❌</div>
            <h2 className="text-xl font-bold">Enlace inválido o expirado</h2>
            <Link href="/login" className="text-indigo-600 text-sm hover:underline">Volver al login</Link>
          </>
        )}
      </div>
    </div>
  );
}
