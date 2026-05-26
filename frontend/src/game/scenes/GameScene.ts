import Phaser from 'phaser';
import { Player, PLAYER_RING_RADIUS } from '../objects/Player';
import { Ball, BALL_RADIUS } from '../objects/Ball';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/useAuthStore';
import { type ControlBindings, normalizeQuality, regionToRoomSlug, useSettingsStore } from '@/store/useSettingsStore';
import { getArenaById, getArenaForCups } from '../arenas';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export class GameScene extends Phaser.Scene {
    private player!: Player;
    private ball!: Ball;
    private controlKeys!: Record<keyof Pick<ControlBindings, 'up' | 'down' | 'left' | 'right' | 'sprint' | 'shoot'>, Phaser.Input.Keyboard.Key>;
    private staminaBar!: Phaser.GameObjects.Graphics;
    private score = { home: 0, away: 0 };
    private scoreText!: Phaser.GameObjects.Text;
    private goalText!: Phaser.GameObjects.Text;
    private countdownText!: Phaser.GameObjects.Text;
    private timerText!: Phaser.GameObjects.Text;
    private statusText!: Phaser.GameObjects.Text;
    private rewardText!: Phaser.GameObjects.Text;
    private isResetting: boolean = false;
    private isGameStarted: boolean = false;
    private fpsText!: Phaser.GameObjects.Text;
    private lastFpsUpdate: number = 0;

    // Multiplayer / Interpolation properties
    private socket!: Socket;
    private stateBuffer: any[] = [];
    private serverTimeOffset: number | null = null;
    private opponents: Map<string, Player> = new Map();
    private targetBallX: number | undefined;
    private targetBallY: number | undefined;
    private arenaId = 'village-field';
    private roomId = 'game-room-europe';
    private playBounds = { left: 160, right: 1037, top: 68, bottom: 634 };
    private lastMoveDirection = new Phaser.Math.Vector2(1, 0);
    private matchState: string = 'LOBBY';
    private matchTimer: number = 180;
    private rewardInfo: any = null;
    private playerCount: number = 1;
    private lastMotionBlurActive = false;
    private lastMotionBlurDispatch = 0;

    constructor() {
        super('GameScene');
    }

    preload() {
        const arenaId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('arena') : null;
        const roomId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('room') : null;
        const region = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('region') : null;
        const userMmr = useAuthStore.getState().user?.mmr ?? 0;
        const arena = getArenaById(arenaId) ?? getArenaForCups(userMmr);

        this.arenaId = arena.id;
        this.roomId = roomId || `game-room-${regionToRoomSlug(region ?? useSettingsStore.getState().region)}`;
        this.playBounds = arena.playBounds;
        this.load.image('field', arena.image);
        this.load.image('karius_card', '/assets/players/karius.png');
        this.load.svg('ball', '/assets/ball.svg');
    }

    create() {
        const { width, height } = this.scale;
        this.isResetting = false;
        this.isGameStarted = false;

        this.physics.world.setBounds(0, 0, width, height);
        this.cameras.main.setBounds(0, 0, width, height);
        this.cameras.main.setBackgroundColor('#0D0D1A');
        this.cameras.main.setRoundPixels(false);
        const textureFilter = normalizeQuality(useSettingsStore.getState().quality) === 'Low'
            ? Phaser.Textures.FilterMode.NEAREST
            : Phaser.Textures.FilterMode.LINEAR;
        this.textures.get('field').setFilter(textureFilter);
        this.textures.get('karius_card').setFilter(textureFilter);
        this.textures.get('ball').setFilter(textureFilter);

        this.generateTextures();

        const field = this.add.image(width / 2, height / 2, 'field');
        field.setScale(width / field.width, height / field.height);

        // Initialize entities
        this.player = new Player(this, width / 2 - 200, height / 2);
        this.player.setPlayBounds(this.playBounds);
        this.ball = new Ball(this, width / 2, height / 2);
        
        (this.ball.body as Phaser.Physics.Arcade.Body).setMass(0.2); 
        
        this.controlKeys = this.createControlKeys();

        // Custom Physics Walls (collides with local player only)
        this.createCustomWalls(width, height);
        
        this.initUI();

        // Connect to the multiplayer server
        this.connectSocket();

        // Register pointer down event for kicking the ball
        this.input.on('pointerdown', () => {
            this.tryKickBall();
        });

        // Event listeners for cleanup
        this.events.on('shutdown', () => {
            if (this.socket) this.socket.disconnect();
        });
        this.events.on('destroy', () => {
            if (this.socket) this.socket.disconnect();
        });
    }

    private connectSocket() {
        const token = useAuthStore.getState().accessToken;

        this.socket = io(SOCKET_URL, {
            auth: { token: token },
            transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
            console.log('Phaser connected to Socket.IO. SID:', this.socket.id);
            this.socket.emit('join_room', { room: this.roomId, arena: this.arenaId });
        });

        this.socket.on('game_state', (payload: any) => {
            this.handleGameState(payload);
        });

        this.socket.on('connect_error', (err) => {
            console.error('Socket connection error in Phaser:', err);
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected in Phaser');
        });
    }

    private createControlKeys() {
        const controls = useSettingsStore.getState().controls;
        const keyboard = this.input.keyboard!;

        return {
            up: keyboard.addKey(controls.up.keyCode),
            down: keyboard.addKey(controls.down.keyCode),
            left: keyboard.addKey(controls.left.keyCode),
            right: keyboard.addKey(controls.right.keyCode),
            sprint: keyboard.addKey(controls.sprint.keyCode),
            shoot: keyboard.addKey(controls.shoot.keyCode),
        };
    }

    private handleGameState(payload: any) {
        if (!payload) return;
        this.playerCount = payload.player_count ?? Object.keys(payload.players || {}).length;

        if (payload.ball) {
            this.targetBallX = payload.ball.x;
            this.targetBallY = payload.ball.y;
        }

        if (!payload.players) return;

        // Initialize rendering once the first state is received
        if (!this.isGameStarted) {
            this.isGameStarted = true;
            this.cameras.main.zoomTo(1.9, 1000, 'Power2');
            this.cameras.main.startFollow(this.player, false, 0.1, 0.1);
        }

        // Calculate and smooth clock offset
        const currentOffset = Date.now() - payload.timestamp;
        if (this.serverTimeOffset === null) {
            this.serverTimeOffset = currentOffset;
        } else {
            // Low-pass filter to smooth out jitter
            this.serverTimeOffset = this.serverTimeOffset * 0.9 + currentOffset * 0.1;
        }

        // Add state to buffer
        this.stateBuffer.push({
            timestamp: payload.timestamp,
            players: payload.players,
            ball: payload.ball
        });

        // Maintain buffer size (2 seconds of ticks at 60 TPS)
        if (this.stateBuffer.length > 120) {
            this.stateBuffer.shift();
        }

        // Server Reconciliation for Local Player
        const selfState = payload.players[this.socket.id];
        if (selfState) {
            if (typeof selfState.stamina === 'number') {
                this.player.stamina = selfState.stamina;
            }

            const dx = this.player.x - selfState.x;
            const dy = this.player.y - selfState.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 150) {
                // Hard reset if discrepancy is too high
                this.player.setPosition(selfState.x, selfState.y);
            } else if (dist > 4) {
                // Soft linear correction
                this.player.x = this.lerp(this.player.x, selfState.x, 0.15);
                this.player.y = this.lerp(this.player.y, selfState.y, 0.15);
            }
        }

        // Synchronize score and trigger goal visual effects
        if (payload.score) {
            if (payload.score.home !== this.score.home || payload.score.away !== this.score.away) {
                const oldHome = this.score.home;
                const oldAway = this.score.away;
                this.score = payload.score;
                this.updateScoreUI();

                if (payload.score.home !== oldHome) {
                    this.triggerGoalEffect('home');
                } else if (payload.score.away !== oldAway) {
                    this.triggerGoalEffect('away');
                }
            }
        }

        // Update Match UI state from server state
        if (payload.match_state !== undefined) {
            this.updateMatchStateUI(payload.match_state, payload.timer ?? this.matchTimer, payload.countdown || 0, payload.reward_info);
        }
    }

    private updateMatchStateUI(matchState: string, timer: number, countdown: number, rewardInfo: any) {
        this.matchState = matchState;
        this.matchTimer = timer;
        this.rewardInfo = rewardInfo;

        // 1. Handle Countdown
        if (matchState === 'COUNTDOWN') {
            this.countdownText.setVisible(true);
            if (countdown > 0) {
                this.countdownText.setText(countdown.toString());
            } else {
                this.countdownText.setText('GO!');
            }
        } else {
            this.countdownText.setVisible(false);
        }

        // 2. Handle Status Overlay Text
        if (matchState === 'LOBBY') {
            this.statusText.setText('WAITING FOR PLAYERS...').setVisible(true);
        } else if (matchState === 'OVERTIME') {
            this.statusText.setText('OVERTIME! NEXT GOAL WINS!').setVisible(true);
        } else if (matchState === 'FINISHED') {
            this.statusText.setVisible(false);
        } else {
            this.statusText.setVisible(false);
        }

        this.timerText.setVisible(false);
        this.rewardText.setVisible(false);

        this.dispatchMatchUI();
    }

    private triggerGoalEffect(team: 'home' | 'away') {
        this.isResetting = true;
        this.cameras.main.flash(500, team === 'home' ? 0x0000ff : 0xff0000);
        this.goalText.setText('GOAL!').setVisible(true);

        this.time.delayedCall(2000, () => {
            this.goalText.setVisible(false);
            this.isResetting = false;
        });
    }

    private lerp(start: number, end: number, amt: number): number {
        return (1 - amt) * start + amt * end;
    }

    private interpolateEntities() {
        if (this.serverTimeOffset === null || this.stateBuffer.length === 0) return;

        const localServerTime = Date.now() - this.serverTimeOffset;
        const renderTime = localServerTime - 100; // 100ms in the past (interpolation buffer)

        // Find state boundaries
        let leftState = this.stateBuffer[0];
        let rightState = this.stateBuffer[0];

        for (let i = 0; i < this.stateBuffer.length; i++) {
            if (this.stateBuffer[i].timestamp > renderTime) {
                rightState = this.stateBuffer[i];
                if (i > 0) {
                    leftState = this.stateBuffer[i - 1];
                } else {
                    leftState = rightState;
                }
                break;
            }
        }

        // Clamp rendering to buffer limits
        const oldest = this.stateBuffer[0];
        const latest = this.stateBuffer[this.stateBuffer.length - 1];

        if (renderTime < oldest.timestamp) {
            leftState = oldest;
            rightState = oldest;
        } else if (renderTime > latest.timestamp) {
            leftState = latest;
            rightState = latest;
        }

        let alpha = 0;
        if (rightState.timestamp !== leftState.timestamp) {
            alpha = (renderTime - leftState.timestamp) / (rightState.timestamp - leftState.timestamp);
        }


        // 2. Interpolate Opponent positions
        const activeOpponents = new Set<string>();

        for (const sid of Object.keys(rightState.players)) {
            // Skip local player
            if (sid === this.socket.id) continue;

            activeOpponents.add(sid);

            const oppLeft = leftState.players[sid];
            const oppRight = rightState.players[sid];

            if (oppRight) {
                if (!this.opponents.has(sid)) {
                    // Create visual representation of opponent
                    const newOpponent = new Player(this, oppRight.x, oppRight.y, 'away');
                    newOpponent.setPlayBounds(this.playBounds);
                    newOpponent.setAlpha(0.9);
                    if (newOpponent.body) {
                        (newOpponent.body as Phaser.Physics.Arcade.Body).enable = false; // Disable local physics updates
                    }
                    this.opponents.set(sid, newOpponent);
                }

                const opponentObj = this.opponents.get(sid);
                if (opponentObj) {
                    const oppX = oppLeft ? this.lerp(oppLeft.x, oppRight.x, alpha) : oppRight.x;
                    const oppY = oppLeft ? this.lerp(oppLeft.y, oppRight.y, alpha) : oppRight.y;
                    const moveX = oppX - opponentObj.x;
                    const moveY = oppY - opponentObj.y;

                    opponentObj.setPosition(oppX, oppY);
                    opponentObj.faceDirection(moveX, moveY, this.game.loop.delta / 1000);
                    
                    if (typeof oppRight.stamina === 'number') {
                        opponentObj.stamina = oppRight.stamina;
                    }
                }
            }
        }

        // 3. Clean up disconnected opponents
        this.opponents.forEach((opponentObj, sid) => {
            if (!activeOpponents.has(sid)) {
                opponentObj.destroy();
                this.opponents.delete(sid);
            }
        });
    }

    private createCustomWalls(width: number, height: number) {
        const walls = this.physics.add.staticGroup();
        const thickness = 100;

        // Top Wall
        walls.add(this.add.rectangle(width / 2, 60 - thickness / 2, width, thickness).setAlpha(0));
        // Bottom Wall
        walls.add(this.add.rectangle(width / 2, height - 60 + thickness / 2, width, thickness).setAlpha(0));

        // Left Walls
        walls.add(this.add.rectangle(28 - thickness / 2, 155, thickness, 190).setAlpha(0)); 
        walls.add(this.add.rectangle(28 - thickness / 2, 545, thickness, 190).setAlpha(0)); 

        // Right Walls
        walls.add(this.add.rectangle(width - 28 + thickness / 2, 155, thickness, 190).setAlpha(0)); 
        walls.add(this.add.rectangle(width - 28 + thickness / 2, 545, thickness, 190).setAlpha(0)); 

        // Colider only for local player
        this.physics.add.collider(this.player, walls);
    }

    private generateTextures() {
        // Player texture
        const pG = this.make.graphics({ x: 0, y: 0, add: false } as any);
        pG.fillStyle(0x3498db, 1);
        pG.fillCircle(20, 20, 20);
        pG.lineStyle(2, 0xffffff, 1);
        pG.strokeCircle(20, 20, 20);
        pG.generateTexture('player_texture', 40, 40);
        pG.destroy();

        // Ball texture
        const bG = this.make.graphics({ x: 0, y: 0, add: false } as any);
        bG.fillStyle(0xffffff, 1);
        bG.fillCircle(22, 22, 22);
        bG.lineStyle(2, 0x000000, 1);
        bG.strokeCircle(22, 22, 22);
        
        bG.lineStyle(1, 0xcccccc, 1);
        for(let i=0; i<6; i++) {
            const angle = (i * 60) * (Math.PI/180);
            bG.lineBetween(22, 22, 22 + Math.cos(angle)*22, 22 + Math.sin(angle)*22);
        }
        bG.generateTexture('ball_texture', 44, 44);
        bG.destroy();
    }

    private initUI() {
        const { width, height } = this.scale;
        this.staminaBar = this.add.graphics().setScrollFactor(0).setDepth(2000);
        
        this.scoreText = this.add.text(width / 2, 35, '0 : 0', {
            fontFamily: 'Arial Black', fontSize: '32px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(0).setDepth(3000).setVisible(false);

        this.goalText = this.add.text(width / 2, height / 2, 'GOAL!', {
            fontFamily: 'Arial Black', fontSize: '100px', color: '#f1c40f',
            stroke: '#000000', strokeThickness: 12
        }).setOrigin(0.5).setScrollFactor(0).setDepth(4000).setVisible(false);

        this.countdownText = this.add.text(width / 2, height / 2, '', {
            fontFamily: 'Arial Black', fontSize: '120px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 15
        }).setOrigin(0.5).setScrollFactor(0).setDepth(5000).setVisible(false);

        // Timer Text
        this.timerText = this.add.text(width / 2, 80, '03:00', {
            fontFamily: 'Arial Black', fontSize: '24px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(3000).setVisible(false);

        // Status Text (Lobby, Overtime, etc.)
        this.statusText = this.add.text(width / 2, height / 2 - 100, '', {
            fontFamily: 'Arial Black', fontSize: '40px', color: '#f39c12',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(0).setDepth(4500).setVisible(false);

        // Reward Info Text
        this.rewardText = this.add.text(width / 2, height / 2 + 100, '', {
            fontFamily: 'Arial Black', fontSize: '24px', color: '#2ecc71',
            stroke: '#000000', strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(4500).setVisible(false);

        this.initFPSCounter();
        this.dispatchMatchUI();
    }

    private updateScoreUI() {
        this.scoreText.setText(`${this.score.home} : ${this.score.away}`);
        this.dispatchMatchUI();
    }

    private dispatchMatchUI() {
        if (typeof window === 'undefined') return;

        window.dispatchEvent(new CustomEvent('megaball:match-ui', {
            detail: {
                homeScore: this.score.home,
                awayScore: this.score.away,
                timer: this.matchTimer,
                matchState: this.matchState,
                playerCount: this.playerCount,
                rewards: this.buildRewardItems(this.rewardInfo)
            }
        }));
    }

    private buildRewardItems(rewardInfo: any) {
        const rewards = rewardInfo?.rewards || {};

        return Object.entries(rewards).map(([uid, value]) => {
            const reward = value as any;
            const bonuses = (reward.level_up_rewards || []).map((bonus: any) => {
                if (bonus.type === 'coins') return `+${bonus.amount} coins`;
                if (bonus.type === 'gems') return `+${bonus.amount} gems`;
                return bonus.name ? `Skin: ${bonus.name}` : 'New reward';
            });

            return {
                id: uid,
                title: reward.is_winner ? 'Winner' : 'Runner-up',
                coins: reward.coins,
                xp: reward.xp,
                mmrDelta: reward.mmr_delta,
                rank: reward.rank,
                level: reward.level,
                levelUp: reward.level_up,
                bonuses
            };
        });
    }

    private initFPSCounter() {
        this.fpsText = this.add.text(12, 12, 'FPS: 0', {
            fontFamily: 'monospace', fontSize: '14px', color: '#00ff00',
            backgroundColor: '#00000088', padding: { x: 6, y: 4 }
        }).setScrollFactor(0).setDepth(3000);
    }

    update(time: number, delta: number) {
        if (!this.isGameStarted) {
            this.updateUI(time);
            return;
        }
        
        // 1. Process client input and locally predict player physics
        const inputs = this.player.update(this.controlKeys, delta);
        this.updateMoveDirection(inputs);
        this.dispatchMotionBlur(inputs, time);
        
        // Space is only a kick action.
        if (inputs.kick) {
            this.tryKickBall();
        }

        // 2. Transmit client input to server
        if (this.socket && this.socket.connected) {
            this.socket.emit('player_input', inputs);
        }

        // 3. Smoothly lerp ball to latest server position (lerp factor 0.3)
        const prevBallX = this.ball.x;
        const prevBallY = this.ball.y;
        if (this.targetBallX !== undefined && this.targetBallY !== undefined) {
            const serverDist = Phaser.Math.Distance.Between(this.ball.x, this.ball.y, this.targetBallX, this.targetBallY);
            const syncFactor = serverDist > 90 ? 1 : 0.65;
            this.ball.x = this.lerp(this.ball.x, this.targetBallX, syncFactor);
            this.ball.y = this.lerp(this.ball.y, this.targetBallY, syncFactor);
            this.keepVisualBallPhysical();
            
            // Visual rotation based on displacement
            const dx = this.ball.x - prevBallX;
            const dy = this.ball.y - prevBallY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            this.ball.angle += dist * 0.5;
        }

        // 4. Smoothly interpolate other game entities (opponents) 100ms in the past
        this.interpolateEntities();
        
        // 5. Draw HUD and FPS
        this.updateUI(time);
    }

    private tryKickBall() {
        if (!this.socket || !this.socket.connected) return;

        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.ball.x, this.ball.y);
        const hitRange = PLAYER_RING_RADIUS + BALL_RADIUS + 18; // ring radius + ball radius + input forgiveness
        
        if (dist <= hitRange) {
            const direction = this.getKickDirection();

            this.socket.emit('ball_hit', {
                dx: direction.x,
                dy: direction.y
            });
        }
    }

    private updateMoveDirection(inputs: { up: boolean; down: boolean; left: boolean; right: boolean }) {
        const dx = Number(inputs.right) - Number(inputs.left);
        const dy = Number(inputs.down) - Number(inputs.up);

        if (dx !== 0 || dy !== 0) {
            this.lastMoveDirection.set(dx, dy).normalize();
        }
    }

    private dispatchMotionBlur(inputs: { up: boolean; down: boolean; left: boolean; right: boolean; kick?: boolean }, time: number) {
        if (typeof window === 'undefined') return;

        const isMoving = inputs.up || inputs.down || inputs.left || inputs.right || Boolean(inputs.kick);
        const ballSpeed = Phaser.Math.Distance.Between(
            this.ball.x,
            this.ball.y,
            this.targetBallX ?? this.ball.x,
            this.targetBallY ?? this.ball.y
        );
        const active = isMoving || ballSpeed > 2;

        if (active === this.lastMotionBlurActive && time - this.lastMotionBlurDispatch < 120) return;

        this.lastMotionBlurActive = active;
        this.lastMotionBlurDispatch = time;
        window.dispatchEvent(new CustomEvent('megaball:motion-blur', { detail: { active } }));
    }

    private getKickDirection() {
        const contactDirection = new Phaser.Math.Vector2(
            this.ball.x - this.player.x,
            this.ball.y - this.player.y
        );

        return contactDirection.lengthSq() > 0
            ? contactDirection.normalize()
            : this.lastMoveDirection.clone().normalize();
    }

    private keepVisualBallPhysical() {
        const players = [this.player, ...Array.from(this.opponents.values())];
        const minDist = PLAYER_RING_RADIUS + BALL_RADIUS + 1.5;

        for (let i = 0; i < 2; i++) {
            this.clampVisualBallToPlayBounds();

            for (const player of players) {
                const dx = this.ball.x - player.x;
                const dy = this.ball.y - player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < minDist) {
                    const actualDist = dist === 0 ? 1 : dist;
                    const nx = dx / actualDist;
                    const ny = dy / actualDist;
                    const overlap = minDist - dist;

                    // 1. Push ball away
                    const ballBeforeX = this.ball.x;
                    const ballBeforeY = this.ball.y;
                    this.ball.x += nx * overlap;
                    this.ball.y += ny * overlap;

                    // Clamp ball to bounds
                    this.clampVisualBallToPlayBounds();

                    // Calculate how much the ball actually moved
                    const ballMovedX = this.ball.x - ballBeforeX;
                    const ballMovedY = this.ball.y - ballBeforeY;
                    const ballMovedNormal = ballMovedX * nx + ballMovedY * ny;
                    const remainingOverlap = overlap - ballMovedNormal;

                    // 2. Push player back by the remaining overlap
                    if (remainingOverlap > 0 && player === this.player) {
                        player.x -= nx * remainingOverlap;
                        player.y -= ny * remainingOverlap;

                        // Clamp player to bounds
                        if (typeof player.clampToPlayBounds === 'function') {
                            player.clampToPlayBounds();
                        }
                    }
                }
            }
        }

        this.clampVisualBallToPlayBounds();
    }

    private clampVisualBallToPlayBounds() {
        this.ball.x = Phaser.Math.Clamp(
            this.ball.x,
            this.playBounds.left + BALL_RADIUS,
            this.playBounds.right - BALL_RADIUS
        );
        this.ball.y = Phaser.Math.Clamp(
            this.ball.y,
            this.playBounds.top + BALL_RADIUS,
            this.playBounds.bottom - BALL_RADIUS
        );
    }


    private updateUI(time: number) {
        if (time > this.lastFpsUpdate + 500) {
            const actualFps = Math.round(this.game.loop.actualFps);
            this.fpsText.setText(`FPS: ${actualFps}`);
            this.lastFpsUpdate = time;
        }

        this.staminaBar.clear();
        this.staminaBar.fillStyle(0x000000, 0.5);
        this.staminaBar.fillRect(12, 45, 100, 8);
        this.staminaBar.fillStyle(this.player.stamina > 20 ? 0x3498db : 0xe74c3c, 1);
        this.staminaBar.fillRect(12, 45, Math.max(0, this.player.stamina), 8);

    }
}
