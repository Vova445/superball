'use client';

import { cn } from '@/lib/cn';

export interface TabItem<T extends string> {
  id: T;
  label: string;
}

interface TabsProps<T extends string> {
  tabs: readonly TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
}

export function Tabs<T extends string>({ tabs, active, onChange, className }: TabsProps<T>) {
  return (
    <div className={cn('flex flex-wrap gap-2 border-b border-megaball-border pb-2', className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'rounded-arcade px-4 py-2 font-orbitron text-xs font-bold uppercase tracking-wider transition-all',
            active === tab.id
              ? 'bg-megaball-purple/30 text-megaball-cyan shadow-neon-cyan'
              : 'text-white/50 hover:text-white hover:bg-megaball-surface'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
