'use client';
import { useState } from 'react';

type Product = {
  id: string;
  name: string;
  price: string;
  stock: number;
  images: string[];
  slug: string;
};

export default function AddToCartButton({ product }: { product: Product }) {
  const [qty,     setQty]     = useState(1);
  const [added,   setAdded]   = useState(false);

  // TODO Fase 5: conectar con cartStore (Zustand)
  function handleAddToCart() {
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="w-9 h-9 rounded-full border text-lg font-bold flex items-center justify-center
                     hover:bg-gray-100 disabled:opacity-40"
          disabled={qty <= 1 || product.stock === 0}
        >-</button>
        <span className="w-8 text-center font-semibold">{qty}</span>
        <button
          onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
          className="w-9 h-9 rounded-full border text-lg font-bold flex items-center justify-center
                     hover:bg-gray-100 disabled:opacity-40"
          disabled={qty >= product.stock || product.stock === 0}
        >+</button>
      </div>

      <button
        onClick={handleAddToCart}
        disabled={product.stock === 0}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition
          ${ added
            ? 'bg-green-500 text-white'
            : product.stock === 0
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
      >
        {added ? '✓ Agregado al carrito' : product.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
      </button>
    </div>
  );
}
