/**
 * HordeScene - horde mode gameplay with wave director
 */

import { type Player, createPlayer, processMossInput } from '../actors/MossBadger';
import type { Scene, SceneContext } from '../engine/SceneManager';
import type { Renderer } from '../renderer/Renderer';
import { CameraSystem } from '../systems/CameraSystem';
import { CombatSystem } from '../systems/CombatSystem';
import type { CombatEntity, CombatEvent } from '../systems/CombatSystem';
import { EnemySystem } from '../systems/EnemySystem';
import { InputSystem } from '../systems/InputSystem';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { WaveDirector } from '../systems/WaveDirector';

const HORDE_ARENA_WIDTH = 2000;

export class HordeScene implements Scene {
	readonly name = 'HordeScene';

	private input: InputSystem | null = null;
	private physics = new PhysicsSystem();
	private combat = new CombatSystem();
	private camera = new CameraSystem();
	private enemySystem = new EnemySystem();
	private waveDirector: WaveDirector;

	private player: Player;
	private platforms: Array<{ x: number; y: number; w: number; h: number }> = [];
	private renderer: Renderer | null = null;

	private waveTransitionTimer = 0;
	private waveStartTimer: ReturnType<typeof setTimeout> | null = null;
	private gameOver = false;
	private victory = false;

	constructor() {
		this.player = createPlayer();
		this.waveDirector = new WaveDirector(this.enemySystem);
		this.initArena();
	}

	onEnter(ctx: SceneContext): void {
		console.log('HordeScene entered');
		this.renderer = ctx.renderer;
		this.input?.destroy();
		this.input = new InputSystem();

		// Start first wave after brief delay
		this.waveStartTimer = setTimeout(() => {
			this.waveStartTimer = null;
			this.waveDirector.startWave(1);
		}, 1000);
	}

	onExit(): void {
		console.log('HordeScene exited');
		if (this.waveStartTimer !== null) {
			clearTimeout(this.waveStartTimer);
			this.waveStartTimer = null;
		}
		this.input?.destroy();
		this.input = null;
		this.waveDirector.reset();
		this.renderer = null;
	}

	update(dt: number): void {
		if (this.gameOver || this.victory) {
			// Wait for restart input
			return;
		}

		const input = this.input;
		if (!input) return;
		const action = input.snapshot();

		// Physics
		this.physics.step(this.player, this.platforms, action, dt, {
			onJump: () => this.emitJumpParticles(),
			onLand: () => this.emitLandingParticles(),
		});

		// Combat
		this.combat.step(this.player, this.enemySystem.getEnemies(), action, dt, {
			onEvent: (event) => this.handleCombatEvent(event),
			requestHitstop: (duration) => {
				/* hitstop */
			},
			requestScreenShake: (intensity) => {
				/* screen shake */
			},
		});

		// Player input
		processMossInput(this.player, action, dt, this.combat, this.enemySystem.getEnemies());

		// Enemy system
		this.enemySystem.step(this.enemySystem.getEnemies(), this.player, this.platforms, dt);

		// Wave director
		this.waveDirector.step(dt, this.player.x);

		// Check for wave transition
		if (
			!this.waveDirector.isWaveActive() &&
			this.waveDirector.getCurrentWave() < this.waveDirector.getTotalWaves()
		) {
			this.waveTransitionTimer += dt;
			if (this.waveTransitionTimer > 2) {
				const nextWave = this.waveDirector.getCurrentWave() + 1;
				this.waveDirector.startWave(nextWave);
				this.waveTransitionTimer = 0;
			}
		}

		// Check victory
		if (
			this.waveDirector.getCurrentWave() >= this.waveDirector.getTotalWaves() &&
			!this.waveDirector.isWaveActive() &&
			this.enemySystem.getEnemies().length === 0
		) {
			this.victory = true;
		}

		// Check game over
		if (this.player.hp <= 0) {
			this.gameOver = true;
		}

		// Camera
		this.camera.step(this.player.x, 0, HORDE_ARENA_WIDTH, dt);

		input.clearPressed();
	}

	render(rend: Renderer, alpha: number): void {
		const cam = this.camera.getState();

		// Render scene
		rend.clear();
		rend.drawBackground();

		// Draw arena floor
		const ctx = rend.getContext();
		ctx.fillStyle = '#1a1d26';
		ctx.fillRect(0 - cam.x, 480, HORDE_ARENA_WIDTH, 120);

		// Draw platforms
		for (const p of this.platforms) {
			ctx.fillStyle = '#272b32';
			ctx.fillRect(p.x - cam.x, p.y, p.w, p.h);
		}

		// Draw enemies
		rend.renderEnemies(this.enemySystem.getEnemies(), cam.x);

		// Draw player
		rend.renderPlayer(this.player, cam.x);

		// Draw VFX
		rend.renderVFX(cam.x);

		// Draw UI
		this.renderHordeUI(ctx);
	}

	private renderHordeUI(ctx: CanvasRenderingContext2D): void {
		// Wave indicator
		const progress = this.waveDirector.getWaveProgress();
		ctx.fillStyle = 'rgba(4, 6, 12, 0.85)';
		ctx.fillRect(ctx.canvas.width / 2 - 100, 16, 200, 40);

		ctx.fillStyle = '#67f3c4';
		ctx.font = 'bold 16px ui-monospace, monospace';
		ctx.textAlign = 'center';
		ctx.fillText(`WAVE ${progress.current}/${progress.total}`, ctx.canvas.width / 2, 42);

		// Enemies remaining
		ctx.fillStyle = '#ff5e7a';
		ctx.font = '14px ui-monospace, monospace';
		ctx.fillText(`Enemies: ${this.waveDirector.getEnemiesRemaining()}`, ctx.canvas.width / 2, 65);

		// Wave transition message
		if (!this.waveDirector.isWaveActive() && !this.victory && !this.gameOver) {
			ctx.fillStyle = '#ffb35e';
			ctx.font = 'bold 24px ui-monospace, monospace';
			ctx.fillText('WAVE COMPLETE', ctx.canvas.width / 2, ctx.canvas.height / 2);
		}

		// Victory message
		if (this.victory) {
			ctx.fillStyle = 'rgba(4, 6, 12, 0.85)';
			ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

			ctx.fillStyle = '#67f3c4';
			ctx.font = 'bold 36px ui-monospace, monospace';
			ctx.fillText('ALL WAVES CLEARED!', ctx.canvas.width / 2, ctx.canvas.height / 2);
			ctx.font = '18px ui-monospace, monospace';
			ctx.fillText(
				'Press ENTER to return to menu',
				ctx.canvas.width / 2,
				ctx.canvas.height / 2 + 40
			);
		}

		// Game over message
		if (this.gameOver) {
			ctx.fillStyle = 'rgba(4, 6, 12, 0.85)';
			ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

			ctx.fillStyle = '#ff5e7a';
			ctx.font = 'bold 36px ui-monospace, monospace';
			ctx.fillText('DEFEATED', ctx.canvas.width / 2, ctx.canvas.height / 2);
			ctx.font = '18px ui-monospace, monospace';
			ctx.fillText(
				`Reached Wave ${this.waveDirector.getCurrentWave()}`,
				ctx.canvas.width / 2,
				ctx.canvas.height / 2 + 40
			);
			ctx.fillText('Press ENTER to retry', ctx.canvas.width / 2, ctx.canvas.height / 2 + 70);
		}
	}

	private initArena(): void {
		// Create platforms for horde arena
		for (let i = 0; i < 8; i++) {
			this.platforms.push({
				x: 150 + i * 220,
				y: 350 + Math.sin(i * 0.8) * 60,
				w: 100 + Math.random() * 60,
				h: 18,
			});
		}
	}

	private emitJumpParticles(): void {
		if (this.renderer) {
			this.renderer.emitVFX(
				this.player.x + this.player.w / 2,
				this.player.y + this.player.h,
				'dust',
				4,
				30
			);
		}
	}

	private emitLandingParticles(): void {
		if (this.renderer) {
			this.renderer.emitVFX(
				this.player.x + this.player.w / 2,
				this.player.y + this.player.h,
				'dust',
				6,
				40
			);
		}
	}

	private handleCombatEvent(event: CombatEvent): void {
		if (!this.renderer) return;

		if (event.kind === 'hit' || event.kind === 'kill') {
			this.renderer.emitVFX(
				this.player.x + this.player.w / 2 + this.player.dir * 30,
				this.player.y + 20,
				'muzzle',
				4,
				40
			);
		}
	}
}
