import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ChatWidget from '@/components/support/ChatWidget';
import CallWidget from '@/components/support/CallWidget';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://autoparts.ir';
const SITE_NAME = 'یدک استوریج';
const SITE_DESC = 'خرید آنلاین قطعات خودرو با بهترین قیمت، ضمانت اصالت کالا و ارسال سریع به سراسر ایران. بیش از ۵۰۰۰۰ قطعه یدکی اصلی برای انواع خودروها.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESC,
  keywords: ['قطعات خودرو', 'قطعه یدکی', 'لوازم یدکی خودرو', 'فروشگاه قطعات خودرو', 'خرید قطعه خودرو', 'لوازم یدکی اصل', 'قطعات یدکی اصلی'],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESC,
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESC,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa-IR" dir="rtl">
      <body className="min-h-screen flex flex-col bg-gray-50">
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <ChatWidget />
        <CallWidget />
      </body>
    </html>
  );
}
