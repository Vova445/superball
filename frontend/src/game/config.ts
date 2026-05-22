import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';

export const GAME_WIDTH = 1200;
export const GAME_HEIGHT = 700;

export const gameConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#0D0D1A',
    render: {
        antialias: true,
        antialiasGL: true,
        pixelArt: false,
        roundPixels: false,
        desynchronized: true,
        powerPreference: 'high-performance'
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
            fixedStep: false
        }
    },
    fps: {
        min: 10,
        target: 60
    },
    scene: [GameScene],
    scale: {
        mode: Phaser.Scale.ENVELOP,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};
