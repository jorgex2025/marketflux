import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';
import { useGSAP } from '@gsap/react';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP, ScrollTrigger, TextPlugin);

  // Default GSAP configuration (client-side only)
  gsap.set('html', {
    scrollBehavior: 'smooth'
  });
}

// Export GSAP instance and plugins for use throughout the app
export { gsap, useGSAP, ScrollTrigger, TextPlugin };