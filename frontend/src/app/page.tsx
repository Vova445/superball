'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export default function HomePage() {
  const { user, logout, accessToken } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!accessToken) {
      router.push('/login');
    }
  }, [accessToken, router]);

  if (!accessToken || !user) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-700 bg-gray-800/60 pb-6 pt-8 backdrop-blur-2xl lg:static lg:w-auto lg:rounded-xl lg:border lg:p-4">
          Welcome to&nbsp;
          <code className="font-bold text-blue-500">Megaball</code>
        </p>
        <button 
          onClick={() => {
            logout();
            router.push('/login');
          }}
          className="rounded-lg bg-red-600 px-4 py-2 hover:bg-red-500 transition-colors"
        >
          Logout
        </button>
      </div>

      <div className="mt-20 text-center">
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          Hello, {user.nickname}!
        </h1>
        <p className="text-xl text-gray-400">
          You are successfully authenticated. Ready for the match?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16 max-w-4xl w-full">
        <div 
          onClick={() => router.push('/game')}
          className="bg-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-blue-500 transition-all cursor-pointer group"
        >
          <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-500">Play Game</h3>
          <p className="text-gray-400">Jump into a quick match with other players online.</p>
        </div>
        <div 
          id="profile-card"
          onClick={() => router.push('/profile')}
          className="bg-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-purple-500 transition-all cursor-pointer group"
        >
          <h3 className="text-2xl font-bold mb-2 group-hover:text-purple-500">Profile</h3>
          <p className="text-gray-400">View your stats, achievements and edit your character.</p>
        </div>

      </div>
    </main>
  );
}
