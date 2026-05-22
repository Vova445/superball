'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/cn';
import { Badge, Card } from '@/components/ui';
import { MOCK_INVENTORY, EQUIP_SLOTS } from '@/lib/mock/gameData';
import { rarityGlowClass, rarityToBadge } from '@/lib/rarityStyles';
import type { EquipSlot, InventoryItem, ItemRarity, ItemType } from '@/types/game';

const TYPES: Array<ItemType | 'all'> = ['all', 'skin', 'ball', 'trail', 'emote', 'badge'];
const RARITIES: Array<ItemRarity | 'all'> = ['all', 'bronze', 'common', 'rare', 'epic', 'legendary', 'mythic'];

export function InventoryScreen() {
  const [items, setItems] = useState(MOCK_INVENTORY);
  const [typeFilter, setTypeFilter] = useState<ItemType | 'all'>('all');
  const [rarityFilter, setRarityFilter] = useState<ItemRarity | 'all'>('all');
  const [dragId, setDragId] = useState<string | null>(null);

  const equipped = Object.fromEntries(
    EQUIP_SLOTS.map((slot) => [
      slot,
      items.find((i) => i.type === slot && i.equipped) ?? null,
    ])
  ) as Record<EquipSlot, InventoryItem | null>;

  const filtered = items.filter((item) => {
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    if (rarityFilter !== 'all' && item.rarity !== rarityFilter) return false;
    return true;
  });

  const equipItem = useCallback((itemId: string, slot: EquipSlot) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.type !== slot) return item;
        if (item.id === itemId) return { ...item, equipped: true };
        return { ...item, equipped: false };
      })
    );
  }, []);

  const handleDropOnSlot = (slot: EquipSlot) => {
    if (!dragId) return;
    const item = items.find((i) => i.id === dragId);
    if (!item || item.type !== slot) return;
    equipItem(dragId, slot);
    setDragId(null);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      {/* Equip slots */}
      <Card className="p-4">
        <h2 className="arcade-heading mb-4 text-sm text-megaball-cyan">Loadout</h2>
        <div className="space-y-3">
          {EQUIP_SLOTS.map((slot) => {
            const item = equipped[slot];
            return (
              <div
                key={slot}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropOnSlot(slot)}
                className={cn(
                  'flex min-h-[72px] items-center gap-3 rounded-arcade border-2 border-dashed p-3 transition-all',
                  dragId ? 'border-megaball-cyan bg-megaball-cyan/5' : 'border-megaball-border bg-megaball-dark/50',
                  item && rarityGlowClass(item.rarity)
                )}
              >
                <span className="font-orbitron text-[10px] uppercase text-white/40 w-12">{slot}</span>
                {item ? (
                  <>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="h-14 w-10 rounded-md object-cover shadow-neon-purple"
                      />
                    ) : (
                      <span className="text-2xl">{item.icon}</span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                      <Badge variant={rarityToBadge(item.rarity)} className="mt-1">
                        {item.rarity}
                      </Badge>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-white/30">Drop {slot} here</p>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div>
        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-2">
          <FilterGroup label="Type" options={TYPES} value={typeFilter} onChange={setTypeFilter} />
          <FilterGroup label="Rarity" options={RARITIES} value={rarityFilter} onChange={setRarityFilter} />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => setDragId(item.id)}
              onDragEnd={() => setDragId(null)}
              className={cn(
                'cursor-grab rounded-arcade-xl border-2 bg-megaball-surface/80 p-4 transition-all active:cursor-grabbing',
                rarityGlowClass(item.rarity),
                item.equipped && 'ring-2 ring-megaball-cyan',
                dragId === item.id && 'opacity-50'
              )}
            >
              {item.imageUrl ? (
                <div className="mx-auto flex aspect-[3/4] max-h-40 items-center justify-center overflow-hidden rounded-arcade border border-megaball-purple/40 bg-megaball-dark/70">
                  <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="text-center text-3xl">{item.icon}</div>
              )}
              <p className="mt-2 truncate text-center text-sm font-semibold">{item.name}</p>
              <div className="mt-2 flex justify-center">
                <Badge variant={rarityToBadge(item.rarity)}>{item.rarity}</Badge>
              </div>
              {item.equipped && (
                <p className="mt-2 text-center font-orbitron text-[10px] uppercase text-megaball-cyan">
                  Equipped
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: React.Dispatch<React.SetStateAction<T>>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="mr-1 font-orbitron text-[10px] uppercase text-white/40">{label}:</span>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            'rounded-arcade px-2 py-1 font-orbitron text-[10px] uppercase transition-all',
            value === opt ? 'bg-megaball-purple/40 text-megaball-cyan' : 'text-white/50 hover:text-white'
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
