import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center">
        <p className="text-6xl mb-4">🔍</p>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-gray-500 mb-6">Página no encontrada</p>
        <Link
          href="/"
          className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-indigo-700"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
