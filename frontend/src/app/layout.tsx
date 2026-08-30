import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: 'AeroHealth Guard — Hyperlocal Air Quality & Health Sensing',
  description:
    'Platform pemantauan kualitas udara hiperlokal tingkat kelurahan, deteksi titik api satelit NASA FIRMS, AI Health Advisory, dan partisipasi kesehatan warga.',
  keywords: [
    'AeroHealth Guard',
    'ISPU Palembang',
    'Kualitas Udara Sumsel',
    'Hotspot NASA FIRMS',
    'Shelter Udara Bersih',
    'DSDC ANFORCOM 2026'
  ],
  authors: [{ name: 'AeroHealth Guard Team' }]
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1B4332'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="h-full w-full overflow-hidden font-sans bg-[#FBFBFA] text-[#1A2E26]">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
