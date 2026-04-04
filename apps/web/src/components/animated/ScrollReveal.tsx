'use client';

import { useGSAP } from '@/lib/gsap';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef, useEffect } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
  delay?: number;
  duration?: number;
  className?: string;
}

export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.8,
  className = ''
}: ScrollRevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const element = elementRef.current;
    if (!element) return;

    // Set initial state based on direction
    let initialProps: any = { opacity: 0 };
    let animateProps: any = { opacity: 1 };

    switch (direction) {
      case 'up':
        initialProps.y = 50;
        animateProps.y = 0;
        break;
      case 'down':
        initialProps.y = -50;
        animateProps.y = 0;
        break;
      case 'left':
        initialProps.x = 50;
        animateProps.x = 0;
        break;
      case 'right':
        initialProps.x = -50;
        animateProps.x = 0;
        break;
      case 'fade':
        // Only opacity animation
        break;
    }

    // Set initial state
    gsap.set(element, initialProps);

    // Create scroll trigger
    ScrollTrigger.create({
      trigger: element,
      start: 'top 80%',
      end: 'bottom 20%',
      onEnter: () => {
        gsap.to(element, {
          ...animateProps,
          duration,
          delay,
          ease: "power3.out"
        });
      },
      onLeaveBack: () => {
        gsap.set(element, initialProps);
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, { scope: elementRef });

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
}