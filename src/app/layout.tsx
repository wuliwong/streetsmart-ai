import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import 'mapbox-gl/dist/mapbox-gl.css';

// Using Inter for a clean, modern, and highly legible UI typography
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Streetsmarts V2',
  description: 'Discover your surroundings with a premium spatial experience.',
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
