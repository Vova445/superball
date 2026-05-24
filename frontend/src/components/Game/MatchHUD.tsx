'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface MatchHUDProps {
  homeScore?: number;
  awayScore?: number;
  initialSeconds?: number;
}

interface RewardItem {
  id: string;
  title: string;
  coins?: number;
  xp?: number;
  mmrDelta?: number;
  rank?: string;
  level?: number;
  levelUp?: boolean;
  bonuses?: string[];
}

interface MatchUiEvent {
  homeScore: number;
  awayScore: number;
  timer: number;
  matchState: string;
  playerCount?: number;
  rewards?: RewardItem[];
}

export default function MatchHUD({
  homeScore = 0,
  awayScore = 0,
  initialSeconds = 180,
}: MatchHUDProps) {
  const router = useRouter();
  const [seconds, setSeconds] = useState(initialSeconds);
  const [score, setScore] = useState({ home: homeScore, away: awayScore });
  const [matchState, setMatchState] = useState('LOBBY');
  const [playerCount, setPlayerCount] = useState(1);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [returnSeconds, setReturnSeconds] = useState(6);

  useEffect(() => {
    const onMatchUi = (event: Event) => {
      const detail = (event as CustomEvent<MatchUiEvent>).detail;

      setScore({ home: detail.homeScore, away: detail.awayScore });
      setSeconds(Math.max(0, detail.timer));
      setMatchState(detail.matchState);
      setPlayerCount(detail.playerCount ?? 1);
      setRewards(detail.rewards ?? []);
    };

    window.addEventListener('megaball:match-ui', onMatchUi);
    return () => window.removeEventListener('megaball:match-ui', onMatchUi);
  }, []);

  useEffect(() => {
    if (matchState !== 'FINISHED') {
      setReturnSeconds(6);
      return;
    }

    const tick = setInterval(() => setReturnSeconds((s) => Math.max(0, s - 1)), 1000);
    const leave = setTimeout(() => router.push('/'), 6000);

    return () => {
      clearInterval(tick);
      clearTimeout(leave);
    };
  }, [matchState, router]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeWarning = seconds <= 30 && (matchState === 'PLAYING' || matchState === 'OVERTIME');
  const statusLabel =
    matchState === 'OVERTIME'
      ? 'Golden goal'
      : matchState === 'FINISHED'
        ? 'Full time'
        : matchState === 'COUNTDOWN'
          ? 'Kickoff'
          : matchState === 'LOBBY'
            ? 'Waiting'
            : 'Live';

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col">
      <div className="flex justify-center pt-4">
        <div className="pointer-events-auto relative overflow-hidden rounded-arcade-xl border border-white/15 bg-[#070915]/88 px-5 py-3 shadow-[0_0_32px_rgba(0,245,255,0.24),0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-megaball-cyan to-transparent" />
          <div className="flex min-w-[320px] items-center justify-between gap-5 sm:min-w-[430px]">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-megaball-cyan shadow-neon-cyan" />
              <div className="min-w-0">
                <p className="font-orbitron text-[10px] font-bold uppercase text-white/45">Blue</p>
                <p className="font-orbitron text-4xl font-black leading-none text-megaball-cyan tabular-nums">{score.home}</p>
              </div>
            </div>

            <div className="grid min-w-[118px] place-items-center rounded-arcade border border-white/10 bg-white/[0.06] px-4 py-2">
              <p className="font-orbitron text-[10px] font-bold uppercase text-white/45">{statusLabel}</p>
              <p className={`font-orbitron text-2xl font-black leading-tight tabular-nums ${timeWarning ? 'text-[#ffcf4a]' : 'text-white'}`}>
                {mins}:{secs.toString().padStart(2, '0')}
              </p>
              {matchState === 'LOBBY' && (
                <p className="font-orbitron text-[9px] font-bold uppercase text-white/45">{playerCount}/2 players</p>
              )}
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-end gap-3 text-right">
              <div className="min-w-0">
                <p className="font-orbitron text-[10px] font-bold uppercase text-white/45">Violet</p>
                <p className="font-orbitron text-4xl font-black leading-none text-megaball-purple tabular-nums">{score.away}</p>
              </div>
              <span className="h-3 w-3 rounded-full bg-megaball-purple shadow-neon-purple" />
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-auto absolute right-4 top-4 hidden sm:block">
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

      <Link
        href="/"
        className="pointer-events-auto absolute left-4 top-4 rounded-arcade border border-megaball-border bg-megaball-dark/80 px-3 py-1.5 font-orbitron text-xs uppercase text-white/70 backdrop-blur hover:border-red-400 hover:text-red-300"
      >
        Leave
      </Link>

      {matchState === 'FINISHED' && (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-arcade-xl border border-[#ffcf4a]/60 bg-[#080912]/95 shadow-[0_0_42px_rgba(255,207,74,0.24),0_0_80px_rgba(123,47,255,0.22)]">
            <div className="bg-gradient-to-r from-[#ffcf4a] via-white to-megaball-cyan px-6 py-4 text-center text-megaball-dark">
              <p className="font-orbitron text-sm font-black uppercase">Match rewards</p>
              <p className="font-orbitron text-4xl font-black leading-none">Trophy unlocked</p>
            </div>
            <div className="space-y-3 p-5">
              {(rewards.length ? rewards : [{ id: 'fallback', title: 'Reward', coins: 0, xp: 0 }]).map((reward) => (
                <div key={reward.id} className="rounded-arcade border border-white/10 bg-white/[0.06] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-orbitron text-lg font-black uppercase text-white">{reward.title}</p>
                    {reward.levelUp && <span className="rounded-full bg-[#ffcf4a] px-3 py-1 font-orbitron text-xs font-black uppercase text-megaball-dark">Level up</span>}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 font-orbitron text-sm text-white/75 sm:grid-cols-4">
                    <span className="rounded-md bg-black/25 px-3 py-2">Coins +{reward.coins ?? 0}</span>
                    <span className="rounded-md bg-black/25 px-3 py-2">XP +{reward.xp ?? 0}</span>
                    {reward.mmrDelta !== undefined && <span className="rounded-md bg-black/25 px-3 py-2">MMR {reward.mmrDelta >= 0 ? '+' : ''}{reward.mmrDelta}</span>}
                    {reward.level !== undefined && <span className="rounded-md bg-black/25 px-3 py-2">Lvl {reward.level}</span>}
                  </div>
                  {!!reward.bonuses?.length && <p className="mt-3 font-body text-sm text-megaball-cyan">{reward.bonuses.join(' | ')}</p>}
                </div>
              ))}
              <div className="flex items-center justify-between gap-4 pt-1">
                <p className="font-orbitron text-xs font-bold uppercase text-white/50">Menu in {returnSeconds}s</p>
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="rounded-arcade bg-megaball-cyan px-4 py-2 font-orbitron text-xs font-black uppercase text-megaball-dark transition hover:bg-white"
                >
                  Menu now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
