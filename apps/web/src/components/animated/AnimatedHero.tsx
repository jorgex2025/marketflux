'use client';

import { useGSAP } from '@/lib/gsap';
import { gsap } from 'gsap';
import { useRef } from 'react';
import Link from 'next/link';

export function AnimatedHero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLAnchorElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();

    // Animate title with text reveal effect
    tl.fromTo(titleRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
    )
    .fromTo(subtitleRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" },
      "-=0.4"
    )
    .fromTo(buttonRef.current,
      { y: 20, opacity: 0, scale: 0.9 },
      { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" },
      "-=0.3"
    );

    // Add floating animation to background
    gsap.to(heroRef.current, {
      backgroundPosition: "200% 0",
      duration: 20,
      ease: "none",
      repeat: -1
    });
  }, { scope: heroRef });

  return (
    <section
      ref={heroRef}
      className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white py-24 px-6 text-center relative overflow-hidden"
      style={{ backgroundSize: '200% 200%' }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full animate-pulse" />
        <div className="absolute top-32 right-16 w-16 h-16 bg-white rounded-full animate-pulse delay-1000" />
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white rounded-full animate-pulse delay-2000" />
      </div>

      <div className="relative z-10">
        <h1 ref={titleRef} className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
          El marketplace que conecta
        </h1>
        <p ref={subtitleRef} className="text-xl md:text-2xl mb-8 opacity-90 font-light">
          Miles de vendedores, millones de productos
        </p>
        <Link
          ref={buttonRef}
          href="/shop/search"
          className="inline-block bg-white text-indigo-600 font-semibold px-8 py-4 rounded-full hover:bg-indigo-50 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          Explorar tienda
        </Link>
      </div>
    </section>
  );
}