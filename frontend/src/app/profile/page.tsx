'use client';

import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { type LucideIcon, BarChart3, ChevronDown, Clock3, Flame, Goal, LineChart, Pencil, Shirt, Trophy, UserRound, X } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import api from '@/lib/api';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/store/useAuthStore';

type ProfileTab = 'overview' | 'history' | 'progress' | 'achievements' | 'stats' | 'customization';

type ProfileData = {
  id: number;
  level: number;
  xp: number;
  total_xp: number;
  xp_needed: number;
  avatar_url: string | null;
  wins: number;
  losses: number;
  draws: number;
  matches_played: number;
  goals_scored: number;
  goals_conceded: number;
  best_win_streak: number;
  recent_matches: RecentMatch[];
};

type RecentMatch = {
  id: number;
  score: string;
  result: 'WIN' | 'DRAW' | 'LOSS';
  duration: number;
  played_at: string | null;
};

type StatsRow = {
  label: string;
  value: string;
  icon: typeof Trophy;
};

const navItems: { id: ProfileTab; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', icon: UserRound },
  { id: 'history', label: 'Match History', icon: Clock3 },
  { id: 'progress', label: 'Progress', icon: LineChart },
  { id: 'achievements', label: 'Achievements', icon: Trophy },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
  { id: 'customization', label: 'Customization', icon: Shirt },
];

const achievements = [
  { title: 'First Win', desc: 'Win your first match', icon: 'cup', unlocked: true },
  { title: 'Play 10 Matches', desc: 'Play 10 matches', icon: '10', unlocked: true },
  { title: 'Score 5 Goals', desc: 'Score 5 goals', icon: 'goal', unlocked: true },
  { title: 'Win Streak', desc: 'Win 5 matches in a row', icon: 'lock', unlocked: false },
];

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-lg border border-white/10 bg-[#071418]/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]', className)}>
      {children}
    </section>
  );
}

function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-[15px] font-extrabold uppercase tracking-[0.02em] text-[#00d69f]">{title}</h2>
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="rounded-md bg-white/[0.055] px-4 py-2 text-[12px] font-bold uppercase text-white/68 transition hover:bg-white/[0.09] hover:text-white"
        >
          {action}
        </button>
      )}
    </div>
  );
}

function MockBadge({
  tone = 'gold',
  label,
  size = 'md',
}: {
  tone?: 'gold' | 'silver' | 'bronze' | 'dark' | 'cyan' | 'red' | 'rose';
  label: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const colors = {
    gold: 'from-yellow-200 via-yellow-500 to-amber-900 border-yellow-300/45 shadow-[0_0_24px_rgba(245,178,40,0.38)]',
    silver: 'from-slate-100 via-slate-400 to-slate-800 border-slate-200/35 shadow-[0_0_20px_rgba(185,220,230,0.25)]',
    bronze: 'from-orange-200 via-orange-600 to-stone-900 border-orange-300/35 shadow-[0_0_20px_rgba(210,105,35,0.3)]',
    dark: 'from-slate-700 via-slate-800 to-black border-white/10 opacity-55',
    cyan: 'from-cyan-200 via-cyan-600 to-slate-900 border-cyan-200/35 shadow-[0_0_20px_rgba(0,214,255,0.28)]',
    red: 'from-red-200 via-red-700 to-stone-950 border-red-300/35 shadow-[0_0_20px_rgba(255,60,60,0.24)]',
    rose: 'from-rose-200 via-rose-700 to-stone-950 border-rose-300/35 shadow-[0_0_20px_rgba(255,90,120,0.22)]',
  };
  const sizes = {
    sm: 'h-9 w-9 text-[12px]',
    md: 'h-12 w-12 text-[14px]',
    lg: 'h-16 w-16 text-[18px]',
  };

  return (
    <div className={cn('relative flex shrink-0 rotate-45 items-center justify-center border bg-gradient-to-br', colors[tone], sizes[size])}>
      <span className="-rotate-45 font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.55)]">{label}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { ready } = useRequireAuth();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [editing, setEditing] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setEditNickname(user.nickname ?? '');
    setEditEmail(user.email ?? '');
    setAvatarUrl(window.localStorage.getItem(`profile-avatar:${user.id}`) ?? '');
  }, [user]);

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;

    const loadProfile = async () => {
      try {
        const response = await api.get<ProfileData>('/api/profile');
        if (cancelled) return;
        setProfileData(response.data);

        const currentUser = useAuthStore.getState().user;
        const localAvatar = window.localStorage.getItem(`profile-avatar:${response.data.id}`);
        if (response.data.avatar_url) {
          setAvatarUrl(response.data.avatar_url);
        } else if (localAvatar) {
          setAvatarUrl(localAvatar);
          api.put('/api/profile', { avatar_url: localAvatar }).catch(() => undefined);
        }

        if (currentUser) {
          useAuthStore.setState({
            user: {
              ...currentUser,
              level: response.data.level,
            },
          });
        }
      } catch {
        if (!cancelled) {
          setProfileData(null);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [ready]);

  if (!ready) return null;

  const nickname = user?.nickname ?? 'Test1';
  const avatarInitials = nickname.slice(0, 2).toUpperCase();
  const wins = profileData?.wins ?? 0;
  const losses = profileData?.losses ?? 0;
  const draws = profileData?.draws ?? 0;
  const level = profileData?.level ?? user?.level ?? 1;
  const totalXp = profileData?.total_xp ?? 0;
  const xpNeeded = profileData?.xp_needed ?? level * 200;
  const xpPct = Math.min(100, xpNeeded > 0 ? (totalXp / xpNeeded) * 100 : 0);
  const matchesPlayed = profileData?.matches_played ?? wins + losses;
  const goalsScored = profileData?.goals_scored ?? 0;
  const goalsConceded = profileData?.goals_conceded ?? 0;
  const bestWinStreak = profileData?.best_win_streak ?? 0;
  const recentMatches = profileData?.recent_matches ?? [];
  const winRate = matchesPlayed > 0 ? `${Math.round((wins / matchesPlayed) * 100)}%` : '0%';
  const statsRows: StatsRow[] = [
    { label: 'Matches Played', value: String(matchesPlayed), icon: Trophy },
    { label: 'Goals Scored', value: String(goalsScored), icon: Goal },
    { label: 'Win Rate', value: winRate, icon: LineChart },
    { label: 'Best Win Streak', value: String(bestWinStreak), icon: Flame },
  ];

  const openEditor = () => {
    setEditNickname(user?.nickname ?? '');
    setEditEmail(user?.email ?? '');
    setProfileError('');
    setEditing(true);
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileError('');

    try {
      const response = await api.put('/api/profile', {
        nickname: editNickname,
        email: editEmail,
      });

      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.setState({
          user: {
            ...currentUser,
            nickname: response.data.nickname,
            email: response.data.email,
            mmr: response.data.mmr,
          },
        });
      }
      setAvatarUrl(response.data.avatar_url ?? avatarUrl);

      setEditing(false);
    } catch (error: any) {
      setProfileError(error?.response?.data?.detail ?? 'Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const changeAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      setProfileError('Please choose an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const nextAvatar = String(reader.result);
      setAvatarUrl(nextAvatar);
      window.localStorage.setItem(`profile-avatar:${user.id}`, nextAvatar);
      try {
        await api.put('/api/profile', { avatar_url: nextAvatar });
      } catch (error: any) {
        setProfileError(error?.response?.data?.detail ?? 'Failed to save avatar');
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  return (
    <main className="lobby-bg relative min-h-screen overflow-hidden font-sans">
      <AppHeader />

      <div className="relative z-10 flex h-screen w-full pt-[58px]">
        <div className="grid h-[calc(100vh-58px)] w-full grid-cols-1 overflow-hidden rounded-none border-y border-[#2b4250] bg-[#020b0f]/88 shadow-[0_24px_90px_rgba(0,0,0,0.58)] backdrop-blur-md md:grid-cols-[410px_minmax(0,1fr)]">
          <aside className="hidden border-r border-white/10 bg-[#02090d]/54 px-9 py-7 md:flex md:flex-col">
            <h1 className="mb-8 text-[31px] font-extrabold uppercase tracking-[0.08em] text-white drop-shadow-[0_0_12px_rgba(210,255,244,0.72)]">
              Profile
            </h1>

            <nav className="space-y-3">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    'relative flex h-[66px] w-full items-center gap-6 rounded-[5px] px-5 text-left text-[17px] font-black uppercase text-white/70 transition hover:bg-white/[0.035] hover:text-white',
                    activeTab === item.id && 'bg-[#063322] pl-7 text-[#00d69f] shadow-[inset_4px_0_0_#00d69f,0_0_22px_rgba(0,214,159,0.10)]'
                  )}
                >
                  <item.icon className={cn('h-7 w-7', activeTab === item.id ? 'text-[#00d69f]' : 'text-white/55')} strokeWidth={2.1} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <button
              type="button"
              onClick={openEditor}
              className="mt-auto inline-flex h-[70px] w-full items-center justify-start rounded-[8px] border border-white/10 bg-white/[0.06] px-8 font-sans text-[20px] font-black text-white/86 transition hover:border-white/20 hover:bg-white/[0.09]"
            >
              <Pencil className="mr-5 h-7 w-7 text-white/66" strokeWidth={2.2} />
              Edit Profile
            </button>
          </aside>

          <section className={cn('profile-scroll h-full min-w-0 overflow-y-auto px-4 lg:px-5', activeTab === 'history' ? 'py-2' : 'py-4', activeTab === 'overview' && 'flex flex-col')}>
            {activeTab !== 'history' && (
              <Panel className="mb-4 min-h-[210px] shrink-0 p-8">
                <div className="grid h-full items-center gap-10 lg:grid-cols-[1fr_660px] xl:grid-cols-[1fr_760px]">
                  <div className="flex items-center gap-9">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="group flex h-[158px] w-[158px] items-center justify-center overflow-hidden rounded-full border border-cyan-300/35 bg-[conic-gradient(from_210deg,#ff21d8,#7d2dff,#00e2ff,#10212a,#ff21d8)] shadow-[0_0_42px_rgba(0,221,255,0.36)]"
                        aria-label="Change avatar"
                      >
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="" className="h-[144px] w-[144px] rounded-full object-cover transition group-hover:brightness-75" />
                        ) : (
                          <div className="flex h-[138px] w-[138px] items-center justify-center rounded-full border border-white/20 bg-[#051013]/55 text-[42px] font-black text-white/82 transition group-hover:bg-[#082326]">
                            {avatarInitials}
                          </div>
                        )}
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={changeAvatar} />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-3 right-1 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#172329] text-[14px] font-black text-white/70 transition hover:border-[#00d69f]/45 hover:text-white"
                        aria-label="Edit avatar"
                      >
                        E
                      </button>
                    </div>

                    <div>
                      <h2 className="text-[42px] font-extrabold leading-none text-white">{nickname}</h2>
                      <p className="mt-3 text-[16px] font-semibold text-white/38">{user?.email}</p>
                      <p className="mt-3 text-[21px] font-semibold text-white/66">Play. Compete. Win.</p>
                      <div className="mt-6 inline-flex h-10 items-center gap-3 rounded-full border border-white/10 bg-white/[0.055] px-4">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#58e789] shadow-[0_0_10px_rgba(88,231,137,0.65)]" />
                        <span className="text-[15px] font-bold text-white/82">Online</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 divide-x divide-white/10">
                    <HeroStat label="Wins" value={wins} tone="text-[#00d69f]" />
                    <HeroStat label="Losses" value={losses} tone="text-red-400" />
                    <HeroStat label="Level" value={level} tone="text-amber-300" />
                    <HeroStat label="Total XP" value={totalXp} tone="text-white" />
                  </div>
                </div>
              </Panel>
            )}

            {activeTab === 'overview' && (
              <OverviewContent
                totalXp={totalXp}
                xpNeeded={xpNeeded}
                xpPct={xpPct}
                level={level}
                statsRows={statsRows}
                recentMatches={recentMatches}
                onViewAllHistory={() => setActiveTab('history')}
                onViewAllAchievements={() => setActiveTab('achievements')}
              />
            )}
            {activeTab === 'history' && (
              <MatchHistoryPanel
                matches={recentMatches}
                matchesPlayed={matchesPlayed}
                wins={wins}
                draws={draws}
                losses={losses}
                goalsScored={goalsScored}
                goalsConceded={goalsConceded}
                expanded
              />
            )}
            {activeTab === 'progress' && <ProgressPanel totalXp={totalXp} xpNeeded={xpNeeded} xpPct={xpPct} level={level} expanded />}
            {activeTab === 'achievements' && <AchievementsPanel expanded />}
            {activeTab === 'stats' && <StatsPanel expanded statsRows={statsRows} />}
            {activeTab === 'customization' && <CustomizationPanel />}
          </section>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/62 px-4 backdrop-blur-[2px]">
          <div className="relative w-full max-w-[440px] rounded-[8px] border border-[#1d3b45] bg-[#071821] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.72),0_0_28px_rgba(0,214,255,0.12),inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="pointer-events-none absolute inset-0 rounded-[8px] bg-[radial-gradient(circle_at_50%_0%,rgba(0,245,255,0.10),transparent_45%)]" />
            <div className="relative z-10 mb-8 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[22px] font-black uppercase tracking-[0.01em] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.34)]">Edit Profile</h2>
                <p className="mt-3 text-[14px] font-semibold text-white/76">Update your account information.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="grid h-9 w-9 place-items-center rounded-md text-white/55 transition hover:bg-white/[0.06] hover:text-white"
                aria-label="Close edit profile"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="relative z-10 space-y-7">
              <label className="block">
                <span className="mb-3 block text-[12px] font-black uppercase text-white/58">Display Name</span>
                <div className="relative">
                  <input
                    value={editNickname}
                    maxLength={20}
                    onChange={(event) => setEditNickname(event.target.value)}
                    className="profile-edit-input h-[50px] w-full rounded-[5px] border border-[#1e3d48] bg-[#0a2029] px-4 pr-16 text-[15px] font-bold text-white outline-none shadow-[inset_0_0_18px_rgba(0,214,255,0.03)] transition placeholder:text-white/25 focus:border-[#00d69f]/58 focus:shadow-[0_0_16px_rgba(0,214,159,0.11),inset_0_0_18px_rgba(0,214,255,0.04)]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-bold tabular-nums text-white/45">
                    {editNickname.length} / 20
                  </span>
                </div>
              </label>
              <label className="block">
                <span className="mb-3 block text-[12px] font-black uppercase text-white/58">Email Address</span>
                <input
                  value={editEmail}
                  onChange={(event) => setEditEmail(event.target.value)}
                  className="profile-edit-input h-[50px] w-full rounded-[5px] border border-[#1e3d48] bg-[#0a2029] px-4 text-[15px] font-bold text-white outline-none shadow-[inset_0_0_18px_rgba(0,214,255,0.03)] transition placeholder:text-white/25 focus:border-[#00d69f]/58 focus:shadow-[0_0_16px_rgba(0,214,159,0.11),inset_0_0_18px_rgba(0,214,255,0.04)]"
                />
              </label>
            </div>

            {profileError && <p className="relative z-10 mt-4 text-[13px] font-semibold text-red-300">{profileError}</p>}

            <div className="relative z-10 mt-8 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="h-[46px] rounded-[5px] border border-[#284a56] bg-[#0d2530] px-6 text-[13px] font-black uppercase text-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-white/20 hover:bg-[#102b35] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveProfile}
                disabled={savingProfile}
                className="h-[46px] rounded-[5px] border border-[#17ffd0]/35 bg-[linear-gradient(180deg,#18f4d1_0%,#05d2aa_48%,#009d7a_100%)] px-6 text-[13px] font-black uppercase text-white shadow-[0_0_22px_rgba(0,214,159,0.42),inset_0_1px_0_rgba(255,255,255,0.34)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function OverviewContent({
  totalXp,
  xpNeeded,
  xpPct,
  level,
  statsRows,
  recentMatches,
  onViewAllHistory,
  onViewAllAchievements,
}: {
  totalXp: number;
  xpNeeded: number;
  xpPct: number;
  level: number;
  statsRows: StatsRow[];
  recentMatches: RecentMatch[];
  onViewAllHistory: () => void;
  onViewAllAchievements: () => void;
}) {
  return (
    <div className="grid min-h-[640px] flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="grid h-full grid-rows-[160px_minmax(320px,1fr)_170px] gap-4">
                <ProgressPanel totalXp={totalXp} xpNeeded={xpNeeded} xpPct={xpPct} level={level} />
                <MatchHistoryPanel matches={recentMatches} onViewAll={onViewAllHistory} />

                <Panel className="h-full p-6">
                  <div className="flex h-full items-center gap-7">
                    <MockBadge tone="gold" label="R" size="lg" />
                    <div>
                      <SectionTitle title="Player Badge" />
                      <p className="text-[21px] font-bold text-white">Rookie</p>
                      <p className="mt-2 text-[14px] font-semibold text-white/52">Keep playing to unlock new badges!</p>
                    </div>
                  </div>
                </Panel>
              </div>

              <div className="grid h-full grid-rows-[330px_minmax(260px,1fr)_170px] gap-4">
                <StatsPanel statsRows={statsRows} />
                <AchievementsPanel onViewAll={onViewAllAchievements} />

                <Panel className="h-full p-5">
                  <SectionTitle title="Recent Reward" />
                  <div className="flex h-[calc(100%-34px)] items-center justify-between gap-4">
                    <div className="flex items-center gap-5">
                      <MockBadge tone="bronze" label="P" size="lg" />
                      <div>
                        <p className="text-[16px] font-bold text-white/86">Bronze Pack</p>
                        <p className="mt-1 text-[12px] font-semibold text-white/42">Earned 2 days ago</p>
                      </div>
                    </div>
                    <button className="h-11 rounded-md border border-[#00d69f]/45 px-7 text-[13px] font-black uppercase text-[#00d69f]">
                      Claimed
                    </button>
                  </div>
                </Panel>
              </div>
            </div>
  );
}

function ProgressPanel({
  totalXp,
  xpNeeded,
  xpPct,
  level,
  expanded = false,
}: {
  totalXp: number;
  xpNeeded: number;
  xpPct: number;
  level: number;
  expanded?: boolean;
}) {
  return (
    <Panel className={cn('h-full min-h-[126px] p-6', expanded && 'mx-auto max-w-4xl')}>
      <div className="flex h-full items-center gap-8">
        <MockBadge tone="bronze" label={String(level)} size="lg" />
        <div className="min-w-0 flex-1">
          <SectionTitle title="Level Progress" />
          <div className="mb-2 flex justify-between text-[15px] font-bold text-white/82">
            <span>{totalXp} / {xpNeeded} XP</span>
            <span className="text-white/62">Next Level {level + 1}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/12">
            <div className="h-full rounded-full bg-[#00d69f] shadow-[0_0_18px_rgba(0,214,159,0.45)]" style={{ width: `${xpPct}%` }} />
          </div>
          {expanded && (
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {['Bronze League', 'Daily XP Bonus', 'Next Badge Slot'].map((item) => (
                <div key={item} className="rounded-md border border-white/10 bg-white/[0.035] p-4 text-[14px] font-bold text-white/76">
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

function formatMatchDate(value: string | null) {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';

  const now = Date.now();
  const diffMs = now - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs >= 0 && diffMs < minute) return 'Just now';
  if (diffMs >= 0 && diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
  if (diffMs >= 0 && diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;

  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, seconds || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${minutes}m ${String(rest).padStart(2, '0')}s`;
}

function MatchHistoryPanel({
  expanded = false,
  matches,
  onViewAll,
  matchesPlayed = matches.length,
  wins = matches.filter((match) => match.result === 'WIN').length,
  draws = matches.filter((match) => match.result === 'DRAW').length,
  losses = matches.filter((match) => match.result === 'LOSS').length,
  goalsScored,
  goalsConceded,
}: {
  expanded?: boolean;
  matches: RecentMatch[];
  onViewAll?: () => void;
  matchesPlayed?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  goalsScored?: number;
  goalsConceded?: number;
}) {
  const visibleMatches = expanded ? matches : matches.slice(0, 3);
  const scored = goalsScored ?? matches.reduce((total, match) => total + Number(match.score.split(':')[0] ?? 0), 0);
  const conceded = goalsConceded ?? matches.reduce((total, match) => total + Number(match.score.split(':')[1] ?? 0), 0);
  const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;

  if (expanded) {
    return (
      <div className="grid h-full min-h-[620px] gap-3 xl:grid-cols-[minmax(0,1fr)_330px]">
        <Panel className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-[22px] font-black uppercase text-white">Match History</h2>
            <button type="button" className="flex h-10 items-center gap-3 rounded-md border border-white/10 bg-white/[0.045] px-4 text-[12px] font-black uppercase text-white/78">
              <LineChart className="h-4 w-4 text-[#00d69f]" />
              Filter
              <ChevronDown className="h-4 w-4 text-white/52" />
            </button>
          </div>

          <div className="mt-5 flex gap-8 border-b border-white/8 text-[12px] font-black uppercase text-white/48">
            {['All Modes', 'Ranked', 'Unranked', 'Friendly', 'Tournaments'].map((tab, index) => (
              <button
                key={tab}
                type="button"
                className={cn('relative pb-3 transition hover:text-white', index === 0 && 'text-[#00d69f] after:absolute after:bottom-[-1px] after:left-0 after:h-[2px] after:w-full after:bg-[#00d69f]')}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-[84px_86px_1fr_120px_112px_24px] px-3 text-[12px] font-bold uppercase text-white/46">
            <span>Result</span>
            <span>Mode</span>
            <span>Score</span>
            <span>Time</span>
            <span>Rewards</span>
            <span />
          </div>

          <div className="mt-3 space-y-2">
            {visibleMatches.length > 0 ? (
              visibleMatches.map((match) => (
                <div key={match.id} className="grid min-h-[58px] grid-cols-[84px_86px_1fr_120px_112px_24px] items-center rounded-md border border-white/5 bg-[#081c23]/78 px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
                  <div>
                    <p className={cn('text-[13px] font-black uppercase', match.result === 'WIN' && 'text-[#00d69f]', match.result === 'DRAW' && 'text-white/70', match.result === 'LOSS' && 'text-red-400')}>
                      {match.result}
                    </p>
                    <p className="mt-1 text-[11px] font-bold text-amber-300">Trophy</p>
                  </div>
                  <div>
                    <span className="rounded-[4px] border border-[#8b35ff]/55 bg-[#32124f] px-2 py-1 text-[12px] font-black text-white">3v3</span>
                    <p className="mt-2 text-[11px] font-semibold text-white/45">Ranked</p>
                  </div>
                  <p className={cn('text-center text-[22px] font-black tabular-nums', match.result === 'LOSS' ? 'text-red-400' : match.result === 'WIN' ? 'text-[#00d69f]' : 'text-white')}>
                    {match.score}
                  </p>
                  <div className="text-[12px] font-bold text-white/45">
                    <p>{formatMatchDate(match.played_at)}</p>
                    <p className="mt-1">{formatDuration(match.duration)}</p>
                  </div>
                  <div className="text-[12px] font-black text-white/76">
                    <span className="text-amber-300">XP</span>
                    <span className="ml-2">{match.result === 'WIN' ? '+100' : match.result === 'DRAW' ? '+50' : '+30'}</span>
                  </div>
                  <span className="text-right text-[24px] text-white/48">›</span>
                </div>
              ))
            ) : (
              <div className="rounded-md bg-white/[0.035] px-4 py-8 text-center text-[13px] font-semibold text-white/44">No matches yet</div>
            )}
          </div>
          <div className="mt-4 border-t border-white/8 pt-3 text-center">
            <button type="button" className="inline-flex h-9 items-center gap-2 rounded-md border border-[#00d69f]/28 bg-[#00d69f]/8 px-6 text-[12px] font-black uppercase text-[#00d69f]">
              <Clock3 className="h-4 w-4" />
              Load More
            </button>
          </div>
        </Panel>

        <Panel className="p-4">
          <div className="mb-5 flex items-center gap-2">
            <h2 className="text-[16px] font-black uppercase text-white">Match Summary</h2>
            <span className="text-[11px] font-bold text-white/40">(This Season)</span>
          </div>

          <div className="grid grid-cols-[112px_1fr] items-center gap-5">
            <div className="grid h-[112px] w-[112px] place-items-center rounded-full bg-[conic-gradient(#00d69f_0_var(--rate),rgba(255,255,255,0.08)_var(--rate)_100%)] p-[6px]" style={{ '--rate': `${winRate}%` } as React.CSSProperties}>
              <div className="grid h-full w-full place-items-center rounded-full bg-[#071418] text-center">
                <div>
                  <p className="text-[28px] font-black text-white">{winRate}%</p>
                  <p className="text-[12px] font-bold text-white/62">Win Rate</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-[13px]">
              <SummaryRow label="Matches Played" value={matchesPlayed} />
              <SummaryRow label="Wins" value={wins} />
              <SummaryRow label="Draws" value={draws} />
              <SummaryRow label="Losses" value={losses} />
            </div>
          </div>

          <div className="mt-8">
            <h3 className="mb-4 text-[14px] font-black uppercase text-white">Goals Overview</h3>
            <div className="space-y-3 text-[13px]">
              <SummaryRow label="Goals Scored" value={scored} />
              <SummaryRow label="Goals Conceded" value={conceded} />
              <SummaryRow label="Goal Difference" value={`${scored - conceded >= 0 ? '+' : ''}${scored - conceded}`} tone={scored - conceded >= 0 ? 'text-[#00d69f]' : 'text-red-400'} />
            </div>
          </div>

          <div className="mt-8 border-t border-white/8 pt-5">
            <h3 className="mb-4 text-[14px] font-black uppercase text-white">Favorite Mode</h3>
            <div className="grid grid-cols-[56px_1fr_72px_52px] items-center gap-3 text-[13px]">
              <span className="rounded-[4px] border border-[#8b35ff]/55 bg-[#32124f] px-2 py-1 text-center text-[12px] font-black text-white">3v3</span>
              <span className="font-bold text-white/82">Ranked 3v3</span>
              <span className="text-right text-white/48">Win Rate<br /><b className="text-white">{winRate}%</b></span>
              <span className="text-right text-white/48">Matches<br /><b className="text-white">{matchesPlayed}</b></span>
            </div>
          </div>

          <button type="button" className="mt-8 flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#00d69f]/35 bg-[#00d69f]/8 text-[12px] font-black uppercase text-[#00d69f] transition hover:bg-[#00d69f]/14">
            <BarChart3 className="h-4 w-4" />
            View Detailed Stats
          </button>
        </Panel>
      </div>
    );
  }

  return (
    <Panel className={cn('p-5', !expanded && 'h-full min-h-0', expanded && 'mx-auto max-w-5xl')}>
      <SectionTitle title="Match History" action={expanded ? undefined : 'View All'} onAction={onViewAll} />
      <div className="space-y-2.5">
        {visibleMatches.length > 0 ? (
          visibleMatches.map((match) => (
            <div key={match.id} className="grid min-h-[48px] grid-cols-[96px_minmax(84px,1fr)_minmax(74px,110px)] items-center gap-4 rounded-md bg-white/[0.04] px-4 py-2">
              <p className={cn('text-[13px] font-black uppercase', match.result === 'WIN' && 'text-[#00d69f]', match.result === 'DRAW' && 'text-amber-300', match.result === 'LOSS' && 'text-red-400')}>
                {match.result}
              </p>
              <p className={cn('text-center text-[24px] font-black tabular-nums', match.result === 'LOSS' ? 'text-red-400' : match.result === 'WIN' ? 'text-[#00d69f]' : 'text-white')}>
                {match.score}
              </p>
              <p className="text-right text-[12px] font-bold text-white/42">{formatMatchDate(match.played_at)}</p>
            </div>
          ))
        ) : (
          <div className="rounded-md bg-white/[0.035] px-4 py-5 text-center text-[13px] font-semibold text-white/44">
            No matches yet
          </div>
        )}
      </div>
    </Panel>
  );
}

function StatsPanel({ expanded = false, statsRows }: { expanded?: boolean; statsRows: StatsRow[] }) {
  return (
    <Panel className={cn('p-5', !expanded && 'h-full min-h-[310px]', expanded && 'mx-auto max-w-3xl')}>
      <SectionTitle title="Stats Overview" />
      <div className={cn('space-y-3', !expanded && 'pb-2', expanded && 'grid gap-3 space-y-0 sm:grid-cols-2')}>
        {statsRows.map(({ label, value, icon: Icon }) => (
          <div key={label} className="grid grid-cols-[1fr_70px] items-center gap-4 rounded-md bg-white/[0.035] p-2">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center text-[#00d69f] drop-shadow-[0_0_10px_rgba(0,214,159,0.5)]">
                <Icon className="h-[21px] w-[21px]" strokeWidth={2.4} />
              </span>
              <span className="text-[14px] font-bold text-white/74">{label}</span>
            </div>
            <span className="text-right text-[15px] font-black text-white/88">{value}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function SummaryRow({ label, value, tone = 'text-white' }: { label: string; value: number | string; tone?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-white/55">{label}</span>
      <span className={cn('font-black tabular-nums', tone)}>{value}</span>
    </div>
  );
}

function AchievementsPanel({ expanded = false, onViewAll }: { expanded?: boolean; onViewAll?: () => void }) {
  return (
    <Panel className={cn('p-5', !expanded && 'h-full min-h-0', expanded && 'mx-auto max-w-5xl')}>
      <SectionTitle title="Achievements" action={expanded ? undefined : 'View All'} onAction={onViewAll} />
      <div className={cn('grid gap-4', expanded ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-4')}>
        {achievements.map((achievement) => (
          <div key={achievement.title} className="text-center">
            <div className="mb-4 flex justify-center">
              <MockBadge
                tone={
                  achievement.icon === 'cup'
                    ? 'gold'
                    : achievement.icon === '10'
                      ? 'silver'
                      : achievement.icon === 'goal'
                        ? 'bronze'
                        : 'dark'
                }
                label={achievement.icon === 'lock' ? 'L' : achievement.icon === 'goal' ? 'G' : achievement.icon}
                size="lg"
              />
            </div>
            <p className="text-[11px] font-black uppercase text-white/82">{achievement.title}</p>
            <p className="mt-2 text-[11px] leading-4 text-white/45">{achievement.desc}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function CustomizationPanel() {
  return (
    <Panel className="mx-auto max-w-4xl p-6">
      <SectionTitle title="Customization" />
      <div className="grid gap-4 sm:grid-cols-3">
        {['Avatar Frame', 'Goal Effect', 'Profile Banner'].map((item, index) => (
          <div key={item} className="rounded-md border border-white/10 bg-white/[0.035] p-5 text-center">
            <div className="mb-5 flex justify-center">
              <MockBadge tone={index === 0 ? 'cyan' : index === 1 ? 'gold' : 'bronze'} label={String(index + 1)} size="md" />
            </div>
            <p className="text-[15px] font-bold text-white/82">{item}</p>
            <p className="mt-2 text-[12px] leading-5 text-white/44">Mocked cosmetic slot</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function HeroStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="px-8 text-center">
      <p className="mb-6 text-[16px] font-black uppercase text-white/66">{label}</p>
      <p className={cn('text-[58px] font-black leading-none tabular-nums drop-shadow-[0_0_12px_rgba(255,255,255,0.18)]', tone)}>
        {value}
      </p>
    </div>
  );
}
