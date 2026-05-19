'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/layout/PageShell';
import { Badge, Button, Card } from '@/components/ui';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { getRankName, rankToBadgeVariant } from '@/lib/rarity';

export default function RankedPage() {
  const { ready, user } = useRequireAuth();
  const router = useRouter();
  const [searching, setSearching] = useState(false);

  if (!ready || !user) return null;

  const mmr = 1240;
  const rank = getRankName(mmr);

  const findMatch = () => {
    setSearching(true);
    setTimeout(() => {
      setSearching(false);
      router.push('/game');
    }, 2000);
  };

  return (
    <PageShell title="Ranked" maxWidth="lg">
      <Card className="p-8 text-center">
        <Badge variant={rankToBadgeVariant(rank)} className="mb-4">
          {rank}
        </Badge>
        <p className="font-orbitron text-5xl font-black text-megaball-cyan">{mmr}</p>
        <p className="mt-1 text-sm text-white/50">Current MMR</p>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="font-orbitron text-2xl font-bold text-megaball-cyan">12</p>
            <p className="text-xs text-white/40">Wins</p>
          </div>
          <div>
            <p className="font-orbitron text-2xl font-bold text-red-400">7</p>
            <p className="text-xs text-white/40">Losses</p>
          </div>
          <div>
            <p className="font-orbitron text-2xl font-bold text-megaball-purple">63%</p>
            <p className="text-xs text-white/40">Win Rate</p>
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          className="mt-8"
          disabled={searching}
          onClick={findMatch}
        >
          {searching ? 'Searching...' : 'Find Ranked Match'}
        </Button>
      </Card>
    </PageShell>
  );
}
