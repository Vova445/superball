'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';

const NAV_ITEMS = [
  { href: '/ranked', label: 'Ranked', icon: '🏆', desc: 'Competitive MMR' },
  { href: '/inventory', label: 'Inventory', icon: '🎒', desc: 'Skins & loadout' },
  { href: '/shop', label: 'Shop', icon: '🛒', desc: 'Skins & Battle Pass' },
  { href: '/profile', label: 'Profile', icon: '👤', desc: 'Stats & history' },
  { href: '/settings', label: 'Settings', icon: '⚙️', desc: 'Audio & controls' },
] as const;

export default function MainMenuPage() {
  const { user, logout } = useAuthStore();
  const { ready } = useRequireAuth();
  const router = useRouter();

  if (!ready || !user) return null;

  return (
    <main className="arcade-bg relative flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <div className="pointer-events-none absolute top-[-10%] left-[-5%] h-[45%] w-[45%] rounded-full bg-megaball-purple/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-5%] h-[45%] w-[45%] rounded-full bg-megaball-cyan/15 blur-[120px]" />

      <header className="relative z-10 mb-8 flex w-full max-w-4xl items-center justify-between">
        <Logo size="md" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            logout();
            router.push('/login');
          }}
          className="border-red-500/30 text-red-400"
        >
          Logout
        </Button>
      </header>

      <div className="relative z-10 w-full max-w-4xl">
        <p className="text-center font-orbitron text-xs uppercase tracking-[0.35em] text-megaball-cyan text-glow-cyan">
          Main Menu
        </p>
        <p className="mt-2 text-center text-white/50">Welcome back, {user.nickname}</p>

        {/* Play Now — large CTA */}
        <button
          type="button"
          onClick={() => router.push('/game')}
          className="group relative mx-auto mt-10 flex w-full max-w-lg flex-col items-center overflow-hidden rounded-arcade-xl border-2 border-megaball-cyan bg-gradient-to-r from-megaball-purple to-megaball-cyan p-1 shadow-neon-cyan transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="flex w-full flex-col items-center rounded-[14px] bg-megaball-dark/90 px-8 py-10 transition-colors group-hover:bg-megaball-dark/70">
            <span className="text-5xl">⚡</span>
            <span className="arcade-heading mt-3 text-4xl text-white group-hover:text-megaball-cyan">
              Play Now
            </span>
            <span className="mt-2 font-orbitron text-sm uppercase tracking-widest text-megaball-cyan">
              Quick Match
            </span>
          </span>
        </button>

        {/* Nav grid */}
        <nav className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => router.push(item.href)}
              className={cn(
                'rounded-arcade-xl border border-megaball-border bg-megaball-surface/70 p-4 text-left backdrop-blur',
                'transition-all hover:-translate-y-0.5 hover:border-megaball-purple hover:shadow-neon-purple'
              )}
            >
              <span className="text-2xl">{item.icon}</span>
              <p className="arcade-heading mt-2 text-sm text-white">{item.label}</p>
              <p className="mt-1 text-xs text-white/40">{item.desc}</p>
            </button>
          ))}
        </nav>
      </div>
    </main>
  );
}
