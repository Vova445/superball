'use client';

import { useMemo, useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { cn } from '@/lib/cn';

type ClubTab =
  | 'discover'
  | 'applications'
  | 'create'
  | 'clubOverview'
  | 'clubMembers'
  | 'clubMatches'
  | 'clubTournaments'
  | 'clubStats'
  | 'clubActivity'
  | 'clubStore'
  | 'clubSettings';

const tabs: { id: ClubTab; label: string; icon: string }[] = [
  { id: 'discover', label: 'Discover', icon: 'Q' },
  { id: 'applications', label: 'My Applications', icon: 'A' },
  { id: 'create', label: 'Create Club', icon: '+' },
];

const clubTabs: { id: ClubTab; label: string; icon: string }[] = [
  { id: 'clubOverview', label: 'Overview', icon: 'O' },
  { id: 'clubMembers', label: 'Members', icon: 'M' },
  { id: 'clubMatches', label: 'Matches', icon: 'G' },
  { id: 'clubTournaments', label: 'Tournaments', icon: 'T' },
  { id: 'clubStats', label: 'Club Stats', icon: 'S' },
  { id: 'clubActivity', label: 'Activity Feed', icon: 'F' },
  { id: 'clubStore', label: 'Store', icon: '$' },
  { id: 'clubSettings', label: 'Settings', icon: '*' },
];

const featuredClubs = [
  { name: 'Elite Strikers', tag: 'Elite', style: 'green', members: '24/30', wins: 150, level: 12, desc: 'Competitive • Active • Friendly' },
  { name: 'Red Devils', tag: 'Pro', style: 'red', members: '28/30', wins: 210, level: 15, desc: 'Competitive • Serious • Skilled' },
  { name: 'Golden Eagles', tag: 'Elite', style: 'gold', members: '26/30', wins: 180, level: 13, desc: 'Competitive • Active • Teamwork' },
  { name: 'Blue Champions', tag: 'Pro', style: 'blue', members: '22/30', wins: 120, level: 10, desc: 'Competitive • Friendly • Active' },
  { name: 'Night Wolves', tag: 'Semi-Pro', style: 'purple', members: '18/30', wins: 80, level: 7, desc: 'Casual • Fun • Growing' },
];

const allClubs = [
  { name: 'Steel Titans', members: '30/30', wins: 3000, level: 18, region: 'Europe', type: 'Competitive', activity: 'Very Active', style: 'silver' },
  { name: 'Vikings FC', members: '29/30', wins: 2500, level: 16, region: 'Europe', type: 'Competitive', activity: 'Active', style: 'dark' },
  { name: 'Thunder Squad', members: '25/30', wins: 2300, level: 12, region: 'Asia', type: 'Semi-Pro', activity: 'Active', style: 'blue' },
  { name: 'Phoenix Rising', members: '20/30', wins: 1100, level: 8, region: 'North America', type: 'Casual', activity: 'Active', style: 'red' },
];

const clubAchievements = [
  ['First Cup', 'Win your first club tournament', 'gold', 'C'],
  ['Win Streak', 'Win 10 matches in a row', 'silver', '10'],
  ['Unbeaten', '15 matches without loss', 'gold', '15'],
  ['Rising Star', 'Reach club level 15', 'dark', 'L'],
  ['Dominator', 'Win 50 club matches', 'dark', 'L'],
];

const activityFeed = [
  ['CaptainAlex', 'scored 3 goals in a match', '2h ago'],
  ['Player_One', 'joined the club', '1d ago'],
  ['Elite Strikers', 'won vs Thunder Squad', '2d ago'],
  ['GoalMaster', 'earned the achievement Win Streak', '2d ago'],
];

const announcements = [
  ['Training session tonight at 20:00 UTC', 'by CaptainAlex', '2h ago'],
  ['Club tournament this weekend!', 'by Manager', '1d ago'],
  ['Welcome our new member: GoalMaster', 'by CaptainAlex', '2d ago'],
];

const events = [
  ['Club Tournament', 'Elite Cup #7', '2d 14h', 'Join', 'gold'],
  ['Friendly Match', 'vs Red Devils', '1d 6h', 'View', 'red'],
  ['Training Session', 'Team Practice', '10h 30m', 'Join', 'silver'],
];

const emblemStyles = ['green', 'red', 'gold', 'blue', 'purple', 'silver'];
const colorChoices = ['#00d69f', '#0f7bff', '#7a2bd8', '#ff3527', '#f97316', '#eab308', '#e5e7eb'];

function ClubLogo({ style, size = 'lg' }: { style: string; size?: 'sm' | 'md' | 'lg' }) {
  const colors: Record<string, string> = {
    green: 'from-emerald-300 via-emerald-700 to-black border-emerald-200/35',
    red: 'from-red-300 via-red-700 to-black border-red-300/35',
    gold: 'from-yellow-200 via-amber-500 to-black border-yellow-200/40',
    blue: 'from-sky-200 via-sky-700 to-black border-sky-200/35',
    purple: 'from-purple-200 via-purple-700 to-black border-purple-200/35',
    silver: 'from-slate-100 via-slate-500 to-black border-slate-200/35',
    dark: 'from-slate-500 via-slate-800 to-black border-white/15',
  };
  const sizes = {
    sm: 'h-9 w-9 text-[13px]',
    md: 'h-16 w-16 text-[22px]',
    lg: 'h-24 w-24 text-[34px]',
  };

  return (
    <div className={cn('mx-auto flex shrink-0 items-center justify-center rounded-[22px] border bg-gradient-to-br shadow-[0_0_26px_rgba(0,214,159,0.18)]', colors[style], sizes[size])}>
      <div className="flex h-[72%] w-[72%] items-center justify-center rounded-full border border-white/18 bg-black/25 font-black text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.65)]">
        ⚽
      </div>
    </div>
  );
}

function LevelBadge({ level }: { level: number }) {
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-300/35 bg-amber-500/10 text-[12px] font-black text-amber-200 shadow-[0_0_14px_rgba(245,158,11,0.25)]">
      {level}
    </span>
  );
}

function SelectFilter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="flex items-center gap-3 text-[13px] font-bold text-white/70">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 min-w-[140px] rounded-md border border-white/10 bg-[#111b20] px-3 text-[13px] font-semibold text-white/82 outline-none hover:border-white/18 focus:border-[#00d69f]/70"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-[#111b20] text-white">
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function FieldLabel({ label, count }: { label: string; count?: string }) {
  return (
    <div className="mb-2 flex items-center justify-between text-[12px] font-black uppercase text-white/72">
      <span>{label}</span>
      {count && <span className="text-white/42">{count}</span>}
    </div>
  );
}

function FormInput({
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  maxLength: number;
}) {
  return (
    <div>
      <input
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-md border border-white/8 bg-white/[0.055] px-4 text-[14px] font-semibold text-white outline-none placeholder:text-white/34 focus:border-[#00d69f]/70"
      />
    </div>
  );
}

function CreateSelect({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full rounded-md border border-white/8 bg-white/[0.055] px-4 text-[14px] font-semibold text-white outline-none focus:border-[#00d69f]/70"
    >
      {options.map((option) => (
        <option key={option} value={option} className="bg-[#111b20] text-white">
          {option}
        </option>
      ))}
    </select>
  );
}

function CreateToggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'flex h-[26px] w-12 items-center rounded-full border p-0.5 transition',
        checked ? 'border-[#10d8a0] bg-[#10d8a0] shadow-[0_0_16px_rgba(16,216,160,0.45)]' : 'border-white/24 bg-[#111b20]'
      )}
    >
      <span className={cn('h-5 w-5 rounded-full bg-white transition', checked && 'translate-x-[20px]')} />
    </button>
  );
}

export default function ClubsPage() {
  const { ready } = useRequireAuth();
  const [activeTab, setActiveTab] = useState<ClubTab>('discover');
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('Any');
  const [members, setMembers] = useState('Any');
  const [sort, setSort] = useState('Most Active');
  const [page, setPage] = useState(1);
  const [clubName, setClubName] = useState('');
  const [clubTag, setClubTag] = useState('');
  const [clubDescription, setClubDescription] = useState('');
  const [clubRegion, setClubRegion] = useState('');
  const [clubType, setClubType] = useState('Competitive');
  const [requiredLevel, setRequiredLevel] = useState('5');
  const [manualApproval, setManualApproval] = useState(true);
  const [emblemIndex, setEmblemIndex] = useState(0);
  const [primaryColor, setPrimaryColor] = useState(colorChoices[0]);
  const [secondaryColor, setSecondaryColor] = useState(colorChoices[2]);
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const isClubView = activeTab.startsWith('club');
  const sideTabs = isClubView ? clubTabs : tabs;

  const filteredClubs = useMemo(() => {
    return allClubs
      .filter((club) => club.name.toLowerCase().includes(query.toLowerCase()))
      .filter((club) => region === 'Any' || club.region === region)
      .filter((club) => members === 'Any' || (members === 'Open Spots' ? club.members !== '30/30' : club.members === '30/30'))
      .sort((a, b) => (sort === 'Most Wins' ? b.wins - a.wins : sort === 'Highest Level' ? b.level - a.level : a.name.localeCompare(b.name)));
  }, [members, query, region, sort]);

  if (!ready) return null;

  return (
    <main className="lobby-bg relative min-h-screen overflow-hidden font-sans">
      <AppHeader />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 pb-7 pt-[92px]">
        <div className="grid h-[min(78vh,790px)] w-full max-w-[1500px] grid-cols-[235px_1fr] overflow-hidden rounded-lg border border-[#2b4250] bg-[#020b0f]/88 shadow-[0_24px_90px_rgba(0,0,0,0.58)] backdrop-blur-md">
          <aside className="hidden border-r border-white/10 bg-[#02090d]/54 px-7 py-8 md:flex md:flex-col">
            <h1 className="mb-8 text-[29px] font-extrabold uppercase tracking-[0.08em] text-white drop-shadow-[0_0_12px_rgba(210,255,244,0.72)]">
              Clubs
            </h1>

            <nav className="space-y-2">
              {sideTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'relative flex h-14 w-full items-center gap-4 border-t border-white/10 px-1 text-left text-[15px] font-bold uppercase text-white/68 transition last:border-b hover:text-white',
                    activeTab === tab.id && 'border-transparent bg-[#06271f] px-4 text-[#00d69f]'
                  )}
                >
                  {activeTab === tab.id && <span className="absolute left-0 top-0 h-full w-1 bg-[#00d69f]" />}
                  <span className="flex h-6 w-6 items-center justify-center rounded border border-white/12 text-[12px] font-bold leading-none">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>

            <div className="mt-auto rounded-lg border border-white/10 bg-white/[0.035] p-5">
              <p className="mb-4 text-[15px] font-extrabold uppercase text-[#00d69f]">
                {isClubView ? 'Club Boost' : 'Featured'}
              </p>
              <div className="mb-5 flex justify-center">
                <ClubLogo style="gold" size="md" />
              </div>
              <p className="text-center text-[15px] font-black uppercase text-white">
                {isClubView ? 'Activate Boost' : 'Join a Club'}
              </p>
              <p className="mt-2 text-center text-[12px] leading-5 text-white/48">
                {isClubView ? 'Extra XP and rewards for your squad.' : 'Play together. Win together.'}
              </p>
              <Button
                onClick={() => setActiveTab(isClubView ? 'clubStore' : 'create')}
                className="mt-5 h-10 w-full rounded-md bg-[#06c994] font-sans text-[13px] font-black uppercase text-white shadow-[0_0_22px_rgba(6,201,148,0.36)]"
              >
                {isClubView ? 'View Boosts' : 'Create Club'}
              </Button>
            </div>
          </aside>

          <section className="clubs-scroll min-w-0 overflow-y-auto px-6 py-7">
            {isClubView && (
              <ClubDashboard
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onLeave={() => setActiveTab('discover')}
              />
            )}

            {activeTab === 'discover' && (
              <>
                <div className="mb-7 flex flex-wrap items-center gap-4">
                  <div className="relative mr-auto w-full max-w-[270px]">
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search clubs..."
                      className="h-10 w-full rounded-md border border-white/8 bg-white/[0.055] px-4 pr-10 text-[14px] font-semibold text-white/82 outline-none placeholder:text-white/30 focus:border-[#00d69f]/65"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/44">⌕</span>
                  </div>

                  <SelectFilter label="Region" value={region} onChange={setRegion} options={['Any', 'Europe', 'North America', 'Asia']} />
                  <SelectFilter label="Members" value={members} onChange={setMembers} options={['Any', 'Open Spots', 'Full']} />
                  <SelectFilter label="Sort by" value={sort} onChange={setSort} options={['Most Active', 'Most Wins', 'Highest Level']} />
                  <button className="h-10 rounded-md border border-[#00d69f]/25 bg-[#00d69f]/10 px-4 text-[14px] font-black text-[#00d69f] transition hover:bg-[#00d69f]/16">
                    ↻
                  </button>
                </div>

                <h2 className="mb-4 text-[15px] font-extrabold uppercase text-[#00d69f]">Featured Clubs</h2>
                <div className="mb-7 grid gap-4 xl:grid-cols-5 lg:grid-cols-3 md:grid-cols-2">
                  {featuredClubs.map((club) => (
                    <article key={club.name} className="rounded-lg border border-white/10 bg-[#071418]/72 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                      <ClubLogo style={club.style} />
                      <div className="mt-6 flex items-center justify-between gap-3">
                        <h3 className="text-[16px] font-black text-white/88">{club.name}</h3>
                        <span className="rounded-md bg-[#00d69f]/10 px-3 py-1 text-[11px] font-bold text-[#00d69f]">{club.tag}</span>
                      </div>
                      <p className="mt-4 text-[12px] font-semibold text-white/45">{club.desc}</p>
                      <div className="mt-5 grid grid-cols-3 gap-2 text-[12px]">
                        <MiniStat label="Members" value={club.members} />
                        <MiniStat label="Total Wins" value={club.wins} />
                        <MiniStat label="Level" value={club.level} />
                      </div>
                      <Button
                        onClick={() => setActiveTab('clubOverview')}
                        className="mt-5 h-10 w-full rounded-md bg-[#06c994] font-sans text-[13px] font-black uppercase text-white shadow-[0_0_20px_rgba(6,201,148,0.28)]"
                      >
                        View Club
                      </Button>
                    </article>
                  ))}
                </div>

                <h2 className="mb-4 text-[15px] font-extrabold uppercase text-[#00d69f]">All Clubs</h2>
                <div className="overflow-hidden rounded-lg border border-white/10 bg-[#071418]/72">
                  <div className="grid grid-cols-[minmax(230px,1.7fr)_110px_130px_90px_130px_120px_150px_80px] border-b border-white/10 px-5 py-4 text-[12px] font-black uppercase text-white/45">
                    <span>Club Name</span>
                    <span>Members</span>
                    <span>Total Wins</span>
                    <span>Level</span>
                    <span>Region</span>
                    <span>Type</span>
                    <span>Activity</span>
                    <span />
                  </div>
                  {filteredClubs.map((club) => (
                    <div key={club.name} className="grid min-h-[58px] grid-cols-[minmax(230px,1.7fr)_110px_130px_90px_130px_120px_150px_80px] items-center border-b border-white/[0.055] px-5 text-[14px] font-semibold text-white/72 last:border-b-0">
                      <div className="flex items-center gap-4">
                        <ClubLogo style={club.style} size="sm" />
                        <span className="font-bold text-white/84">{club.name}</span>
                      </div>
                      <span>{club.members}</span>
                      <span>{club.wins}</span>
                      <LevelBadge level={club.level} />
                      <span>{club.region}</span>
                      <span>{club.type}</span>
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#00d69f]" />
                        {club.activity}
                      </span>
                      <button
                        onClick={() => setActiveTab('clubOverview')}
                        className="h-9 rounded-md bg-[#00d69f]/12 text-[13px] font-black uppercase text-[#00d69f] transition hover:bg-[#00d69f]/20"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex justify-center gap-3 text-[13px] font-bold text-white/50">
                  {[1, 2, 3].map((item) => (
                    <button
                      key={item}
                      onClick={() => setPage(item)}
                      className={cn('h-9 w-9 rounded-md border border-transparent', page === item && 'border-[#00d69f]/50 bg-[#00d69f]/10 text-[#00d69f]')}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'applications' && (
              <div className="rounded-lg border border-white/10 bg-[#071418]/72 p-8">
                <h2 className="text-[18px] font-extrabold uppercase text-[#00d69f]">My Applications</h2>
                <p className="mt-3 text-[14px] text-white/52">You have no pending club applications yet.</p>
              </div>
            )}

            {activeTab === 'create' && (
              <div>
                <div className="mb-8">
                  <h2 className="text-[30px] font-extrabold uppercase tracking-[0.05em] text-white drop-shadow-[0_0_12px_rgba(210,255,244,0.62)]">
                    Create Club
                  </h2>
                  <p className="mt-2 text-[16px] font-semibold text-white/58">Build your club. Set your identity. Start your journey.</p>
                </div>

                <div className="grid gap-5 xl:grid-cols-2">
                  <section className="rounded-lg border border-white/10 bg-[#071418]/72 p-5">
                    <h3 className="mb-6 text-[15px] font-extrabold uppercase text-[#00d69f]">Club Information</h3>

                    <div className="space-y-5">
                      <div>
                        <FieldLabel label="Club Name *" count={`${clubName.length}/20`} />
                        <FormInput value={clubName} onChange={setClubName} placeholder="Enter club name" maxLength={20} />
                      </div>

                      <div>
                        <FieldLabel label="Tag *" count={`${clubTag.length}/5`} />
                        <FormInput value={clubTag} onChange={(value) => setClubTag(value.toUpperCase())} placeholder="Enter short tag (3-5 characters)" maxLength={5} />
                      </div>

                      <div>
                        <FieldLabel label="Description *" count={`${clubDescription.length}/150`} />
                        <textarea
                          value={clubDescription}
                          maxLength={150}
                          onChange={(event) => setClubDescription(event.target.value)}
                          placeholder="Tell others about your club..."
                          className="min-h-[98px] w-full resize-none rounded-md border border-white/8 bg-white/[0.055] px-4 py-3 text-[14px] font-semibold text-white outline-none placeholder:text-white/34 focus:border-[#00d69f]/70"
                        />
                      </div>

                      <div>
                        <FieldLabel label="Region *" />
                        <CreateSelect value={clubRegion} onChange={setClubRegion} options={['', 'Europe', 'North America', 'Asia', 'South America']} />
                      </div>

                      <div>
                        <FieldLabel label="Club Type *" />
                        <div className="grid gap-3 md:grid-cols-3">
                          {[
                            ['Competitive', 'For serious players'],
                            ['Casual', 'Play for fun'],
                            ['Semi-Pro', 'For upcoming talents'],
                          ].map(([type, description]) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setClubType(type)}
                              className={cn(
                                'rounded-md border border-white/8 bg-white/[0.045] p-4 text-left transition hover:border-white/18',
                                clubType === type && 'border-[#00d69f]/55 bg-[#00d69f]/10'
                              )}
                            >
                              <p className={cn('text-[14px] font-black', clubType === type ? 'text-[#00d69f]' : 'text-white/78')}>{type}</p>
                              <p className="mt-1 text-[11px] font-semibold text-white/44">{description}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <div>
                          <FieldLabel label="Required Level" />
                          <CreateSelect value={requiredLevel} onChange={setRequiredLevel} options={['1', '5', '10', '15', '20']} />
                        </div>
                        <div>
                          <FieldLabel label="Member Approval" />
                          <div className="flex h-11 items-center gap-3">
                            <CreateToggle checked={manualApproval} onChange={setManualApproval} />
                            <span className="text-[13px] font-semibold text-white/66">Manually approve new members</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-lg border border-white/10 bg-[#071418]/72 p-5">
                    <h3 className="mb-5 text-[15px] font-extrabold uppercase text-[#00d69f]">Club Emblem</h3>

                    <div className="border-t border-white/8 pt-5">
                      <FieldLabel label="Choose Emblem" />
                      <div className="grid grid-cols-[44px_1fr_44px] items-center gap-4 py-7">
                        <button
                          type="button"
                          onClick={() => setEmblemIndex((emblemIndex + emblemStyles.length - 1) % emblemStyles.length)}
                          className="h-11 rounded-md border border-[#00d69f]/18 bg-[#00d69f]/8 text-[24px] text-[#00d69f]"
                        >
                          ‹
                        </button>
                        <ClubLogo style={emblemStyles[emblemIndex]} size="lg" />
                        <button
                          type="button"
                          onClick={() => setEmblemIndex((emblemIndex + 1) % emblemStyles.length)}
                          className="h-11 rounded-md border border-[#00d69f]/18 bg-[#00d69f]/8 text-[24px] text-[#00d69f]"
                        >
                          ›
                        </button>
                      </div>
                      <div className="mb-5 flex justify-center gap-2">
                        {emblemStyles.map((style, index) => (
                          <button
                            key={style}
                            type="button"
                            onClick={() => setEmblemIndex(index)}
                            className={cn('h-2 w-2 rounded-full bg-white/22', index === emblemIndex && 'bg-[#00d69f]')}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-white/8 py-5">
                      <FieldLabel label="Colors" />
                      <div className="space-y-4">
                        <ColorRow label="Primary Color" value={primaryColor} onChange={setPrimaryColor} />
                        <ColorRow label="Secondary Color" value={secondaryColor} onChange={setSecondaryColor} muted />
                      </div>
                    </div>

                    <div className="border-t border-white/8 pt-5">
                      <FieldLabel label="Background" />
                      <div className="grid grid-cols-5 gap-4">
                        {emblemStyles.slice(0, 5).map((style, index) => (
                          <button
                            key={style}
                            type="button"
                            onClick={() => setBackgroundIndex(index)}
                            className={cn(
                              'flex h-20 items-center justify-center rounded-md border border-white/10 bg-white/[0.035] transition hover:border-white/20',
                              backgroundIndex === index && 'border-[#00d69f]/70 shadow-[0_0_18px_rgba(0,214,159,0.22)]'
                            )}
                          >
                            <ClubLogo style={style} size="sm" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </section>
                </div>

                <div className="mt-5 flex justify-end gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('discover')}
                    className="h-11 rounded-md border-white/10 bg-white/[0.06] px-10 font-sans text-[13px] font-black uppercase text-white/72 hover:border-white/20 hover:bg-white/[0.09] hover:shadow-none"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setActiveTab('clubOverview')}
                    className="h-11 rounded-md bg-[#06c994] px-12 font-sans text-[13px] font-black uppercase text-white shadow-[0_0_22px_rgba(6,201,148,0.36)]"
                  >
                    Create Club
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-white/38">{label}</p>
      <p className="mt-2 text-[14px] font-bold text-white/78">{value}</p>
    </div>
  );
}

function ClubPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-lg border border-white/10 bg-[#071418]/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]', className)}>
      {children}
    </section>
  );
}

function ClubSectionTitle({ title, action }: { title: string; action?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="text-[15px] font-extrabold uppercase text-[#00d69f]">{title}</h3>
      {action && <button className="rounded-md bg-white/[0.055] px-4 py-2 text-[12px] font-bold uppercase text-white/68">{action}</button>}
    </div>
  );
}

function ClubDashboard({ activeTab, setActiveTab, onLeave }: { activeTab: ClubTab; setActiveTab: (tab: ClubTab) => void; onLeave: () => void }) {
  return (
    <div>
      <ClubPanel className="mb-4 overflow-hidden">
        <div className="relative grid min-h-[210px] gap-5 p-7 lg:grid-cols-[150px_minmax(240px,1fr)_auto]">
          <div className="absolute inset-y-0 right-0 hidden w-[62%] bg-[linear-gradient(90deg,rgba(2,11,15,0.1),rgba(2,11,15,0.78)),url('/assets/stadium/Польовий майданчик.png')] bg-cover bg-center opacity-80 lg:block" />
          <div className="relative z-10">
            <ClubLogo style="green" size="lg" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <h2 className="text-[30px] font-extrabold text-white">Elite Strikers</h2>
              <span className="h-3 w-3 rounded-full bg-[#00d69f] shadow-[0_0_12px_rgba(0,214,159,0.7)]" />
            </div>
            <p className="mt-3 text-[14px] font-semibold text-white/54">Competitive - Active - Friendly</p>
            <div className="mt-5 flex flex-wrap gap-8 text-[13px] font-bold text-white/54">
              <span>TAG: <b className="text-white/78">ELTS</b></span>
              <span>Region: <b className="text-white/78">Europe</b></span>
            </div>
            <div className="mt-5 grid max-w-[360px] grid-cols-3 gap-5">
              <MiniStat label="Members" value="24/30" />
              <MiniStat label="Total Wins" value="150" />
              <MiniStat label="Level" value="12" />
            </div>
          </div>
          <div className="relative z-10 flex items-start gap-3">
            <Button variant="ghost" size="sm" onClick={() => setActiveTab('clubSettings')} className="h-10 rounded-md border-white/10 bg-white/[0.06] px-5 font-sans text-[13px] font-black normal-case text-white/72 hover:border-white/20 hover:shadow-none">
              Club Settings
            </Button>
            <Button variant="ghost" size="sm" onClick={onLeave} className="h-10 rounded-md border-red-400/25 bg-red-500/10 px-5 font-sans text-[13px] font-black normal-case text-red-300 hover:border-red-300 hover:text-white hover:shadow-none">
              Leave Club
            </Button>
          </div>
        </div>
      </ClubPanel>

      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <ClubPanel className="p-5">
            <div className="flex items-center gap-7">
              <LevelBadge level={12} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-black uppercase text-white/62">Club Level</p>
                <p className="mt-1 text-[22px] font-black text-[#00d69f]">12</p>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[65%] rounded-full bg-[#00d69f] shadow-[0_0_18px_rgba(0,214,159,0.45)]" />
                </div>
              </div>
              <div className="hidden min-w-[160px] md:block">
                <p className="text-[13px] font-black uppercase text-white/62">Level 13 Reward</p>
                <p className="mt-2 text-[16px] font-bold text-white">Epic Club Pack</p>
              </div>
              <ClubLogo style="purple" size="sm" />
            </div>
          </ClubPanel>

          <ClubPanel>
            <div className="grid grid-cols-7 border-b border-white/10 px-5">
              {clubTabs.slice(0, 7).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn('h-14 border-b-2 border-transparent text-[12px] font-black uppercase text-white/50 transition hover:text-white', activeTab === tab.id && 'border-[#00d69f] text-[#00d69f]')}
                >
                  {tab.label.replace('Club ', '')}
                </button>
              ))}
            </div>
          </ClubPanel>

          {activeTab === 'clubOverview' && <ClubOverview />}
          {activeTab === 'clubMembers' && <SimpleClubList title="Members" items={['CaptainAlex - Captain', 'Player_One - Striker', 'GoalMaster - Midfielder', 'EliteKeeper - Goalkeeper']} />}
          {activeTab === 'clubMatches' && <SimpleClubList title="Matches" items={['Elite Strikers 3:1 Thunder Squad', 'Elite Strikers 2:0 Vikings FC', 'Red Devils 1:1 Elite Strikers']} />}
          {activeTab === 'clubTournaments' && <SimpleClubList title="Tournaments" items={['Elite Cup #7 - Registered', 'Weekend League - Qualified', 'City Finals - Pending']} />}
          {activeTab === 'clubStats' && <ClubStatsOnly />}
          {activeTab === 'clubActivity' && <ActivityPanel />}
          {activeTab === 'clubStore' && <SimpleClubList title="Store" items={['XP Boost - Available', 'Club Banner - 500 Coins', 'Epic Club Pack - Locked']} />}
          {activeTab === 'clubSettings' && <SimpleClubList title="Settings" items={['Member Approval: Manual', 'Required Level: 5', 'Club Visibility: Public']} />}
        </div>

        <div className="space-y-4">
          <AnnouncementsPanel />
          <EventsPanel />
        </div>
      </div>
    </div>
  );
}

function ClubOverview() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <AchievementsPanel />
      <ActivityPanel />
      <ClubPanel className="p-5">
        <ClubSectionTitle title="Your Role" />
        <div className="flex items-center gap-5">
          <LevelBadge level={12} />
          <div>
            <p className="text-[16px] font-black text-white">Captain</p>
            <p className="mt-1 text-[13px] text-white/48">Leads the team. Sets the strategy.</p>
          </div>
        </div>
      </ClubPanel>
      <ClubStatsOnly compact />
    </div>
  );
}

function AchievementsPanel() {
  return (
    <ClubPanel className="p-5">
      <ClubSectionTitle title="Club Achievements" action="View All" />
      <div className="grid grid-cols-5 gap-4 text-center">
        {clubAchievements.map(([title, desc, tone]) => (
          <div key={title}>
            <ClubLogo style={tone} size="sm" />
            <p className="mt-3 text-[11px] font-black uppercase text-white/78">{title}</p>
            <p className="mt-2 text-[11px] leading-4 text-white/42">{desc}</p>
          </div>
        ))}
      </div>
    </ClubPanel>
  );
}

function ActivityPanel() {
  return (
    <ClubPanel className="p-5">
      <ClubSectionTitle title="Activity Feed" />
      <div className="space-y-2">
        {activityFeed.map(([name, text, time]) => (
          <div key={`${name}-${time}`} className="grid grid-cols-[36px_1fr_55px] items-center gap-3 rounded-md bg-white/[0.035] p-3">
            <ClubLogo style="green" size="sm" />
            <div>
              <p className="text-[13px] font-black text-white/82">{name}</p>
              <p className="text-[12px] text-white/44">{text}</p>
            </div>
            <span className="text-right text-[11px] font-bold text-white/38">{time}</span>
          </div>
        ))}
      </div>
    </ClubPanel>
  );
}

function ClubStatsOnly({ compact = false }: { compact?: boolean }) {
  return (
    <ClubPanel className="p-5">
      <ClubSectionTitle title={compact ? 'Your Stats' : 'Club Stats'} />
      <div className="grid grid-cols-4 gap-4 text-center">
        {[
          ['Matches Played', '32'],
          ['Goals Scored', '28'],
          ['Assists', '14'],
          ['Win Rate', '75%'],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-[11px] font-bold text-white/42">{label}</p>
            <p className="mt-2 text-[24px] font-black text-white/86">{value}</p>
          </div>
        ))}
      </div>
    </ClubPanel>
  );
}

function AnnouncementsPanel() {
  return (
    <ClubPanel className="p-5">
      <ClubSectionTitle title="Announcements" action="View All" />
      <div className="space-y-2">
        {announcements.map(([title, by, time]) => (
          <div key={title} className="rounded-md bg-white/[0.035] p-3">
            <div className="flex justify-between gap-3">
              <p className="text-[13px] font-bold text-white/78">{title}</p>
              <span className="text-[11px] text-white/36">{time}</span>
            </div>
            <p className="mt-1 text-[11px] text-white/38">{by}</p>
          </div>
        ))}
      </div>
    </ClubPanel>
  );
}

function EventsPanel() {
  return (
    <ClubPanel className="p-5">
      <ClubSectionTitle title="Upcoming Events" action="View All" />
      <div className="space-y-3">
        {events.map(([kind, title, starts, action, style]) => (
          <div key={title} className="grid grid-cols-[76px_1fr_72px] items-center gap-4 rounded-md bg-white/[0.035] p-3">
            <ClubLogo style={style} size="md" />
            <div>
              <p className="text-[12px] font-black uppercase text-[#00d69f]">{kind}</p>
              <p className="text-[15px] font-bold text-white/86">{title}</p>
              <p className="mt-1 text-[12px] text-white/42">Starts in {starts}</p>
            </div>
            <button className="h-9 rounded-md border border-[#00d69f]/35 text-[12px] font-black uppercase text-[#00d69f]">{action}</button>
          </div>
        ))}
      </div>
    </ClubPanel>
  );
}

function SimpleClubList({ title, items }: { title: string; items: string[] }) {
  return (
    <ClubPanel className="p-5">
      <ClubSectionTitle title={title} />
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className="rounded-md bg-white/[0.035] px-4 py-3 text-[14px] font-semibold text-white/72">
            {item}
          </div>
        ))}
      </div>
    </ClubPanel>
  );
}

function ColorRow({
  label,
  value,
  onChange,
  muted = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-32 text-[12px] font-bold text-white/66">{label}</span>
      <div className="flex gap-3">
        {colorChoices.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={cn(
              'h-7 w-7 rounded-full border transition',
              muted && 'opacity-45',
              value === color ? 'border-white shadow-[0_0_0_4px_rgba(0,214,159,0.25)]' : 'border-white/10'
            )}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
}
