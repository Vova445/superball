'use client';

import { ReactNode } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';

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

export function PageShell({ children, title, maxWidth = '6xl' }: PageShellProps) {
  return (
    <main className="arcade-bg relative min-h-screen px-4 pb-4 pt-[92px] md:px-8 md:pb-8">
      <AppHeader />
      <div className={`relative z-10 mx-auto w-full ${maxW[maxWidth]}`}>
        {title && <h1 className="mb-6 font-sans text-2xl font-bold text-white md:text-3xl">{title}</h1>}
        {children}
      </div>
    </main>
  );
}
