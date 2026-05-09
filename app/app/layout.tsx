import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SoundChain',
  description: 'Decentralized music collaboration on Solana. Composers post beats, producers remix, winners get paid on-chain.',
  icons: {
    icon: '/soundchain-icon.svg',
    apple: '/soundchain-icon.svg',
  },
  openGraph: {
    title: 'SoundChain',
    description: 'Decentralized music collaboration on Solana. Composers post beats, producers remix, winners get paid on-chain.',
    url: 'https://soundchain-iota.vercel.app',
    siteName: 'SoundChain',
    images: [
      {
        url: 'https://jrplwantzsaefdskhnlq.supabase.co/storage/v1/object/public/videos/soundchain-og.png',
        width: 1200,
        height: 630,
        alt: 'SoundChain',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SoundChain',
    description: 'Decentralized music collaboration on Solana.',
    images: ['https://jrplwantzsaefdskhnlq.supabase.co/storage/v1/object/public/videos/soundchain-og.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
