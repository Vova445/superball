'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

// Dynamic import with SSR disabled
const GameContainer = dynamic(() => import('@/components/Game/GameContainer'), {
    ssr: false,
    loading: () => (
        <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white">
            <div className="text-center">
                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
                <p className="text-xl font-bold">Loading Arena...</p>
            </div>
        </div>
    )
});

export default function GamePage() {
    const { accessToken } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!accessToken) {
            router.push('/login');
        }
    }, [accessToken, router]);

    if (!accessToken) {
        return null;
    }

    return (
        <Suspense fallback={null}>
            <GameContainer />
        </Suspense>
    );
}
