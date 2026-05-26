'use client';

import { Settings2 } from 'lucide-react';
import { type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocaleStore } from '@/store/useLocaleStore';
import { useAuthStore } from '@/store/useAuthStore';

interface AppHeaderProps {
  active?: 'settings' | 'shop';
}

const headerText = {
  en: {
    settings: 'Settings',
    online: 'Online',
    mmr: 'MMR',
    coins: 'Coins',
    diamonds: 'Diamonds',
    player: 'Player',
    level: 'Level',
  },
  uk: {
    settings: 'Налаштування',
    online: 'Онлайн',
    mmr: 'MMR',
    coins: 'Монети',
    diamonds: 'Діаманти',
    player: 'Гравець',
    level: 'Рівень',
  },
} as const;

function HudPill({
  label,
  value,
  icon,
  dot = false,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  dot?: boolean;
  tone?: 'neutral' | 'gold' | 'cyan' | 'sky';
}) {
  const toneClass =
    tone === 'gold'
      ? 'border-yellow-300/15 bg-yellow-300/[0.07]'
      : tone === 'cyan'
        ? 'border-cyan-300/15 bg-cyan-300/[0.07]'
        : tone === 'sky'
          ? 'border-sky-300/15 bg-sky-300/[0.08]'
          : 'border-white/10 bg-white/[0.045]';

  return (
    <div className={cn('hidden h-10 min-w-[130px] items-center gap-2 rounded-full px-4 sm:flex', toneClass)}>
      {dot && <span className="h-2 w-2 rounded-full bg-[#58e789] shadow-[0_0_10px_rgba(88,231,137,0.65)]" />}
      {icon && <span className="flex h-10 w-10 items-center justify-center text-white/70">{icon}</span>}
      <span className="text-[12px] leading-none font-medium uppercase tracking-[0.12em] text-white/46">{label}</span>
      {value && <span className="text-[14px] leading-none font-semibold tabular-nums text-white/88">{value}</span>}
    </div>
  );
}

export function AppHeader({ active }: AppHeaderProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const locale = useLocaleStore((state) => state.locale);

  const labels = headerText[locale];

  return (
    <header className="absolute left-0 top-0 z-30 flex h-[58px] w-full items-center justify-between border-b border-white/10 bg-[#030609]/72 px-4 font-sans shadow-[0_12px_34px_rgba(0,0,0,0.28)] backdrop-blur-md md:px-7">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />

      <div className="flex min-w-0 items-center gap-3.5">
        <button type="button" onClick={() => router.push('/')} className="shrink-0">
          <Logo size="sm" />
        </button>
      </div>

      <div className="flex items-center justify-end gap-3">
        <HudPill
          label={labels.mmr}
          value={String(user?.mmr ?? 1000)}
          icon={<img src="/assets/icons/mmr.png" alt="MMR" className="block h-10 w-10 object-contain" />}
          tone="sky"
        />
        <HudPill
          label={labels.coins}
          value="12,450"
          icon={<img src="/assets/icons/coin.png" alt="Coins" className="block h-9 w-9 object-contain" />}
          tone="gold"
        />
        <HudPill
          label={labels.diamonds}
          value="320"
          icon={<img src="/assets/icons/diamond.png" alt="Diamonds" className="block h-9 w-9 object-contain" />}
          tone="cyan"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/settings')}
          className={cn(
            'group flex h-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.045] pl-3 pr-4 text-white/72 transition-all duration-300 hover:border-white/24 hover:bg-white/[0.08] hover:text-white hover:shadow-none',
            active === 'settings' && 'border-[#00d69f]/50 bg-[#00d69f]/10 text-white'
          )}
        >
          <span className="flex h-10 w-10 min-w-[36px] items-center justify-center text-white/72 transition-colors duration-300 group-hover:text-white">
            <Settings2 className="h-5 w-5" />
          </span>
          <span className="flex h-full items-center max-w-0 overflow-hidden whitespace-nowrap text-[13px] font-semibold leading-none transition-all duration-300 opacity-0 group-hover:max-w-[100px] group-hover:opacity-100">
            {labels.settings}
          </span>
        </Button>
      </div>
    </header>
  );
}
