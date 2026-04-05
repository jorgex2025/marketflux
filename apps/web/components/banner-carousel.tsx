'use client';

import { useEffect, useState, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface Banner {
  id: string;
  name: string;
  imageUrl: string;
  linkUrl?: string;
  position: string;
  active: boolean;
}

interface BannerCarouselProps {
  position?: string;
  autoPlay?: boolean;
  interval?: number;
}

export function BannerCarousel({ position = 'home_hero', autoPlay = true, interval = 5000 }: BannerCarouselProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    fetch(`${API}/banners?position=${position}&active=true`, { credentials: 'include' })
      .then((r) => r.json())
      .then((res) => setBanners(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [position]);

  useEffect(() => {
    if (autoPlay && banners.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrent((c) => (c + 1) % banners.length);
      }, interval);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [autoPlay, banners.length, interval]);

  const goNext = () => setCurrent((c) => (c + 1) % banners.length);
  const goPrev = () => setCurrent((c) => (c - 1 + banners.length) % banners.length);

  if (loading) {
    return <div className="w-full h-64 md:h-80 lg:h-96 bg-zinc-100 rounded-2xl animate-pulse" />;
  }

  if (banners.length === 0) return null;

  return (
    <div className="relative rounded-2xl overflow-hidden group">
      <div className="relative h-64 md:h-80 lg:h-96">
        {banners.map((banner, i) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-500 ${i === current ? 'opacity-100' : 'opacity-0'}`}
          >
            {banner.linkUrl ? (
              <a href={banner.linkUrl} className="block w-full h-full">
                <img src={banner.imageUrl} alt={banner.name} className="w-full h-full object-cover" />
              </a>
            ) : (
              <img src={banner.imageUrl} alt={banner.name} className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      {banners.length > 1 && (
        <>
          <button onClick={goPrev} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            <ChevronLeftIcon className="h-5 w-5 text-zinc-700" />
          </button>
          <button onClick={goNext} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            <ChevronRightIcon className="h-5 w-5 text-zinc-700" />
          </button>
        </>
      )}

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/70'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
