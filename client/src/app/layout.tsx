import type { Metadata } from 'next';
import { Outfit, Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import ParticleBackground from '@/components/ParticleBackground';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Normie Life Simulator — AI-Powered Virtual World',
  description: 'A persistent AI-driven social simulation where 10 autonomous characters interact, evolve, and generate emergent stories without user control.',
  keywords: 'AI simulation, NFT characters, autonomous AI, virtual world, social simulation',
  openGraph: {
    title: 'Normie Life Simulator',
    description: 'Watch AI characters live their lives — autonomously.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body>
        <ParticleBackground />
        <Navbar />
        <main className="main-content">{children}</main>
      </body>
    </html>
  );
}
