'use client';

import { useState, useEffect } from 'react';

interface FlashSaleCountdownProps {
  endDate: string;
  className?: string;
}

export function FlashSaleCountdown({ endDate, className = '' }: FlashSaleCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const calculate = () => {
      const end = new Date(endDate).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setExpired(true);
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  if (expired) {
    return (
      <div className={`bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold ${className}`}>
        ¡Oferta finalizada!
      </div>
    );
  }

  const units = [
    { label: 'd', value: timeLeft.days },
    { label: 'h', value: timeLeft.hours },
    { label: 'm', value: timeLeft.minutes },
    { label: 's', value: timeLeft.seconds },
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs font-bold text-red-500 uppercase tracking-wide mr-1">Termina en:</span>
      {units.map((unit) => (
        <div key={unit.label} className="bg-red-500 text-white rounded-lg px-2.5 py-1.5 text-center min-w-[40px]">
          <span className="text-lg font-bold tabular-nums">{String(unit.value).padStart(2, '0')}</span>
          <span className="text-xs opacity-80 ml-0.5">{unit.label}</span>
        </div>
      ))}
    </div>
  );
}
