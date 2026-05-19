'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export function useRequireAuth() {
  const { accessToken, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!accessToken) router.push('/login');
  }, [accessToken, router]);

  return { accessToken, user, ready: Boolean(accessToken && user) };
}
