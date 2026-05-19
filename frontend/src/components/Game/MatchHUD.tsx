'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

const SKILLS = ['Q', 'E', 'R', 'F'];

interface MatchHUDProps {
  homeScore?: number;
  awayScore?: number;
  initialSeconds?: number;
}

export default function MatchHUD({
  homeScore = 0,
  awayScore = 0,
  initialSeconds = 180,
}: MatchHUDProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [cooldowns, setCooldowns] = useState([0, 0, 0, 0]);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col">
      {/* Score + timer */}
      <div className="flex justify-center pt-4">
        <div className="pointer-events-auto flex items-center gap-6 rounded-arcade-xl border border-megaball-border bg-megaball-dark/85 px-8 py-3 shadow-neon-purple backdrop-blur-md">
          <span className="font-orbitron text-3xl font-black text-megaball-cyan tabular-nums">{homeScore}</span>
          <div className="text-center">
            <p className="font-orbitron text-[10px] uppercase tracking-[0.25em] text-white/40">Match</p>
            <p className="font-orbitron text-xl font-bold tabular-nums text-white">
              {mins}:{secs.toString().padStart(2, '0')}
            </p>
          </div>
          <span className="font-orbitron text-3xl font-black text-megaball-purple tabular-nums">{awayScore}</span>
        </div>
      </div>

      {/* Minimap — top right */}
      <div className="pointer-events-auto absolute right-4 top-4">
        <div className="h-28 w-36 overflow-hidden rounded-arcade border-2 border-megaball-cyan/50 bg-megaball-dark/90 shadow-neon-cyan backdrop-blur-sm">
          <div className="relative h-full w-full bg-[linear-gradient(rgba(0,245,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(0,245,255,0.08)_1px,transparent_1px)] bg-[size:12px_12px]">
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-megaball-border/80" />
            <div className="absolute left-1/4 top-1/3 h-2 w-2 rounded-full bg-megaball-cyan shadow-neon-cyan" />
            <div className="absolute right-1/4 top-1/2 h-2 w-2 rounded-full bg-megaball-purple" />
            <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60 bg-white/20" />
          </div>
          <p className="absolute bottom-1 left-0 right-0 text-center font-orbitron text-[9px] uppercase text-white/40">Arena</p>
        </div>
      </div>

      {/* Exit */}
      <Link
        href="/"
        className="pointer-events-auto absolute left-4 top-4 rounded-arcade border border-megaball-border bg-megaball-dark/80 px-3 py-1.5 font-orbitron text-xs uppercase text-white/70 backdrop-blur hover:border-red-400 hover:text-red-300"
      >
        Leave
      </Link>

      {/* Skill bar — bottom */}
      <div className="mt-auto flex justify-center pb-6">
        <div className="pointer-events-auto flex gap-3 rounded-arcade-xl border border-megaball-border bg-megaball-dark/90 p-3 shadow-neon-card backdrop-blur-md">
          {SKILLS.map((key, i) => (
            <button
              key={key}
              type="button"
              onClick={() => setCooldowns((c) => c.map((v, j) => (j === i ? 5 : v)))}
              className={cn(
                'relative flex h-14 w-14 flex-col items-center justify-center rounded-arcade border-2 font-orbitron text-lg font-bold transition-all',
                cooldowns[i] > 0
                  ? 'border-megaball-border bg-megaball-surface text-white/30'
                  : 'border-megaball-cyan/60 bg-megaball-purple/20 text-megaball-cyan hover:shadow-neon-cyan'
              )}
            >
              {key}
              {cooldowns[i] > 0 && (
                <span className="absolute inset-0 flex items-center justify-center rounded-arcade bg-black/60 text-sm">
                  {cooldowns[i]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
