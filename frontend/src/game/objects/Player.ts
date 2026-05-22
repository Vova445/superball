import Phaser from 'phaser';

type PlayerTeam = 'home' | 'away';

const KARIUS_BRONZE_GK = {
    acceleration: 1650,
    maxSpeedNormal: 235,
    maxSpeedSprint: 350,
    kickForce: 170,
    ringRadius: 42,
    cardWidth: 76,
    cardHeight: 88,
    hitboxWidth: 46,
    hitboxHeight: 52,
};

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
        this.setDepth(9);
        this.setSize(KARIUS_BRONZE_GK.hitboxWidth, KARIUS_BRONZE_GK.hitboxHeight);
        this.setOffset(
            (this.width - KARIUS_BRONZE_GK.hitboxWidth) / 2,
            (this.height - KARIUS_BRONZE_GK.hitboxHeight) / 2
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
        cursors: Phaser.Types.Input.Keyboard.CursorKeys,
        shiftKey: Phaser.Input.Keyboard.Key,
        spaceKey: Phaser.Input.Keyboard.Key,
        delta: number
    ) {
        const inputs = {
            up: cursors.up.isDown,
            down: cursors.down.isDown,
            left: cursors.left.isDown,
            right: cursors.right.isDown,
            sprint: shiftKey.isDown,
            kick: Phaser.Input.Keyboard.JustDown(spaceKey),
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
    }

    destroy(fromScene?: boolean) {
        this.teamRing.destroy(fromScene);
        super.destroy(fromScene);
    }
}
