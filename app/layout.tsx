import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Shorts Auto System',
  description: 'Automated video publishing for US audience',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
