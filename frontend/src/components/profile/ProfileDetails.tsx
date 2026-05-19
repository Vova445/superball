'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Badge, Card } from '@/components/ui';
import { MOCK_ACHIEVEMENTS, MOCK_MATCHES } from '@/lib/mock/gameData';
import { getRankName, rankToBadgeVariant } from '@/lib/rarity';

interface UserProfile {
  id: number;
  username: string;
  nickname: string;
  email: string;
  mmr: number;
  level: number;
  xp: number;
  total_xp: number;
  xp_needed: number;
  coins: number;
  gems: number;
}

export function ProfileDetails() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/api/profile')
      .then((res) => setProfile(res.data))
      .catch((err: { response?: { data?: { detail?: string } } }) =>
        setError(err.response?.data?.detail || 'Failed to load profile')
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-megaball-cyan border-t-transparent" />
      </div>
    );
  }

  if (error || !profile) {
    return <p className="text-center text-red-400">{error || 'No profile data'}</p>;
  }

  const rank = getRankName(profile.mmr);
  const xpPct = Math.min(100, (profile.xp / profile.xp_needed) * 100);
  const wins = MOCK_MATCHES.filter((m) => m.result === 'win').length;
  const losses = MOCK_MATCHES.filter((m) => m.result === 'loss').length;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col items-center gap-4 md:flex-row">
          <div className="flex h-20 w-20 animate-glow items-center justify-center rounded-arcade-xl bg-gradient-to-tr from-megaball-purple to-megaball-cyan font-orbitron text-3xl font-bold">
            {profile.nickname.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="arcade-heading text-2xl gradient-text-arcade">{profile.nickname}</h2>
            <Badge variant={rankToBadgeVariant(rank)} className="mt-2">
              {rank} · MMR {profile.mmr}
            </Badge>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Wins" value={wins} accent="text-megaball-cyan" />
        <StatCard label="Losses" value={losses} accent="text-red-400" />
        <StatCard label="Level" value={profile.level} accent="text-megaball-purple" />
        <StatCard label="Total XP" value={profile.total_xp} accent="text-rarity-legendary" />
      </div>

      <Card className="p-4">
        <div className="mb-2 flex justify-between text-sm">
          <span className="arcade-heading text-white/80">Level Progress</span>
          <span className="text-megaball-cyan">
            {profile.xp}/{profile.xp_needed} XP
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full border border-megaball-border bg-megaball-dark">
          <div
            className="h-full bg-gradient-to-r from-megaball-purple to-megaball-cyan transition-all"
            style={{ width: `${xpPct}%` }}
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-arcade bg-megaball-dark/60 p-3 text-center">
            <p className="text-xs text-white/40">Coins</p>
            <p className="font-orbitron text-xl font-bold text-rarity-legendary">{profile.coins}</p>
          </div>
          <div className="rounded-arcade bg-megaball-dark/60 p-3 text-center">
            <p className="text-xs text-white/40">Gems</p>
            <p className="font-orbitron text-xl font-bold text-megaball-cyan">{profile.gems}</p>
          </div>
        </div>
      </Card>

      <section>
        <h3 className="arcade-heading mb-3 text-sm text-megaball-cyan">Match History</h3>
        <div className="space-y-2">
          {MOCK_MATCHES.map((m) => (
            <Card key={m.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold">{m.mode}</p>
                <p className="text-xs text-white/40">{m.playedAt}</p>
              </div>
              <div className="text-right">
                <p className="font-orbitron text-lg font-bold">{m.score}</p>
                <p
                  className={
                    m.result === 'win'
                      ? 'text-megaball-cyan'
                      : m.result === 'loss'
                        ? 'text-red-400'
                        : 'text-white/50'
                  }
                >
                  {m.result.toUpperCase()}{' '}
                  {m.mmrDelta > 0 ? `+${m.mmrDelta}` : m.mmrDelta} MMR
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h3 className="arcade-heading mb-3 text-sm text-megaball-purple">Achievements</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {MOCK_ACHIEVEMENTS.map((a) => (
            <Card key={a.id} className={a.unlocked ? 'border-megaball-cyan/40' : 'opacity-60'}>
              <div className="flex gap-3 p-4">
                <span className="text-2xl">{a.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold">{a.title}</p>
                  <p className="text-xs text-white/50">{a.description}</p>
                  {a.max != null && (
                    <div className="mt-2">
                      <div className="h-1.5 overflow-hidden rounded-full bg-megaball-dark">
                        <div
                          className="h-full bg-megaball-cyan"
                          style={{ width: `${((a.progress ?? 0) / a.max) * 100}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[10px] text-white/40">
                        {a.progress}/{a.max}
                      </p>
                    </div>
                  )}
                </div>
                {a.unlocked && <span className="text-megaball-cyan">✓</span>}
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <Card className="p-4 text-center">
      <p className="font-orbitron text-[10px] uppercase text-white/40">{label}</p>
      <p className={`font-orbitron text-2xl font-bold ${accent}`}>{value}</p>
    </Card>
  );
}
