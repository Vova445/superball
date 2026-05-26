'use client';

import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { gameConfig } from '../../game/config';
import MatchHUD from './MatchHUD';
import { cn } from '@/lib/cn';
import { qualityToRenderConfig, useSettingsStore, vsyncToFpsConfig } from '@/store/useSettingsStore';

export default function GameContainer() {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Phaser.Game | null>(null);
    const displayMode = useSettingsStore((state) => state.displayMode);
    const quality = useSettingsStore((state) => state.quality);
    const vsync = useSettingsStore((state) => state.vsync);
    const motionBlur = useSettingsStore((state) => state.motionBlur);
    const syncFullscreenExit = useSettingsStore((state) => state.syncFullscreenExit);
    const [motionActive, setMotionActive] = useState(false);

    useEffect(() => {
        if (!gameContainerRef.current) return;

        const game = new Phaser.Game({
            ...gameConfig,
            render: {
                ...(gameConfig.render || {}),
                ...qualityToRenderConfig(quality),
            },
            fps: {
                ...(gameConfig.fps || {}),
                ...vsyncToFpsConfig(vsync),
            },
            parent: gameContainerRef.current
        });
        
        gameRef.current = game;

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, [quality, vsync]);

    useEffect(() => {
        if (displayMode === 'Fullscreen') {
            if (document.fullscreenElement) {
                return;
            }

            if (!document.documentElement.requestFullscreen) {
                syncFullscreenExit();
                return;
            }

            document.documentElement.requestFullscreen().catch(() => {
                syncFullscreenExit();
            });
            return;
        }

        if (document.fullscreenElement) {
            document.exitFullscreen?.().catch(() => undefined);
        }
    }, [displayMode, syncFullscreenExit]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                syncFullscreenExit();
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [syncFullscreenExit]);

    useEffect(() => {
        const handleMotionBlur = (event: Event) => {
            const detail = (event as CustomEvent<{ active?: boolean }>).detail;
            setMotionActive(Boolean(detail?.active));
        };

        window.addEventListener('megaball:motion-blur', handleMotionBlur);
        return () => window.removeEventListener('megaball:motion-blur', handleMotionBlur);
    }, []);

    const isWindowed = displayMode === 'Windowed';
    const gameStyle = {
        filter: motionBlur && motionActive ? 'blur(1.35px)' : 'none',
        transition: motionBlur ? 'filter 90ms linear' : 'none',
        ...(isWindowed
            ? {
                aspectRatio: '12 / 7',
                width: 'min(1200px, calc(100vw - 48px), calc((100vh - 48px) * 12 / 7))',
            }
            : {}),
    };

    return (
        <div
            className={cn(
                'fixed inset-0 bg-megaball-dark overflow-hidden',
                isWindowed ? 'flex items-center justify-center p-6' : 'h-full w-full'
            )}
        >
            <div
                ref={gameContainerRef}
                className={cn(
                    'phaser-game overflow-hidden',
                    isWindowed
                        ? 'rounded-lg border border-white/12 shadow-[0_24px_90px_rgba(0,0,0,0.55)]'
                        : 'h-full w-full'
                )}
                style={gameStyle}
            />
            <MatchHUD />
        </div>
    );
}
