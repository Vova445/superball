import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';

export const GAME_WIDTH = 1200;
export const GAME_HEIGHT = 700;

export const gameConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO, // Дозволяємо системі обрати WebGL або Canvas
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#0D0D1A',
    render: {
        antialias: false,        // Вимикаємо для швидкості
        pixelArt: true,          // Вимикаємо фільтрацію для продуктивності
        desynchronized: true,    // Зменшує затримку введення
        powerPreference: 'high-performance'
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
            fixedStep: false // Вимикаємо slow-mo ефект при падінні FPS
        }
    },
    fps: {
        min: 10,
        target: 60
    },
    scene: [GameScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};
