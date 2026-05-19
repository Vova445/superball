import { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant =
  | 'default'
  | 'common'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-megaball-surface border-megaball-border text-white/80',
  common: 'bg-rarity-common/20 border-rarity-common text-rarity-common',
  rare: 'bg-rarity-rare/20 border-rarity-rare text-rarity-rare',
  epic: 'bg-rarity-epic/20 border-rarity-epic text-rarity-epic',
  legendary: 'bg-rarity-legendary/20 border-rarity-legendary text-rarity-legendary',
  mythic: 'bg-rarity-mythic/20 border-rarity-mythic text-rarity-mythic',
};

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 font-orbitron text-xs font-semibold uppercase tracking-wide',
        variantStyles[variant],
        variant !== 'default' && 'shadow-glow-sm',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
