'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

// Dynamic import with SSR disabled
const GameContainer = dynamic(() => import('@/components/Game/GameContainer'), {
    ssr: false,
    loading: () => (
        <div className="arcade-bg flex h-screen w-full items-center justify-center text-white">
            <div className="text-center">
                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-megaball-cyan border-t-transparent mx-auto"></div>
                <p className="arcade-heading text-xl text-megaball-cyan text-glow-cyan">Loading Arena...</p>
            </div>
        </div>
    )
});

export default function GamePage() {
    const { accessToken, hasHydrated } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (hasHydrated && !accessToken) {
            router.push('/login');
        }
    }, [accessToken, hasHydrated, router]);

    if (!hasHydrated || !accessToken) {
        return null;
    }

    return (
        <Suspense fallback={null}>
            <GameContainer />
        </Suspense>
    );
}
