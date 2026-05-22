'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="auth-bg min-h-screen overflow-hidden">
      <div className="flex min-h-screen items-stretch justify-center p-0 lg:justify-end">
        <section className="auth-panel flex min-h-screen w-full max-w-none flex-col lg:w-[40vw]">
          <div className="auth-tabs grid grid-cols-2">
            <Link href="/login" className="auth-tab text-megaball-cyan">
              Увійти
            </Link>
            <Link href="/register" className="auth-tab text-megaball-cyan">
              Реєстрація
            </Link>
          </div>

          <div className="auth-content flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:px-10 xl:px-12">
            <div className="mb-12 text-center">
              <h1 className="text-5xl font-extrabold uppercase text-megaball-purple text-glow-purple xl:text-6xl">
                Забули пароль?
              </h1>
              <p className="mt-4 text-xl font-bold uppercase tracking-wide text-megaball-cyan">
                Введіть email для відновлення
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
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
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setSubmitted(false);
                  }}
                />
              </label>

              {submitted && (
                <p className="rounded-md border border-megaball-cyan/30 bg-megaball-cyan/10 px-4 py-3 text-center text-base font-semibold text-megaball-cyan">
                  Якщо аккаунт існує, ми надішлемо інструкції на email.
                </p>
              )}

              <button type="submit" className="auth-submit">
                Відновити
              </button>
            </form>

            <p className="auth-switch">
              Згадали пароль? <Link href="/login">Увійти</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
