import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/components/Toast';
import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'Malzz Nokos — Beli Nomor Virtual & OTP',
  description:
    'Platform cepat & simpel untuk membeli nomor virtual & menerima OTP otomatis.',
};

export const viewport: Viewport = {
  themeColor: '#0a0e1a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>
            <div className="app-shell">{children}</div>
            <BottomNav />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
