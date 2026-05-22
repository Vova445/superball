'use client';

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { gameConfig } from '../../game/config';
import MatchHUD from './MatchHUD';

export default function GameContainer() {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (!gameContainerRef.current || gameRef.current) return;

        // Initialize game with external config
        const game = new Phaser.Game({
            ...gameConfig,
            parent: gameContainerRef.current
        });
        
        gameRef.current = game;

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []);

    return (
        <div className="fixed inset-0 w-full h-full bg-megaball-dark overflow-hidden">
            <div ref={gameContainerRef} className="phaser-game h-full w-full" />
            <MatchHUD homeScore={2} awayScore={1} initialSeconds={165} />
        </div>
    );
}
