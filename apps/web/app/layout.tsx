import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/providers/query-provider';
import { ToastProvider } from '@/components/providers/toast-provider';
import { GSAPProvider } from '@/components/providers/gsap-provider';
import { CartDrawer } from '@/components/cart/cart-drawer';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { MainNav } from '@/components/layout/main-nav';
import { Footer } from '@/components/layout/footer';
import { PageTransition } from '@/components/animated/PageTransition';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: 'MarketFlux', template: '%s | MarketFlux' },
  description: 'Marketplace multivendor — compra y vende con confianza',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <GSAPProvider>
          <QueryProvider>
            <ToastProvider>
              <MainNav />
              <CartDrawer />
              <PageTransition>
                <main className="min-h-screen">{children}</main>
              </PageTransition>
              <Footer />
            </ToastProvider>
          </QueryProvider>
        </GSAPProvider>
      </body>
    </html>
  );
}
