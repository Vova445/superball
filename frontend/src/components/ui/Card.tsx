import { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type CardVariant = 'default' | 'interactive';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  glow?: 'purple' | 'cyan' | 'none';
}

const glowStyles = {
  purple: 'hover:border-megaball-purple hover:shadow-neon-purple',
  cyan: 'hover:border-megaball-cyan hover:shadow-neon-cyan',
  none: '',
};

export function Card({
  variant = 'default',
  glow = 'none',
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-arcade-xl border border-megaball-border bg-megaball-surface/80 p-6 shadow-neon-card backdrop-blur-xl',
        variant === 'interactive' &&
          'cursor-pointer transition-all duration-300 hover:-translate-y-1',
        variant === 'interactive' && glowStyles[glow],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
