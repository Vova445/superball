'use client';

import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/ui';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { cn } from '@/lib/cn';

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between rounded-arcade border border-megaball-border bg-megaball-dark/50 px-4 py-3"
    >
      <span className="text-sm">{label}</span>
      <span
        className={cn(
          'h-6 w-11 rounded-full transition-colors',
          on ? 'bg-megaball-cyan' : 'bg-megaball-border'
        )}
      >
        <span
          className={cn(
            'mt-0.5 block h-5 w-5 rounded-full bg-white transition-transform',
            on ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </span>
    </button>
  );
}

export default function SettingsPage() {
  const { ready } = useRequireAuth();
  const [music, setMusic] = useState(true);
  const [sfx, setSfx] = useState(true);
  const [particles, setParticles] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  if (!ready) return null;

  return (
    <PageShell title="Settings" maxWidth="lg">
      <Card className="space-y-3 p-4">
        <h2 className="arcade-heading mb-2 text-sm text-megaball-cyan">Audio</h2>
        <Toggle label="Music" on={music} onChange={setMusic} />
        <Toggle label="Sound Effects" on={sfx} onChange={setSfx} />
      </Card>
      <Card className="mt-4 space-y-3 p-4">
        <h2 className="arcade-heading mb-2 text-sm text-megaball-purple">Graphics</h2>
        <Toggle label="Particle Effects" on={particles} onChange={setParticles} />
        <Toggle label="Reduce Motion" on={reduceMotion} onChange={setReduceMotion} />
      </Card>
    </PageShell>
  );
}
