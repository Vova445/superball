export type ItemRarity = 'bronze' | 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type ItemType = 'skin' | 'emote' | 'trail' | 'ball' | 'badge';
export type EquipSlot = 'skin' | 'emote' | 'trail' | 'ball';
export type ShopTab = 'skins' | 'emotes' | 'battlepass';

export interface InventoryItem {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  icon: string;
  imageUrl?: string;
  equipped?: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  icon: string;
  price: number;
  currency: 'coins' | 'gems';
  tab: ShopTab;
  featured?: boolean;
}

export interface MatchRecord {
  id: string;
  mode: 'Quick' | 'Ranked';
  result: 'win' | 'loss' | 'draw';
  score: string;
  mmrDelta: number;
  playedAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  max?: number;
}
