'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { Badge, Button, Card } from '@/components/ui';
import { Tabs } from '@/components/ui/Tabs';
import { MOCK_SHOP } from '@/lib/mock/gameData';
import { rarityGlowClass, rarityToBadge } from '@/lib/rarityStyles';
import type { ShopTab } from '@/types/game';

const SHOP_TABS = [
  { id: 'skins' as ShopTab, label: 'Skins' },
  { id: 'emotes' as ShopTab, label: 'Emotes' },
  { id: 'battlepass' as ShopTab, label: 'Battle Pass' },
];

export function ShopScreen() {
  const [tab, setTab] = useState<ShopTab>('skins');
  const featured = MOCK_SHOP.filter((i) => i.featured);
  const items = MOCK_SHOP.filter((i) => i.tab === tab);

  return (
    <div className="space-y-6">
      {featured.length > 0 && (
        <div className="relative overflow-hidden rounded-arcade-xl border-2 border-megaball-purple bg-gradient-to-r from-megaball-purple/30 via-megaball-dark to-megaball-cyan/20 p-6 shadow-neon-purple animate-glow md:p-8">
          <p className="font-orbitron text-xs uppercase tracking-[0.3em] text-megaball-cyan">Featured</p>
          <div className="mt-4 flex flex-wrap items-center gap-6">
            {featured.slice(0, 2).map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <span className="text-5xl">{item.icon}</span>
                <div>
                  <h3 className="arcade-heading text-xl">{item.name}</h3>
                  <Badge variant={rarityToBadge(item.rarity)} className="mt-1">
                    {item.rarity}
                  </Badge>
                  <p className="mt-2 font-orbitron text-sm text-rarity-legendary">
                    {item.price} {item.currency === 'gems' ? '💎' : '🪙'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Tabs tabs={SHOP_TABS} active={tab} onChange={(id) => setTab(id)} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <Card
            key={item.id}
            className={cn('flex flex-col items-center p-4 text-center', rarityGlowClass(item.rarity))}
          >
            <span className="text-4xl">{item.icon}</span>
            <p className="mt-2 text-sm font-semibold">{item.name}</p>
            <Badge variant={rarityToBadge(item.rarity)} className="mt-2">
              {item.rarity}
            </Badge>
            <p className="mt-3 font-orbitron text-sm font-bold text-megaball-cyan">
              {item.price} {item.currency === 'gems' ? '💎' : '🪙'}
            </p>
            <Button variant="secondary" size="sm" className="mt-3 w-full">
              Buy
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
