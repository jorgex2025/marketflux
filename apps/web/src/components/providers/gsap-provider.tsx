'use client';

import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';
import { useGSAP } from '@gsap/react';

export function GSAPProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register GSAP plugins
    gsap.registerPlugin(useGSAP, ScrollTrigger, TextPlugin);

    // Default GSAP configuration
    gsap.set('html', {
      scrollBehavior: 'smooth'
    });

    // Cleanup function
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return <>{children}</>;
}