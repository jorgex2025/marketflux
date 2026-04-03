import type { Metadata } from 'next';
import { QueryProvider } from '@/components/providers/query-provider';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'MarketFlux', template: '%s | MarketFlux' },
  description: 'Marketplace Multivendor',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-zinc-50 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-50">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
