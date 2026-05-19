'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginPage() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', formData);
      setAuth(
        { id: 0, username: formData.username, nickname: formData.username, email: '' },
        response.data.access_token,
        response.data.refresh_token
      );
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не вдалося увійти');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-bg min-h-screen overflow-hidden">
      <div className="flex min-h-screen items-stretch justify-center p-0 lg:justify-end">
        <section className="auth-panel flex min-h-screen w-full max-w-none flex-col lg:w-[40vw]">
          <div className="auth-tabs grid grid-cols-2">
            <span className="auth-tab auth-tab-active">Увійти</span>
            <Link href="/register" className="auth-tab text-megaball-cyan">
              Реєстрація
            </Link>
          </div>

          <div className="auth-content flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:px-10 xl:px-12">
            <div className="mb-12 text-center">
              <h1 className="text-5xl font-extrabold uppercase text-megaball-purple text-glow-purple xl:text-6xl">
                Ласкаво просимо
              </h1>
              <p className="mt-4 text-xl font-bold uppercase tracking-wide text-megaball-cyan">
                Увійдіть у свій аккаунт
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <label className="auth-field">
                <span className="auth-field-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
                  </svg>
                </span>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="Email або логін"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </label>

              <label className="auth-field">
                <span className="auth-field-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 9V7A5 5 0 0 0 7 7v2H5v12h14V9h-2Zm-8 0V7a3 3 0 0 1 6 0v2H9Zm4 7.73V18h-2v-1.27a2 2 0 1 1 2 0Z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Пароль"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  className="auth-eye"
                  aria-label={showPassword ? 'Сховати пароль' : 'Показати пароль'}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </label>

              <div className="flex items-center justify-between gap-3 text-lg font-semibold">
                <label className="flex cursor-pointer items-center gap-2 text-white/50">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="auth-checkbox"
                  />
                  Запам'ятати мене
                </label>
                <Link href="/login" className="text-megaball-cyan transition hover:text-white">
                  Забули пароль?
                </Link>
              </div>

              {error && <p className="text-center text-sm font-semibold text-red-300">{error}</p>}

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Входимо...' : 'Увійти'}
              </button>
            </form>

            <div className="my-11 flex items-center gap-6">
              <span className="h-px flex-1 bg-white/15" />
              <span className="text-base font-bold uppercase text-megaball-cyan">
                Або увійти через
              </span>
              <span className="h-px flex-1 bg-white/15" />
            </div>

            <div className="grid grid-cols-3 gap-6">
              <button type="button" className="auth-social auth-apple" aria-label="Apple">
                Apple
              </button>
              <button type="button" className="auth-social auth-google" aria-label="Google">
                G
              </button>
              <button type="button" className="auth-social auth-facebook" aria-label="Facebook">
                Facebook
              </button>
            </div>

            <p className="auth-switch">
              Ще не маєте аккаунта?{' '}
              <Link href="/register">
                Зареєструватись
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
