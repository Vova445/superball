'use client';

import {
  BarChart3,
  Boxes,
  Check,
  ChevronDown,
  Gem,
  Grid2X2,
  PackageOpen,
  Search,
  Shield,
  Shirt,
  ShoppingCart,
  Sparkles,
  Star,
  Trophy,
  Users,
} from 'lucide-react';
import { useMemo } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/cn';

const players = [
  { name: 'Ronaldo', rating: 91, position: 'ST', nation: 'PT', club: 'ALN', image: '/assets/players/karius.png', tone: 'emerald' },
  { name: 'Neymar Jr', rating: 89, position: 'LW', nation: 'BR', club: 'SAN', image: '/assets/players/karius.png', tone: 'gold' },
  { name: 'De Bruyne', rating: 87, position: 'CM', nation: 'BE', club: 'MCI', image: '/assets/players/karius.png', tone: 'sky' },
  { name: 'van Dijk', rating: 86, position: 'CB', nation: 'NL', club: 'LIV', image: '/assets/players/karius.png', tone: 'red' },
  { name: 'Alisson', rating: 85, position: 'GK', nation: 'BR', club: 'LIV', image: '/assets/players/karius.png', tone: 'teal' },
  { name: 'Salah', rating: 84, position: 'RW', nation: 'EG', club: 'LIV', image: '/assets/players/karius.png', tone: 'amber' },
  { name: 'Kante', rating: 83, position: 'CDM', nation: 'FR', club: 'CHE', image: '/assets/players/karius.png', tone: 'blue' },
  { name: 'Cancelo', rating: 82, position: 'LB', nation: 'PT', club: 'BAR', image: '/assets/players/karius.png', tone: 'cyan' },
];

const navItems = [
  { label: 'Players', icon: Users, active: true },
  { label: 'Crates', icon: PackageOpen },
  { label: 'Boosts', icon: Sparkles },
  { label: 'Badges', icon: Shield },
  { label: 'Collections', icon: Boxes },
  { label: 'Statistics', icon: BarChart3 },
];

const crates = [
  { name: 'Gold Crate', amount: 2, description: 'Contains 3 items, with a chance of Rare or Epic.', tone: 'gold' as const },
  { name: 'Elite Crate', amount: 2, description: 'Contains 5 items, with a chance of Epic or Legendary.', tone: 'purple' as const },
  { name: 'Legendary Crate', amount: 1, description: 'Contains 5 premium items, with a chance of Legendary.', tone: 'orange' as const },
];

const rewardItems = [
  { label: 'Claimed', icon: Check, claimed: true },
  { label: 'Claimed', icon: Check, claimed: true },
  { label: 'Day 3', value: '100', icon: Trophy, tone: 'gold' },
  { label: 'Day 4', value: '200', icon: Gem, tone: 'cyan' },
  { label: 'Premium Crate', icon: PackageOpen, tone: 'orange' },
];

export function InventoryScreen() {
  const user = useAuthStore((state) => state.user);
  const displayName = user?.nickname || user?.username || 'Test1';
  const collectionRows = useMemo(
    () => [
      ['Players', '24 / 50'],
      ['Badges', '8 / 20'],
      ['Kits', '5 / 15'],
      ['Stadiums', '3 / 10'],
    ],
    []
  );

  return (
    <section className="relative min-h-[calc(100vh-80px)] overflow-hidden rounded-[8px] border border-white/10 bg-[#02080a] text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
      <div className="pointer-events-none absolute inset-0 bg-[url('/assets/menu/locker_room.png')] bg-cover bg-center opacity-20 blur-[1px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_63%_0%,rgba(0,245,255,0.23),transparent_33%),linear-gradient(180deg,rgba(3,11,14,0.72),rgba(0,0,0,0.92))]" />

      <div className="relative z-10 grid min-h-[calc(100vh-80px)] gap-4 p-4 lg:grid-cols-[212px_minmax(0,1fr)_420px] xl:p-5">
        <aside className="flex min-h-[720px] flex-col rounded-[8px] border border-cyan-300/10 bg-black/35 p-5 shadow-[inset_0_0_36px_rgba(0,245,255,0.04)] backdrop-blur-md">
          <div>
            <p className="text-[27px] font-black uppercase leading-none text-white">Locker Room</p>
            <p className="mt-2 text-[12px] font-semibold text-white/45">{displayName}</p>
          </div>

          <nav className="mt-7 space-y-2">
            {navItems.map(({ label, icon: Icon, active }) => (
              <button
                key={label}
                type="button"
                className={cn(
                  'group flex h-14 w-full items-center gap-4 rounded-[7px] px-4 text-left text-[14px] font-bold uppercase text-white/72 transition',
                  active
                    ? 'border border-[#00e0b2]/55 bg-[#00d69f]/22 text-white shadow-[0_0_24px_rgba(0,214,159,0.22),inset_3px_0_0_#00f0c0]'
                    : 'hover:bg-white/[0.055] hover:text-white'
                )}
              >
                <Icon className={cn('h-5 w-5', active ? 'text-[#00f0c0]' : 'text-white/62 group-hover:text-[#00f0c0]')} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <button type="button" className="mt-auto flex h-12 items-center gap-4 rounded-[7px] border border-white/10 bg-white/[0.055] px-4 text-[13px] font-bold uppercase text-white/76 transition hover:border-[#00d69f]/45 hover:text-white">
            <Shirt className="h-5 w-5 text-white/65" />
            Customization
          </button>
        </aside>

        <main className="min-w-0 space-y-4">
          <Panel className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-5">
                <h2 className="text-[19px] font-black uppercase text-white">Your Players</h2>
                <span className="text-[13px] font-bold text-white/35">24 / 50</span>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <div className="flex h-10 min-w-[260px] flex-1 items-center gap-3 rounded-[6px] border border-white/5 bg-[#041318]/80 px-3 text-white/42">
                <Search className="h-4 w-4" />
                <span className="text-[13px]">Search players...</span>
              </div>
              <FilterButton label="Position" />
              <FilterButton label="Sort by" />
              <button type="button" className="grid h-10 w-10 place-items-center rounded-[6px] border border-[#00d69f]/20 bg-[#00d69f]/10 text-[#00f0c0]">
                <Grid2X2 className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-4">
              {players.map((player) => (
                <PlayerCard key={player.name} {...player} />
              ))}
            </div>

            <button type="button" className="mt-5 h-10 w-full rounded-[5px] border border-[#00d69f]/10 bg-[#00d69f]/8 text-[13px] font-black uppercase text-[#00f0c0] transition hover:border-[#00d69f]/45 hover:bg-[#00d69f]/14">
              View All Players
            </button>
          </Panel>

          <div className="grid gap-4 xl:grid-cols-2">
            <Panel className="p-5">
              <h3 className="text-[18px] font-black uppercase text-white">Squad Chemistry</h3>
              <div className="mt-5 grid items-center gap-5 sm:grid-cols-[145px_1fr]">
                <RadialStat value="78%" label="Good" />
                <ChemistryMap />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_120px]">
                <div className="rounded-[5px] bg-white/[0.035] px-4 py-3 text-[13px] text-white/55">Active Boost: <span className="text-white">None</span></div>
                <GreenButton>Manage</GreenButton>
              </div>
            </Panel>

            <Panel className="p-5">
              <h3 className="text-[18px] font-black uppercase text-white">Collection Progress</h3>
              <div className="mt-5 grid items-center gap-5 sm:grid-cols-[145px_1fr]">
                <RadialStat value="64%" label="Completed" />
                <div className="space-y-2">
                  {collectionRows.map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between text-[14px]">
                      <span className="text-white/62">{label}</span>
                      <span className="font-bold text-white/86">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <GreenButton className="mt-5 w-full">View Collections</GreenButton>
            </Panel>
          </div>
        </main>

        <InventorySide />

        <div className="lg:col-span-3">
          <div className="flex h-10 items-center gap-2 rounded-[6px] border border-white/5 bg-black/25 px-4 text-[13px] text-white/55 backdrop-blur-md">
            <Star className="h-4 w-4 text-yellow-300" />
            <span>Tip: Complete daily challenges to earn exclusive rewards!</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function InventorySide() {
  return (
    <aside className="space-y-4">
      <Panel className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-black uppercase text-white">Unopened Crates</h2>
          <span className="text-[16px] font-black text-white/80">5</span>
        </div>
        <div className="mt-5 space-y-3">
          {crates.map((crate) => (
            <CrateRow key={crate.name} {...crate} />
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-[13px] font-black uppercase text-white/78">Get More Crates</span>
          <GreenButton className="w-28">
            <ShoppingCart className="h-4 w-4" />
            Store
          </GreenButton>
        </div>
      </Panel>

      <Panel className="p-5">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-[18px] font-black uppercase text-white">Daily Rewards</h2>
          <div className="text-right">
            <p className="text-[12px] font-semibold text-white/45">Next Reward in:</p>
            <p className="text-[21px] font-black tabular-nums text-[#00f0c0]">08:24:15</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-5 gap-2">
          {rewardItems.map((reward) => {
            const Icon = reward.icon;
            return (
              <div
                key={reward.label}
                className={cn(
                  'min-h-[88px] rounded-[6px] border bg-white/[0.035] p-2 text-center',
                  reward.claimed ? 'border-[#00d69f]/22 bg-[#00d69f]/8' : 'border-white/10',
                  reward.tone === 'gold' && 'border-yellow-400/35 bg-yellow-400/10',
                  reward.tone === 'cyan' && 'border-cyan-300/30 bg-cyan-300/8',
                  reward.tone === 'orange' && 'border-orange-400/30 bg-orange-400/8'
                )}
              >
                <div className="mx-auto grid h-10 w-10 place-items-center rounded-full text-[#00f0c0]">
                  <Icon className="h-6 w-6" />
                </div>
                {reward.value && <p className="mt-1 text-[12px] font-black text-white">{reward.value}</p>}
                <p className="mt-1 text-[11px] leading-tight text-white/52">{reward.label}</p>
              </div>
            );
          })}
        </div>
        <GreenButton className="mt-5 w-full">View All Rewards</GreenButton>
      </Panel>
    </aside>
  );
}

function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={cn('rounded-[8px] border border-cyan-300/10 bg-[#031014]/72 shadow-[inset_0_0_34px_rgba(0,245,255,0.035)] backdrop-blur-md', className)}>
      {children}
    </section>
  );
}

function FilterButton({ label }: { label: string }) {
  return (
    <button type="button" className="flex h-10 min-w-[136px] items-center justify-between rounded-[6px] border border-white/6 bg-[#041318]/80 px-3 text-[12px] font-bold uppercase text-white/45">
      {label}
      <ChevronDown className="h-4 w-4" />
    </button>
  );
}

function PlayerCard({
  name,
  rating,
  position,
  nation,
  club,
  image,
  tone,
}: {
  name: string;
  rating: number;
  position: string;
  nation: string;
  club: string;
  image: string;
  tone: string;
}) {
  const toneClass =
    tone === 'gold'
      ? 'from-yellow-400/24'
      : tone === 'red'
        ? 'from-red-500/24'
        : tone === 'sky' || tone === 'blue'
          ? 'from-sky-400/24'
          : tone === 'amber'
            ? 'from-amber-500/24'
            : 'from-[#00d69f]/24';

  return (
    <button
      type="button"
      className="group relative min-h-[168px] overflow-hidden rounded-[8px] border border-[#00d6b2]/40 bg-[#031014] text-left shadow-[0_0_22px_rgba(0,214,178,0.12)] transition hover:-translate-y-0.5 hover:border-[#00f0c0]"
    >
      <div className={cn('absolute inset-0 bg-gradient-to-b via-transparent to-black/70', toneClass)} />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(180deg,transparent,rgba(0,214,159,0.18),rgba(0,0,0,0.58))]" />
      <img src={image} alt="" className="absolute bottom-0 right-1 h-[142px] w-[108px] object-cover object-top opacity-90 grayscale-[10%] transition group-hover:scale-105" />
      <div className="relative z-10 p-3">
        <p className="text-[25px] font-black leading-none text-white">{rating}</p>
        <p className="mt-1 text-[12px] font-black uppercase text-white">{position}</p>
        <div className="mt-3 space-y-1">
          <MiniBadge>{nation}</MiniBadge>
          <MiniBadge>{club}</MiniBadge>
        </div>
      </div>
      <p className="absolute inset-x-0 bottom-3 z-10 truncate px-3 text-center text-[15px] font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
        {name}
      </p>
    </button>
  );
}

function MiniBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid h-5 w-7 place-items-center rounded-[3px] border border-white/10 bg-black/42 text-[9px] font-black text-white/80">
      {children}
    </span>
  );
}

function ChemistryMap() {
  return (
    <div className="relative min-h-[132px]">
      <div className="absolute left-[34%] top-[18%] h-px w-[34%] rotate-[18deg] bg-cyan-200/30" />
      <div className="absolute left-[34%] top-[52%] h-px w-[31%] -rotate-[18deg] bg-cyan-200/30" />
      <div className="absolute left-[58%] top-[34%] h-px w-[22%] rotate-90 bg-cyan-200/30" />
      {['#0ad8b0', '#2c62e8', '#f1a33b', '#1eacff'].map((color, index) => (
        <span
          key={color}
          className="absolute grid h-10 w-10 place-items-center rounded-[8px] border border-white/15 bg-black/45 shadow-[0_0_18px_rgba(0,245,255,0.16)]"
          style={{
            left: `${index % 2 === 0 ? 24 : 62}%`,
            top: `${index < 2 ? 10 : 58}%`,
          }}
        >
          <Shield className="h-5 w-5" color={color} />
        </span>
      ))}
    </div>
  );
}

function CrateRow({
  name,
  amount,
  description,
  tone,
}: {
  name: string;
  amount: number;
  description: string;
  tone: 'gold' | 'purple' | 'orange';
}) {
  return (
    <div className="grid min-h-[100px] grid-cols-[78px_1fr_76px] items-center gap-3 rounded-[7px] border border-white/7 bg-white/[0.035] px-3">
      <div className="relative grid h-16 w-16 place-items-center">
        <div
          className={cn(
            'absolute h-12 w-12 rotate-45 rounded-[6px] border shadow-[0_0_20px_currentColor]',
            tone === 'gold' && 'border-yellow-300/70 bg-yellow-500/28 text-yellow-400',
            tone === 'purple' && 'border-fuchsia-300/70 bg-fuchsia-500/24 text-fuchsia-400',
            tone === 'orange' && 'border-orange-300/70 bg-orange-500/24 text-orange-400'
          )}
        />
        <PackageOpen className="relative z-10 h-9 w-9 text-white/88" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[15px] font-black text-white">{name}</p>
          <span className="text-[12px] font-bold text-white/50">x{amount}</span>
        </div>
        <p className="mt-2 line-clamp-2 text-[12px] leading-snug text-white/45">{description}</p>
      </div>
      <GreenButton>Open</GreenButton>
    </div>
  );
}

function RadialStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="relative grid h-[112px] w-[112px] place-items-center rounded-full bg-[conic-gradient(#00d69f_0_78%,rgba(255,255,255,0.08)_78%_100%)] p-[6px] shadow-[0_0_26px_rgba(0,214,159,0.16)]">
      <div className="grid h-full w-full place-items-center rounded-full bg-[#031014] text-center">
        <div>
          <p className="text-[28px] font-black leading-none text-white">{value}</p>
          <p className="mt-2 text-[12px] font-black text-[#00f0c0]">{label}</p>
        </div>
      </div>
    </div>
  );
}

function GreenButton({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-[5px] border border-[#00d69f]/35 bg-[#00d69f]/12 px-4 text-[12px] font-black uppercase text-[#00f0c0] transition hover:bg-[#00d69f]/20',
        className
      )}
    >
      {children}
    </button>
  );
}
