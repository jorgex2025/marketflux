import { Suspense } from 'react';
import { AnimatedHero } from '@/components/animated/AnimatedHero';
import { AnimatedProductGrid } from '@/components/animated/AnimatedProductGrid';
import { AnimatedProductGridSkeleton } from '@/components/animated/AnimatedProductGridSkeleton';
import { ScrollReveal } from '@/components/animated/ScrollReveal';
import { FloatingElement } from '@/components/animated/FloatingElement';

async function getFeaturedProducts() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/products?featured=true&limit=8`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.data ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <div className="flex flex-col gap-16">
      {/* Animated Hero */}
      <AnimatedHero />

      {/* Featured Products Section */}
      <ScrollReveal direction="up" delay={0.2}>
        <Suspense fallback={<AnimatedProductGridSkeleton />}>
          <AnimatedProductGrid products={featured} />
        </Suspense>
      </ScrollReveal>

      {/* Stats Section */}
      <ScrollReveal direction="up" delay={0.3}>
        <section className="bg-gray-50 py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="relative">
                <FloatingElement yOffset={8} duration={4}>
                  <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                    <div className="text-4xl font-bold text-indigo-600 mb-2">1,000+</div>
                    <div className="text-gray-600">Vendedores activos</div>
                  </div>
                </FloatingElement>
              </div>
              <div className="relative">
                <FloatingElement yOffset={8} duration={4} delay={0.5}>
                  <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                    <div className="text-4xl font-bold text-purple-600 mb-2">10,000+</div>
                    <div className="text-gray-600">Productos únicos</div>
                  </div>
                </FloatingElement>
              </div>
              <div className="relative">
                <FloatingElement yOffset={8} duration={4} delay={1}>
                  <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                    <div className="text-4xl font-bold text-pink-600 mb-2">50,000+</div>
                    <div className="text-gray-600">Clientes satisfechos</div>
                  </div>
                </FloatingElement>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Call to Action */}
      <ScrollReveal direction="fade" delay={0.4}>
        <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16 px-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white rounded-full animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-white rounded-full animate-pulse delay-1000" />
          </div>
          <div className="relative z-10 max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Listo para vender tus productos?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Únete a miles de vendedores exitosos en nuestra plataforma
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/vendor/onboarding"
                className="inline-block bg-white text-indigo-600 font-semibold px-8 py-3 rounded-full hover:bg-indigo-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Comenzar a vender
              </a>
              <a
                href="/shop/search"
                className="inline-block border-2 border-white text-white font-semibold px-8 py-3 rounded-full hover:bg-white hover:text-indigo-600 transition-all duration-300"
              >
                Explorar productos
              </a>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}


