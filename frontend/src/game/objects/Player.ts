import Phaser from 'phaser';
import { type ControlBindings } from '@/store/useSettingsStore';

type PlayerTeam = 'home' | 'away';
type PlayBounds = { left: number; right: number; top: number; bottom: number };

export const PLAYER_RING_RADIUS = 22;

const KARIUS_BRONZE_GK = {
    acceleration: 1650,
    maxSpeedNormal: 235,
    maxSpeedSprint: 350,
    kickForce: 170,
    ringRadius: PLAYER_RING_RADIUS,
    cardWidth: 54,
    cardHeight: 64,
};

const MIN_FACING_SPEED = 8;
const FACING_TURN_DURATION = 160;

export class Player extends Phaser.Physics.Arcade.Sprite {
    private acceleration: number = KARIUS_BRONZE_GK.acceleration;
    private friction: number = 0.95;
    private maxSpeedNormal: number = KARIUS_BRONZE_GK.maxSpeedNormal;
    private maxSpeedSprint: number = KARIUS_BRONZE_GK.maxSpeedSprint;
    
    public stamina: number = 100;
    public kickForce: number = KARIUS_BRONZE_GK.kickForce;
    private maxStamina: number = 100;
    private staminaConsumption: number = 40;
    private staminaRecovery: number = 20;
    private playBounds?: PlayBounds;
    private baseScaleX: number = 1;
    private facingSign: 1 | -1 = 1;
    private facingTween?: Phaser.Tweens.Tween;

    private teamRing: Phaser.GameObjects.Arc;

    constructor(scene: Phaser.Scene, x: number, y: number, team: PlayerTeam = 'home') {
        super(scene, x, y, 'karius_card');

        const teamColor = team === 'home' ? 0x00a8ff : 0xff3b5f;
        this.teamRing = scene.add.circle(x, y, KARIUS_BRONZE_GK.ringRadius, teamColor, 0.88);
        this.teamRing.setStrokeStyle(4, 0xffffff, 0.95);
        this.teamRing.setDepth(8);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setDisplaySize(KARIUS_BRONZE_GK.cardWidth, KARIUS_BRONZE_GK.cardHeight);
        this.baseScaleX = Math.abs(this.scaleX);
        this.setDepth(9);
        const bodyRadius = KARIUS_BRONZE_GK.ringRadius / Math.abs(this.scaleX);
        const bodyDiameter = bodyRadius * 2;
        this.setCircle(
            bodyRadius,
            (this.width - bodyDiameter) / 2,
            (this.height - bodyDiameter) / 2
        );
        this.setCollideWorldBounds(true);
        
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setDamping(true);
        body.setDrag(0.1);
        body.setMass(1);
    }

    preUpdate(time: number, delta: number) {
        super.preUpdate(time, delta);
        this.teamRing.setPosition(this.x, this.y);
        this.teamRing.setAlpha(this.alpha * 0.95);
    }

    update(
        keys: Record<keyof Pick<ControlBindings, 'up' | 'down' | 'left' | 'right' | 'sprint' | 'shoot'>, Phaser.Input.Keyboard.Key>,
        delta: number
    ) {
        const inputs = {
            up: keys.up.isDown,
            down: keys.down.isDown,
            left: keys.left.isDown,
            right: keys.right.isDown,
            sprint: keys.sprint.isDown,
            kick: Phaser.Input.Keyboard.JustDown(keys.shoot),
        };

        this.simulate(inputs, delta / 1000);
        return inputs;
    }

    public simulate(inputs: any, dt: number) {
        const body = this.body as Phaser.Physics.Arcade.Body;
        const isSprinting = inputs.sprint && this.stamina > 0;
        const currentMaxSpeed = isSprinting ? this.maxSpeedSprint : this.maxSpeedNormal;

        let dx = 0, dy = 0;
        if (inputs.left) dx -= 1;
        if (inputs.right) dx += 1;
        if (inputs.up) dy -= 1;
        if (inputs.down) dy += 1;

        if (dx !== 0 || dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            body.velocity.x += (dx / length) * this.acceleration * dt;
            body.velocity.y += (dy / length) * this.acceleration * dt;
        }

        body.velocity.x *= Math.pow(this.friction, dt * 60);
        body.velocity.y *= Math.pow(this.friction, dt * 60);

        const speed = body.velocity.length();
        if (speed > currentMaxSpeed) {
            body.velocity.normalize().scale(currentMaxSpeed);
        }

        if (isSprinting && (dx !== 0 || dy !== 0)) {
            this.stamina = Math.max(0, this.stamina - this.staminaConsumption * dt);
        } else {
            this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRecovery * dt);
        }

        this.clampToPlayBounds();
        this.faceDirection(body.velocity.x, body.velocity.y, dt);
    }

    public faceDirection(dx: number, _dy: number, _dt: number) {
        if (Math.abs(dx) < MIN_FACING_SPEED) return;

        const targetSign = dx > 0 ? 1 : -1;
        if (targetSign === this.facingSign) return;

        this.facingSign = targetSign;
        this.facingTween?.stop();
        this.facingTween = this.scene.tweens.add({
            targets: this,
            scaleX: this.baseScaleX * targetSign,
            duration: FACING_TURN_DURATION,
            ease: 'Sine.easeInOut',
        });
    }

    public setPlayBounds(bounds: PlayBounds) {
        this.playBounds = bounds;
        this.clampToPlayBounds();
    }

    public clampToPlayBounds() {
        if (!this.playBounds) return;

        const body = this.body as Phaser.Physics.Arcade.Body | null;
        const nextX = Phaser.Math.Clamp(
            this.x,
            this.playBounds.left + KARIUS_BRONZE_GK.ringRadius,
            this.playBounds.right - KARIUS_BRONZE_GK.ringRadius
        );
        const nextY = Phaser.Math.Clamp(
            this.y,
            this.playBounds.top + KARIUS_BRONZE_GK.ringRadius,
            this.playBounds.bottom - KARIUS_BRONZE_GK.ringRadius
        );

        if (nextX !== this.x && body) body.velocity.x = 0;
        if (nextY !== this.y && body) body.velocity.y = 0;
        this.setPosition(nextX, nextY);
    }

    destroy(fromScene?: boolean) {
        this.facingTween?.stop();
        this.teamRing.destroy(fromScene);
        super.destroy(fromScene);
    }
}
