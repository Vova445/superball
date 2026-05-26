'use client';

import { useMemo, useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { cn } from '@/lib/cn';

type StoreTab = 'featured' | 'packs' | 'crates' | 'currency' | 'skins' | 'accessories' | 'playerPacks' | 'bundles' | 'daily';

const tabs: { id: StoreTab; label: string; icon: string }[] = [
  { id: 'featured', label: 'Featured', icon: '*' },
  { id: 'packs', label: 'Packs', icon: 'P' },
  { id: 'crates', label: 'Crates', icon: 'C' },
  { id: 'currency', label: 'Coins & Diamonds', icon: '$' },
  { id: 'skins', label: 'Skins', icon: 'S' },
  { id: 'accessories', label: 'Accessories', icon: 'A' },
  { id: 'playerPacks', label: 'Player Packs', icon: '90' },
  { id: 'bundles', label: 'Bundles', icon: 'B' },
  { id: 'daily', label: 'Daily Offers', icon: 'D' },
];

const quickItems = [
  { title: 'Crates', subtitle: 'Elite Crate', price: '200', currency: 'diamond', visual: 'crate', tone: 'cyan' },
  { title: 'Coins', subtitle: '10,000 Coins', price: '$1.99', currency: 'cash', visual: 'coins', tone: 'gold' },
  { title: 'Diamonds', subtitle: '1,000 Diamonds', price: '$4.99', currency: 'cash', visual: 'diamonds', tone: 'cyan' },
  { title: 'Skin Shop', subtitle: 'Exclusive Player Skins', price: 'View All', currency: 'action', visual: 'skins', tone: 'purple' },
  { title: 'Accessories', subtitle: 'Goal Explosion', price: '400', currency: 'diamond', visual: 'burst', tone: 'green' },
  { title: 'Player Packs', subtitle: 'Mega Player Pack', price: '2,000', currency: 'diamond', visual: 'pack', tone: 'gold' },
];

const specialOffers = [
  { title: 'Player + Skin Bundle', subtitle: '90+ Player & Exclusive Skin', price: '2,500', tag: 'Best Value', visual: 'players', tone: 'gold' },
  { title: 'Champions Pack', subtitle: '5x 85+ Players', price: '1,000', visual: 'redPack', tone: 'red' },
  { title: 'VIP Starter Pack', subtitle: 'Exclusive Rewards', price: '$14.99', tag: 'Limited', visual: 'vip', tone: 'gold' },
  { title: 'Season Pass Bundle', subtitle: 'Season Pass + 20 Levels', price: '$19.99', visual: 'pass', tone: 'purple' },
  { title: 'Diamond Vault', subtitle: '5,000 Diamonds', price: '$19.99', tag: 'Popular', visual: 'vault', tone: 'cyan' },
  { title: 'Legend Bundle', subtitle: 'Legend Player & Skin', price: '4,000', tag: 'Limited', visual: 'legend', tone: 'gold' },
];

function StoreVisual({ type, tone = 'cyan', large = false }: { type: string; tone?: string; large?: boolean }) {
  const tones: Record<string, string> = {
    cyan: 'from-cyan-300 via-cyan-700 to-black border-cyan-300/30 shadow-[0_0_35px_rgba(0,220,255,0.22)]',
    gold: 'from-yellow-200 via-amber-600 to-black border-yellow-200/35 shadow-[0_0_35px_rgba(245,178,40,0.24)]',
    purple: 'from-fuchsia-300 via-purple-700 to-black border-fuchsia-300/30 shadow-[0_0_35px_rgba(188,70,255,0.24)]',
    green: 'from-emerald-300 via-emerald-700 to-black border-emerald-300/30 shadow-[0_0_35px_rgba(0,214,159,0.24)]',
    red: 'from-red-300 via-red-700 to-black border-red-300/30 shadow-[0_0_35px_rgba(255,70,70,0.22)]',
  };
  const label: Record<string, string> = {
    crate: 'BOX',
    coins: 'COINS',
    diamonds: 'GEMS',
    skins: 'SKIN',
    burst: 'FX',
    pack: '90+',
    players: '90',
    redPack: 'x5',
    vip: 'VIP',
    pass: 'PASS',
    vault: 'VAULT',
    legend: '92',
  };

  return (
    <div className={cn('mx-auto flex items-center justify-center rounded-xl border bg-gradient-to-br font-black text-white', tones[tone], large ? 'h-40 w-52 text-4xl' : 'h-28 w-36 text-2xl')}>
      <span className="drop-shadow-[0_3px_8px_rgba(0,0,0,0.65)]">{label[type] ?? type}</span>
    </div>
  );
}

function PriceButton({ price, currency }: { price: string; currency?: string }) {
  return (
    <button className="mt-auto h-10 w-full rounded-md bg-[#06c994] text-[15px] font-black text-white shadow-[0_0_22px_rgba(6,201,148,0.28)]">
      {price} {currency === 'diamond' ? 'D' : ''}
    </button>
  );
}

export default function ShopPage() {
  const { ready } = useRequireAuth();
  const [activeTab, setActiveTab] = useState<StoreTab>('featured');

  const visibleQuickItems = useMemo(() => {
    if (activeTab === 'featured') return quickItems;
    if (activeTab === 'crates') return quickItems.filter((item) => item.visual === 'crate');
    if (activeTab === 'currency') return quickItems.filter((item) => item.visual === 'coins' || item.visual === 'diamonds');
    if (activeTab === 'skins') return quickItems.filter((item) => item.visual === 'skins');
    if (activeTab === 'accessories') return quickItems.filter((item) => item.visual === 'burst');
    if (activeTab === 'playerPacks') return quickItems.filter((item) => item.visual === 'pack');
    return quickItems.slice(0, 3);
  }, [activeTab]);

  if (!ready) return null;

  return (
    <main className="lobby-bg relative min-h-screen overflow-hidden font-sans">
      <AppHeader active="shop" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 pb-7 pt-[78px]">
        <div className="grid h-[min(82vh,850px)] w-full max-w-[1720px] grid-cols-[285px_1fr] overflow-hidden rounded-lg border border-[#2b4250] bg-[#020b0f]/88 shadow-[0_24px_90px_rgba(0,0,0,0.58)] backdrop-blur-md">
          <aside className="hidden border-r border-white/10 bg-[#02090d]/54 px-6 py-7 md:flex md:flex-col">
            <h1 className="mb-6 text-[29px] font-extrabold uppercase tracking-[0.08em] text-white drop-shadow-[0_0_12px_rgba(210,255,244,0.72)]">
              Store
            </h1>

            <nav className="space-y-1.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'relative flex h-[50px] w-full items-center gap-4 rounded-md px-4 text-left text-[15px] font-bold uppercase text-white/68 transition hover:text-white',
                    activeTab === tab.id && 'bg-[#063829] text-[#00d69f]'
                  )}
                >
                  {activeTab === tab.id && <span className="absolute right-0 top-0 h-full w-1 bg-[#00d69f]" />}
                  <span className="flex h-7 w-7 items-center justify-center rounded border border-white/12 text-[12px] font-black">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>

            <div className="mt-auto rounded-lg border border-white/10 bg-[#063829]/35 p-5">
              <p className="text-[18px] font-extrabold uppercase text-[#00d69f]">VIP Club</p>
              <p className="mt-3 text-[13px] leading-5 text-white/58">Join VIP Club to unlock exclusive rewards and discounts!</p>
              <div className="my-5">
                <StoreVisual type="vip" tone="green" />
              </div>
              <Button className="h-10 w-full rounded-md bg-[#06c994] font-sans text-[13px] font-black uppercase text-white">View VIP Benefits</Button>
            </div>
          </aside>

          <section className="shop-scroll min-w-0 overflow-y-auto px-5 py-5">
            <div className="grid gap-4 xl:grid-cols-[1fr_450px]">
              <section className="relative min-h-[260px] overflow-hidden rounded-lg border border-white/10 bg-[#071418]/72 p-9">
                <div className="relative z-10 max-w-[470px]">
                  <p className="text-[20px] font-extrabold uppercase text-[#00d69f]">Featured Offer</p>
                  <h2 className="mt-4 text-[31px] font-extrabold uppercase text-white">Ultimate Starter Pack</h2>
                  <p className="mt-4 text-[17px] leading-7 text-white/70">Kickstart your journey with elite players, coins, diamonds and exclusive skins!</p>
                  <button className="mt-8 h-11 w-44 rounded-md bg-[#06c994] text-[20px] font-black text-white shadow-[0_0_28px_rgba(6,201,148,0.35)]">$9.99</button>
                </div>
                <div className="absolute bottom-5 right-8 flex items-end gap-4">
                  <StoreVisual type="coins" tone="gold" />
                  <StoreVisual type="diamonds" tone="cyan" />
                  <StoreVisual type="skins" tone="purple" large />
                </div>
                <div className="absolute right-[37%] top-7 rounded-full border-2 border-fuchsia-400 bg-fuchsia-700/40 px-4 py-3 text-center text-[14px] font-black uppercase text-white">
                  50%<br />Value
                </div>
              </section>

              <section className="rounded-lg border border-white/10 bg-[#071418]/72 p-7">
                <p className="text-[20px] font-extrabold uppercase text-[#00d69f]">Daily Deal</p>
                <div className="mt-3 grid grid-cols-[1fr_180px] gap-4">
                  <div>
                    <h3 className="text-[20px] font-bold text-white">Random Skin Box</h3>
                    <p className="mt-3 text-[14px] leading-5 text-white/56">Includes 1 random skin Rare or higher!</p>
                    <button className="mt-9 h-10 w-40 rounded-md bg-[#06c994]/70 text-[15px] font-black text-white">
                      <span className="mr-3 text-white/38 line-through">150</span> D 99
                    </button>
                  </div>
                  <StoreVisual type="crate" tone="purple" large />
                </div>
                <p className="mt-3 text-right text-[13px] font-semibold text-white/48">New deal in: 08:45:12</p>
              </section>
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-6 lg:grid-cols-3 md:grid-cols-2">
              {visibleQuickItems.map((item) => (
                <article key={item.title} className="flex min-h-[275px] flex-col rounded-lg border border-white/10 bg-[#071418]/72 p-5">
                  <p className={cn('text-[18px] font-extrabold uppercase', item.tone === 'gold' ? 'text-yellow-300' : item.tone === 'purple' ? 'text-fuchsia-300' : 'text-[#00d69f]')}>{item.title}</p>
                  <p className="mt-2 text-center text-[15px] font-semibold text-white/64">{item.subtitle}</p>
                  <div className="my-5">
                    <StoreVisual type={item.visual} tone={item.tone} />
                  </div>
                  <PriceButton price={item.price} currency={item.currency} />
                </article>
              ))}
            </div>

            <h2 className="mt-4 text-[18px] font-extrabold uppercase text-white/72">Special Offers</h2>
            <div className="mt-2 grid gap-3 xl:grid-cols-6 lg:grid-cols-3 md:grid-cols-2">
              {specialOffers.map((offer) => (
                <article key={offer.title} className="flex min-h-[255px] flex-col rounded-lg border border-white/10 bg-[#071418]/72 p-5">
                  <p className="text-[17px] font-extrabold uppercase text-yellow-300">{offer.title}</p>
                  <p className="mt-2 text-[14px] font-semibold text-white/58">{offer.subtitle}</p>
                  <div className="my-4">
                    <StoreVisual type={offer.visual} tone={offer.tone} />
                  </div>
                  <div className="mt-auto flex items-center gap-2">
                    <button className="h-10 flex-1 rounded-md bg-[#06c994] text-[15px] font-black text-white">
                      {offer.price} {offer.price.startsWith('$') ? '' : 'D'}
                    </button>
                    {offer.tag && <span className="rounded-md bg-purple-600 px-2 py-1 text-[10px] font-black uppercase text-white">{offer.tag}</span>}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="absolute bottom-3 left-4 z-20 text-[13px] text-white/38">All purchases are final. By purchasing, you agree to our Terms of Service.</div>
      <div className="absolute bottom-3 right-8 z-20 text-[13px] font-bold uppercase text-white/42">Secure Payment</div>
    </main>
  );
}
