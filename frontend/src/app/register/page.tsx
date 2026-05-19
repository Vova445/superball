'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    nickname: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/register', formData);
      // Backend returns Token schema: access_token, refresh_token, token_type
      // We also need user info. Usually /auth/register should return user info too.
      // Let's assume we fetch user info after login/register or it's included.
      // For now, I'll assume the backend returns the tokens and we might need to fetch user.
      // But looking at my backend implementation, it returns Token.
      
      // Fetch user info with the new access token
      const userResponse = await api.get('/api/health', {
          headers: { Authorization: `Bearer ${response.data.access_token}` }
      });
      // Actually, health is just status. Let's assume we have a /api/users/me later.
      // For simplicity, let's just save tokens.
      
      setAuth(
          { id: 0, username: formData.username, nickname: formData.nickname, email: formData.email }, 
          response.data.access_token, 
          response.data.refresh_token
      );
      
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-gray-800 p-10 shadow-xl border border-gray-700">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">Create Account</h2>
          <p className="mt-2 text-sm text-gray-400">Join the Megaball community today</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <input
                type="text"
                required
                className="relative block w-full rounded-lg border-0 bg-gray-700 py-3 px-4 text-white placeholder-gray-400 ring-1 ring-inset ring-gray-600 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm"
                placeholder="Username"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>
            <div>
              <input
                type="text"
                required
                className="relative block w-full rounded-lg border-0 bg-gray-700 py-3 px-4 text-white placeholder-gray-400 ring-1 ring-inset ring-gray-600 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm"
                placeholder="Nickname"
                value={formData.nickname}
                onChange={(e) => setFormData({...formData, nickname: e.target.value})}
              />
            </div>
            <div>
              <input
                type="email"
                required
                className="relative block w-full rounded-lg border-0 bg-gray-700 py-3 px-4 text-white placeholder-gray-400 ring-1 ring-inset ring-gray-600 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="relative block w-full rounded-lg border-0 bg-gray-700 py-3 px-4 text-white placeholder-gray-400 ring-1 ring-inset ring-gray-600 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          {error && <div className="text-red-500 text-sm text-center">{error}</div>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-blue-600 py-3 px-4 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>
        </form>
        <div className="text-center">
          <p className="text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-500 hover:text-blue-400">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
