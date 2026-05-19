'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';

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

export default function ProfilePage() {
  const { accessToken } = useAuthStore();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken) {
      router.push('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await api.get('/api/profile');
        setProfile(response.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [accessToken, router]);

  if (!accessToken) {
    return null;
  }

  const getRankName = (mmr: number) => {
    if (mmr < 1000) return 'Bronze';
    if (mmr < 1500) return 'Silver';
    if (mmr < 2000) return 'Gold';
    return 'Platinum';
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Bronze': return 'from-orange-500 to-amber-700';
      case 'Silver': return 'from-slate-400 to-slate-600';
      case 'Gold': return 'from-yellow-400 to-amber-500';
      default: return 'from-cyan-400 to-blue-500';
    }
  };

  const rank = profile ? getRankName(profile.mmr) : 'Bronze';
  const xpPercentage = profile ? Math.min(100, (profile.xp / profile.xp_needed) * 100) : 0;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white p-6 md:p-24 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[120px]" />

      <div className="z-10 w-full max-w-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
        {/* Back Button */}
        <button
          id="back-home-button"
          onClick={() => router.push('/')}
          className="absolute left-6 top-6 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors duration-200 group"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform duration-200"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Lobby
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <p className="text-slate-400 text-lg">Fetching career stats...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-500 font-semibold text-lg mb-4">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
            >
              Return Home
            </button>
          </div>
        ) : profile ? (
          <div className="mt-8">
            {/* Header / Avatar info */}
            <div className="flex flex-col md:flex-row items-center gap-6 border-b border-slate-800/80 pb-8 mb-8">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-4xl shadow-lg relative group">
                {profile.nickname.substring(0, 2).toUpperCase()}
                <div className="absolute -bottom-2 -right-2 bg-blue-500 text-xs px-2 py-0.5 rounded-full font-bold shadow">
                  Lv. {profile.level}
                </div>
              </div>
              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  {profile.nickname}
                </h1>
                <p className="text-slate-400 text-sm mt-1">{profile.email}</p>
                <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${getRankColor(rank)} text-white shadow-sm`}>
                    {rank}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                    MMR: {profile.mmr}
                  </span>
                </div>
              </div>
            </div>

            {/* Level & XP Progression */}
            <div className="mb-8">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-lg font-bold text-slate-200">Level Progression</span>
                <span className="text-xs text-slate-400 font-mono">
                  {profile.xp} / {profile.xp_needed} XP
                </span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-4 p-0.5 overflow-hidden border border-slate-800/60 shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${xpPercentage}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2 text-right">
                Total Experience Earned: {profile.total_xp} XP
              </p>
            </div>

            {/* Currency & Rewards Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/60 border border-slate-800/50 p-6 rounded-2xl flex flex-col items-center justify-center hover:border-yellow-500/30 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
                  <span className="text-2xl">🪙</span>
                </div>
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Coins</span>
                <span className="text-2xl font-black text-yellow-400 mt-1 font-mono">{profile.coins}</span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/50 p-6 rounded-2xl flex flex-col items-center justify-center hover:border-cyan-500/30 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
                  <span className="text-2xl">💎</span>
                </div>
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Gems</span>
                <span className="text-2xl font-black text-cyan-400 mt-1 font-mono">{profile.gems}</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
