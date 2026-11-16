import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mandya Jobs | ಮಂಡ್ಯ ಜಾಬ್ಸ್',
  description: 'Local opportunities. Verified employers. Relevant careers in Mandya.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#2454D6',
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
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="antialiased bg-[#F5F7FB] min-h-screen">{children}</body>
    </html>
  );
}
