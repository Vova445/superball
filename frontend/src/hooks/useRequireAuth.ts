'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export function useRequireAuth() {
  const { accessToken, user, hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (hasHydrated && !accessToken) router.push('/login');
  }, [accessToken, hasHydrated, router]);

  return { accessToken, user, ready: Boolean(hasHydrated && accessToken && user) };
}
