import { Orbitron, Rajdhani } from 'next/font/google';
import { VisualSettingsApplier } from '@/components/VisualSettingsApplier';
import './globals.css';

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  weight: ['500', '600', '700', '800', '900'],
});

const rajdhani = Rajdhani({
  subsets: ['latin'],
  variable: '--font-rajdhani',
  weight: ['400', '500', '600', '700'],
});

export const metadata = {
  title: 'MEGABOL — Online PvP Football',
  description: 'Competitive neon arcade football. Jump in, dominate the arena.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk" className={`${orbitron.variable} ${rajdhani.variable}`}>
      <body className="min-h-screen bg-megaball-dark font-body text-white antialiased">
        <VisualSettingsApplier />
        {children}
      </body>
    </html>
  );
}
