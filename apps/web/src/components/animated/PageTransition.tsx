'use client';

import { useGSAP } from '@/lib/gsap';
import { gsap } from 'gsap';
import { useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useGSAP(() => {
    const container = containerRef.current;
    if (!container) return;

    // Page enter animation
    gsap.fromTo(container,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out"
      }
    );
  }, { scope: containerRef, dependencies: [pathname] });

  return (
    <div ref={containerRef} className="min-h-screen">
      {children}
    </div>
  );
}