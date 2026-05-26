'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { AppHeader } from '@/components/layout/AppHeader';
import { getClientLocale, lobbyLabels, type Locale } from '@/lib/i18n';

export default function MainMenuPage() {
  const { user } = useAuthStore();
  const { ready } = useRequireAuth();
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>('uk');

  useEffect(() => {
    setLocale(getClientLocale());
  }, []);

  if (!ready || !user) return null;

  const labels = lobbyLabels[locale];

  return (
    <main className="lobby-bg relative flex min-h-screen flex-col">
      <button
        type="button"
        aria-label="Open clubs"
        className="lobby-menu-hotspot lobby-menu-hotspot-club"
        onClick={() => router.push('/clubs')}
      >
        <span className="lobby-menu-hit" aria-hidden="true" />
        <span className="lobby-menu-label">{labels.clubs}</span>
      </button>
      <button
        type="button"
        aria-label="Open ranked"
        className="lobby-menu-hotspot lobby-menu-hotspot-ranked"
        onClick={() => router.push('/ranked')}
      >
        <span className="lobby-menu-hit" aria-hidden="true" />
        <span className="lobby-menu-label">{labels.ranked}</span>
      </button>
      <button
        type="button"
        aria-label="Play"
        className="lobby-menu-hotspot lobby-menu-hotspot-play"
        onClick={() => router.push('/game')}
      >
        <span className="lobby-menu-hit" aria-hidden="true" />
        <span className="lobby-menu-label">{labels.play}</span>
      </button>
      <button
        type="button"
        aria-label="Open profile"
        className="lobby-menu-hotspot lobby-menu-hotspot-home"
        onClick={() => router.push('/profile')}
      >
        <span className="lobby-menu-hit" aria-hidden="true" />
        <span className="lobby-menu-label">{labels.profile}</span>
      </button>
      <button
        type="button"
        aria-label="Open inventory"
        className="lobby-menu-hotspot lobby-menu-hotspot-locker"
        onClick={() => router.push('/inventory')}
      >
        <span className="lobby-menu-hit" aria-hidden="true" />
        <span className="lobby-menu-label">{labels.inventory}</span>
      </button>
      <button
        type="button"
        aria-label="Open shop"
        className="lobby-menu-hotspot lobby-menu-hotspot-shop"
        onClick={() => router.push('/shop')}
      >
        <span className="lobby-menu-hit" aria-hidden="true" />
        <span className="lobby-menu-label">{labels.shop}</span>
      </button>

      <AppHeader />
    </main>
  );
}
