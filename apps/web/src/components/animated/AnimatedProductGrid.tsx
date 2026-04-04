'use client';

import { useGSAP } from '@/lib/gsap';
import { gsap } from 'gsap';
import { useRef, useEffect } from 'react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: string | number;
  images?: string[];
}

interface AnimatedProductGridProps {
  products: Product[];
}

export function AnimatedProductGrid({ products }: AnimatedProductGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useGSAP(() => {
    if (!products.length) return;

    const tl = gsap.timeline();

    // Animate title
    tl.fromTo(titleRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
    );

    // Animate product cards with stagger
    const productCards = gridRef.current?.querySelectorAll('.product-card');
    if (productCards) {
      tl.fromTo(productCards,
        {
          y: 50,
          opacity: 0,
          scale: 0.9
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "back.out(1.7)"
        },
        "-=0.3"
      );
    }
  }, { scope: gridRef, dependencies: [products] });

  if (!products.length) {
    return <p className="text-gray-500">No hay productos destacados aún.</p>;
  }

  return (
    <section ref={gridRef} className="max-w-7xl mx-auto px-6 w-full">
      <h2 ref={titleRef} className="text-2xl md:text-3xl font-bold mb-8 text-center">
        Productos destacados
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <AnimatedProductCard key={product.id} product={product} index={index} />
        ))}
      </div>
    </section>
  );
}

function AnimatedProductCard({ product, index }: { product: Product; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const card = cardRef.current;
    if (!card) return;

    // Add hover animations
    const handleMouseEnter = () => {
      gsap.to(card.querySelector('.product-image'), {
        scale: 1.1,
        duration: 0.3,
        ease: "power2.out"
      });
      gsap.to(card.querySelector('.product-info'), {
        y: -5,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    const handleMouseLeave = () => {
      gsap.to(card.querySelector('.product-image'), {
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      });
      gsap.to(card.querySelector('.product-info'), {
        y: 0,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, { scope: cardRef });

  return (
    <Link href={`/shop/products/${product.slug}`} className="group product-card">
      <div ref={cardRef} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
        <div className="aspect-square bg-gray-100 rounded-t-xl overflow-hidden relative">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="product-image w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <span className="text-gray-500 text-sm">Sin imagen</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
        </div>
        <div className="product-info p-4">
          <p className="font-medium text-sm line-clamp-2 mb-2 text-gray-900">{product.name}</p>
          <p className="text-indigo-600 font-bold text-lg">
            ${Number(product.price).toLocaleString('es-CO')}
          </p>
        </div>
      </div>
    </Link>
  );
}