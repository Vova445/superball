import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
    private acceleration: number = 2000;
    private friction: number = 0.95;
    private maxSpeedNormal: number = 300;
    private maxSpeedSprint: number = 480;
    
    public stamina: number = 100;
    private maxStamina: number = 100;
    private staminaConsumption: number = 40;
    private staminaRecovery: number = 20;

    // Dash System
    private dashSpeed: number = 600;
    private dashCooldown: number = 1500; // ms
    private lastDashTime: number = 0;
    private dashDuration: number = 150; // ms
    public isDashing: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'player_texture');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCircle(20);
        this.setCollideWorldBounds(true);
        
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setDamping(true);
        body.setDrag(0.1);
        body.setMass(1); // Set mass for collisions
    }

    update(cursors: Phaser.Types.Input.Keyboard.CursorKeys, shiftKey: Phaser.Input.Keyboard.Key, spaceKey: Phaser.Input.Keyboard.Key, time: number, delta: number) {
        // Collect Input
        const inputs = {
            up: cursors.up.isDown,
            down: cursors.down.isDown,
            left: cursors.left.isDown,
            right: cursors.right.isDown,
            sprint: shiftKey.isDown,
            dash: Phaser.Input.Keyboard.JustDown(spaceKey)
        };

        // Current time for dash cooldowns locally
        this.simulate(inputs, delta / 1000, time);
        return inputs;
    }

    public simulate(inputs: any, dt: number, time: number = 0) {
        const body = this.body as Phaser.Physics.Arcade.Body;

        // 1. Dash
        if (inputs.dash && time > this.lastDashTime + this.dashCooldown) {
            this.executeDash(time);
        }

        if (this.isDashing) {
            if (time > this.lastDashTime + this.dashDuration) {
                this.isDashing = false;
                this.setAlpha(1);
            } else {
                return; 
            }
        }

        // 2. Normal Movement
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

        // 3. Friction & Speed Cap
        body.velocity.x *= Math.pow(this.friction, dt * 60);
        body.velocity.y *= Math.pow(this.friction, dt * 60);

        const speed = body.velocity.length();
        if (speed > currentMaxSpeed) {
            body.velocity.normalize().scale(currentMaxSpeed);
        }

        // 4. Stamina
        if (isSprinting && (dx !== 0 || dy !== 0)) {
            this.stamina = Math.max(0, this.stamina - this.staminaConsumption * dt);
        } else {
            this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRecovery * dt);
        }
    }

    private executeDash(time: number) {
        const body = this.body as Phaser.Physics.Arcade.Body;
        
        // Dash in the direction of current velocity or facing direction
        let dashDir = new Phaser.Math.Vector2(body.velocity.x, body.velocity.y).normalize();
        
        // If standing still, dash forward (default right)
        if (dashDir.length() === 0) dashDir.set(1, 0);

        body.velocity.x = dashDir.x * this.dashSpeed;
        body.velocity.y = dashDir.y * this.dashSpeed;

        this.isDashing = true;
        this.lastDashTime = time;
        this.setAlpha(0.6); // Visual effect
    }

    public getDashProgress(time: number): number {
        const elapsed = time - this.lastDashTime;
        return Math.min(1, elapsed / this.dashCooldown);
    }
}
