import Phaser from 'phaser';

export const BALL_RADIUS = 13;

export class Ball extends Phaser.Physics.Arcade.Sprite {
    private friction: number = 0.985;
    private wallBounce: number = 0.75;
    private maxSpeed: number = 800;
    public angularVelocity: number = 0;
    private spinFactor: number = 0.02;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'ball');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setDisplaySize(BALL_RADIUS * 2, BALL_RADIUS * 2);
        this.setDepth(10);
        this.setCircle(BALL_RADIUS);
        
        // Disable physics body to prevent local prediction/simulation
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.enable = false;
        }
    }

    public kick(direction: Phaser.Math.Vector2, force: number, playerVelocity: Phaser.Math.Vector2) {
        const body = this.body as Phaser.Physics.Arcade.Body;
        
        // ballV = force * direction + playerV * 0.4
        body.velocity.x = direction.x * force + playerVelocity.x * 0.4;
        body.velocity.y = direction.y * force + playerVelocity.y * 0.4;

        // Apply spin based on player movement offset (simplified for now)
        this.angularVelocity = (playerVelocity.x - body.velocity.x) * 0.5;
    }

    update(delta: number) {
        const body = this.body as Phaser.Physics.Arcade.Body;
        const dt = delta / 1000;

        // 1. Manual Friction (60 TPS equivalent)
        const frictionFactor = Math.pow(this.friction, dt * 60);
        body.velocity.x *= frictionFactor;
        body.velocity.y *= frictionFactor;

        // 2. Apply Spin trajectory effect
        // vx += angularVelocity * 0.02 (as requested)
        body.velocity.x += this.angularVelocity * this.spinFactor;
        
        // Gradually reduce angular velocity too
        this.angularVelocity *= 0.98;

        // 3. Cap Max Speed
        const speed = body.velocity.length();
        if (speed > this.maxSpeed) {
            body.velocity.normalize().scale(this.maxSpeed);
        }

        // 4. Rotation animation based on velocity
        this.angle += this.angularVelocity * dt * 5 + speed * dt * 0.5;
    }
}
