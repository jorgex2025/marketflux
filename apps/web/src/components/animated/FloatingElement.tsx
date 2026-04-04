'use client';

import { useGSAP } from '@/lib/gsap';
import { gsap } from 'gsap';
import { useRef } from 'react';

interface FloatingElementProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  yOffset?: number;
  xOffset?: number;
  delay?: number;
}

export function FloatingElement({
  children,
  className = '',
  duration = 3,
  yOffset = 10,
  xOffset = 0,
  delay = 0
}: FloatingElementProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const element = elementRef.current;
    if (!element) return;

    gsap.to(element, {
      y: -yOffset,
      x: xOffset,
      duration,
      ease: "power2.inOut",
      repeat: -1,
      yoyo: true,
      delay
    });
  }, { scope: elementRef });

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
}