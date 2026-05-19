'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui';

interface PageShellProps {
  children: ReactNode;
  title?: string;
  showLogo?: boolean;
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | 'full';
}

const maxW = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '6xl': 'max-w-6xl',
  full: 'max-w-full',
};

export function PageShell({ children, title, showLogo = false, maxWidth = '6xl' }: PageShellProps) {
  const router = useRouter();

  return (
    <main className="arcade-bg relative min-h-screen p-4 md:p-8">
      <div className="pointer-events-none absolute top-[-10%] left-[-5%] h-[40%] w-[40%] rounded-full bg-megaball-purple/15 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-5%] h-[40%] w-[40%] rounded-full bg-megaball-cyan/10 blur-[100px]" />

      <div className={`relative z-10 mx-auto w-full ${maxW[maxWidth]}`}>
        <header className="mb-6 flex items-center justify-between gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="shrink-0">
            ← Menu
          </Button>
          {title && <h1 className="arcade-heading flex-1 text-center text-xl md:text-2xl">{title}</h1>}
          {showLogo ? <Logo size="sm" showWordmark={false} /> : <div className="w-20" />}
        </header>
        {children}
      </div>
    </main>
  );
}
