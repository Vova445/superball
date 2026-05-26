'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io, type Socket } from 'socket.io-client';
import { PageShell } from '@/components/layout/PageShell';
import { Badge, Button, Card } from '@/components/ui';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { cn } from '@/lib/cn';
import { getRankName, rankToBadgeVariant } from '@/lib/rarity';
import { ARENAS, getArenaForCups } from '@/game/arenas';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import api from '@/lib/api';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export default function RankedPage() {
  const { ready, user } = useRequireAuth();
  const router = useRouter();
  const [searching, setSearching] = useState(false);
  const [profileMmr, setProfileMmr] = useState<number | null>(null);
  const matchmakingSocket = useRef<Socket | null>(null);
  const region = useSettingsStore((state) => state.region);

  useEffect(() => {
    if (!ready) return;

    api
      .get('/api/profile')
      .then((res) => {
        const serverMmr = res.data.mmr ?? 0;
        setProfileMmr(serverMmr);
        const currentUser = useAuthStore.getState().user;
        if (currentUser && currentUser.mmr !== serverMmr) {
          useAuthStore.setState({ user: { ...currentUser, mmr: serverMmr } });
        }
      })
      .catch(() => setProfileMmr(user?.mmr ?? 0));
  }, [ready, user?.mmr]);

  useEffect(() => {
    return () => {
      matchmakingSocket.current?.disconnect();
      matchmakingSocket.current = null;
      api.post('/api/matchmaking/leave').catch(() => undefined);
    };
  }, []);

  if (!ready || !user) return null;

  const trophies = profileMmr ?? user.mmr ?? 0;
  const rank = getRankName(trophies);
  const currentArena = getArenaForCups(trophies);
  const roadProgress = Math.min(100, (trophies / ARENAS[ARENAS.length - 1].cups) * 100);

  const findMatch = () => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    setSearching(true);
    matchmakingSocket.current?.disconnect();

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    matchmakingSocket.current = socket;

    socket.on('connect', () => {
      api.post('/api/matchmaking/join', { region }).catch(() => {
        setSearching(false);
        socket.disconnect();
      });
    });

    socket.on('match_invite', (payload: { room: string; region?: string }) => {
      setSearching(false);
      socket.disconnect();
      const inviteRegion = payload.region ?? region;
      router.push(
        `/game?arena=${encodeURIComponent(currentArena.id)}&room=${encodeURIComponent(payload.room)}&region=${encodeURIComponent(inviteRegion)}`
      );
    });

    socket.on('connect_error', () => {
      setSearching(false);
      socket.disconnect();
    });
  };

  return (
    <PageShell title="Ranked" maxWidth="4xl">
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="self-start overflow-hidden p-0">
          <div
            className="relative min-h-[220px] bg-cover bg-center"
            style={{ backgroundImage: `url("${currentArena.image}")` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-megaball-dark via-megaball-dark/45 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <Badge variant={rankToBadgeVariant(rank)}>{rank}</Badge>
              <h2 className="arcade-heading mt-3 text-2xl text-white">{currentArena.name}</h2>
              <p className="mt-1 text-sm font-semibold text-white/60">
                {'\u041f\u043e\u0442\u043e\u0447\u043d\u0430 \u0430\u0440\u0435\u043d\u0430'}
              </p>
            </div>
          </div>

          <div className="p-6 text-center">
            <p className="font-orbitron text-5xl font-black text-megaball-cyan">{trophies}</p>
            <p className="mt-1 text-sm uppercase tracking-wide text-white/50">
              {'\u041a\u0443\u0431\u043a\u0456\u0432'}
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-arcade border border-megaball-border bg-megaball-dark/50 p-3">
                <p className="font-orbitron text-xl font-bold text-megaball-cyan">12</p>
                <p className="text-xs text-white/40">Wins</p>
              </div>
              <div className="rounded-arcade border border-megaball-border bg-megaball-dark/50 p-3">
                <p className="font-orbitron text-xl font-bold text-red-400">7</p>
                <p className="text-xs text-white/40">Losses</p>
              </div>
              <div className="rounded-arcade border border-megaball-border bg-megaball-dark/50 p-3">
                <p className="font-orbitron text-xl font-bold text-megaball-purple">63%</p>
                <p className="text-xs text-white/40">Win Rate</p>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              className="mt-6"
              disabled={searching}
              onClick={findMatch}
            >
              {searching ? `Searching ${region}...` : 'Find Ranked Match'}
            </Button>
          </div>
        </Card>

        <Card className="relative overflow-hidden p-5 md:p-7">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-orbitron text-xs uppercase tracking-[0.25em] text-megaball-cyan">
                Arena Road
              </p>
              <h2 className="arcade-heading mt-2 text-2xl text-white">
                {'\u0414\u043e\u0440\u043e\u0433\u0430 \u043a\u0443\u0431\u043a\u0456\u0432'}
              </h2>
            </div>
            <div className="rounded-arcade border border-megaball-cyan/50 bg-megaball-cyan/10 px-4 py-2 text-right">
              <p className="font-orbitron text-lg font-bold text-megaball-cyan">{trophies}</p>
              <p className="text-xs uppercase text-white/45">
                {'\u0422\u0432\u043e\u0457 \u043a\u0443\u0431\u043a\u0438'}
              </p>
            </div>
          </div>

          <div className="relative space-y-5">
            <div className="absolute bottom-10 left-6 top-10 w-1 rounded-full bg-megaball-border md:left-1/2 md:-translate-x-1/2" />
            <div
              className="absolute bottom-10 left-6 w-1 rounded-full bg-gradient-to-t from-megaball-purple to-megaball-cyan md:left-1/2 md:-translate-x-1/2"
              style={{ height: `calc((100% - 5rem) * ${roadProgress / 100})` }}
            />

            {[...ARENAS].reverse().map((arena, index) => {
              const unlocked = trophies >= arena.cups;
              const isCurrent = arena.name === currentArena.name;
              const arenaCardColumn = index % 2 === 0 ? 'md:col-start-1' : 'md:col-start-3';
              const detailColumn =
                index % 2 === 0
                  ? 'md:col-start-3 md:text-left'
                  : 'md:col-start-1 md:row-start-1 md:text-right';

              return (
                <div
                  key={arena.name}
                  className="relative grid gap-4 pl-16 md:grid-cols-[1fr_72px_1fr] md:items-center md:pl-0"
                >
                  <div
                    className={cn(
                      'overflow-hidden rounded-arcade-xl border bg-megaball-dark/70 shadow-neon-card transition-all',
                      arenaCardColumn,
                      unlocked ? 'border-megaball-cyan/50' : 'border-megaball-border opacity-70',
                      isCurrent && 'shadow-neon-cyan'
                    )}
                  >
                    <div
                      className="relative h-40 bg-cover bg-center sm:h-48"
                      style={{ backgroundImage: `url("${arena.image}")` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-megaball-dark via-megaball-dark/20 to-transparent" />
                      {!unlocked && <div className="absolute inset-0 bg-megaball-dark/55 backdrop-blur-[1px]" />}
                      <div className="absolute left-4 top-4 flex gap-2">
                        <Badge variant={unlocked ? 'rare' : 'default'}>
                          {unlocked
                            ? '\u0412\u0456\u0434\u043a\u0440\u0438\u0442\u043e'
                            : '\u0417\u0430\u043a\u0440\u0438\u0442\u043e'}
                        </Badge>
                        {isCurrent && (
                          <Badge variant="mythic">
                            {'\u041f\u043e\u0442\u043e\u0447\u043d\u0430'}
                          </Badge>
                        )}
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <h3 className="arcade-heading text-xl text-white">{arena.name}</h3>
                        <p className="mt-1 text-sm text-white/55">
                          {'\u0414\u043e\u0441\u0442\u0443\u043f \u0437'} {arena.cups}{' '}
                          {'\u043a\u0443\u0431\u043a\u0456\u0432'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute left-0 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border-2 border-megaball-dark bg-megaball-surface md:relative md:left-auto md:top-auto md:col-start-2 md:row-start-1 md:h-16 md:w-16 md:translate-y-0">
                    <div
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-full border font-orbitron text-xs font-black md:h-12 md:w-12',
                        unlocked ? arena.accent : 'border-megaball-border bg-megaball-dark text-white/35'
                      )}
                    >
                      {unlocked ? arena.cups : 'LOCK'}
                    </div>
                  </div>

                  <div className={cn('hidden text-sm text-white/50 md:block', detailColumn)}>
                    <p className="font-orbitron text-base font-bold text-white">
                      {arena.cups} {'\u043a\u0443\u0431\u043a\u0456\u0432'}
                    </p>
                    <p>
                      {unlocked
                        ? '\u0410\u0440\u0435\u043d\u0430 \u0433\u043e\u0442\u043e\u0432\u0430 \u0434\u043b\u044f ranked \u043c\u0430\u0442\u0447\u0456\u0432.'
                        : `\u0429\u0435 ${arena.cups - trophies} \u043a\u0443\u0431\u043a\u0456\u0432 \u0434\u043e \u0432\u0456\u0434\u043a\u0440\u0438\u0442\u0442\u044f.`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
