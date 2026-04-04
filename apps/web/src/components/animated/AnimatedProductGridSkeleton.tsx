'use client';

import { useGSAP } from '@/lib/gsap';
import { gsap } from 'gsap';
import { useRef, useEffect } from 'react';

export function AnimatedProductGridSkeleton() {
  const skeletonRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const skeletonCards = skeletonRef.current?.querySelectorAll('.skeleton-card');

    if (skeletonCards) {
      gsap.fromTo(skeletonCards,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.1,
          ease: "power2.out"
        }
      );

      // Add shimmer effect
      skeletonCards.forEach((card) => {
        gsap.to(card.querySelector('.shimmer'), {
          x: '100%',
          duration: 1.5,
          ease: "none",
          repeat: -1,
          yoyo: true
        });
      });
    }
  }, { scope: skeletonRef });

  return (
    <div ref={skeletonRef} className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="skeleton-card bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
          <div className="aspect-square bg-gray-200 rounded-t-xl relative overflow-hidden">
            <div className="shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -translate-x-full" />
          </div>
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded relative overflow-hidden">
              <div className="shimmer absolute inset-0 bg-gradient-to-r from-transparent via-gray-100 to-transparent transform -translate-x-full" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-1/2 relative overflow-hidden">
              <div className="shimmer absolute inset-0 bg-gradient-to-r from-transparent via-gray-100 to-transparent transform -translate-x-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}