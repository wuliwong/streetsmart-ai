import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import 'mapbox-gl/dist/mapbox-gl.css';

// Using Inter for a clean, modern, and highly legible UI typography
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'StreetSmarts',
  description: 'Discover your surroundings. Find coffee, food, parks, gyms, and more near any address.',
  metadataBase: new URL('https://streetsmarts.app'),
  openGraph: {
    title: 'StreetSmarts',
    description: 'Discover your surroundings. Find coffee, food, parks, gyms, and more near any address.',
    url: 'https://streetsmarts.app',
    siteName: 'StreetSmarts',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'StreetSmarts – Explore your neighborhood',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StreetSmarts',
    description: 'Discover your surroundings. Find coffee, food, parks, gyms, and more near any address.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
