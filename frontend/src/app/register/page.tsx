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
      const response = await api.post('/auth/register', formData);
      setAuth(
        { id: 0, username: formData.username, nickname: formData.nickname, email: formData.email, mmr: 0 },
        response.data.access_token,
        response.data.refresh_token
      );
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не вдалося зареєструватися');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-bg min-h-screen overflow-hidden">
      <div className="flex min-h-screen items-stretch justify-center p-0 lg:justify-end">
        <section className="auth-panel flex min-h-screen w-full max-w-none flex-col lg:w-[40vw]">
          <div className="auth-tabs grid grid-cols-2">
            <Link href="/login" className="auth-tab text-white/70">
              Увійти
            </Link>
            <span className="auth-tab auth-tab-active text-megaball-cyan">Реєстрація</span>
          </div>

          <div className="auth-content flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 sm:py-11 lg:px-10 xl:px-12">
            <div className="mb-10 text-center">
              <h1 className="text-5xl font-extrabold uppercase text-megaball-purple text-glow-purple xl:text-6xl">
                Створити аккаунт
              </h1>
              <p className="mt-4 text-xl font-bold uppercase tracking-wide text-megaball-cyan">
                Приєднуйтесь до MEGABOL
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
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
                  placeholder="Логін"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </label>

              <label className="auth-field">
                <span className="auth-field-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3h-2v2h-2V3H9v2H7V3H5v18h14V3Zm-2 16H7V7h10v12Zm-2-8H9v2h6v-2Zm0 4H9v2h6v-2Z" />
                  </svg>
                </span>
                <input
                  type="text"
                  required
                  placeholder="Нікнейм"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                />
              </label>

              <label className="auth-field">
                <span className="auth-field-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5L4 8V6l8 5 8-5v2Z" />
                  </svg>
                </span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  autoComplete="new-password"
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

              {error && <p className="text-center text-sm font-semibold text-red-300">{error}</p>}

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Створюємо...' : 'Зареєструватись'}
              </button>
            </form>

            <div className="my-10 flex items-center gap-6">
              <span className="h-px flex-1 bg-white/15" />
              <span className="text-base font-bold uppercase text-megaball-cyan">
                Або через
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
              Вже маєте аккаунт?{' '}
              <Link href="/login">
                Увійти
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
