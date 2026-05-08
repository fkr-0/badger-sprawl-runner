/**
 * StageRunScene - main gameplay scene
 * Hosts all systems and the game loop tick order
 */

import type { Scene } from '../engine/SceneManager';
import type { SceneContext } from '../engine/SceneManager';
import { InputSystem } from '../systems/InputSystem';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { CombatSystem } from '../systems/CombatSystem';
import type { CombatEvent, CombatEntity } from '../systems/CombatSystem';
import { CameraSystem } from '../systems/CameraSystem';
import { ItemSystem } from '../systems/ItemSystem';
import { createPlayer, processMossInput, type Player } from '../actors/MossBadger';
import type { Platform } from '../systems/PhysicsSystem';
import type { Pickup } from '../systems/ItemSystem';
import type { Renderer } from '../renderer/Renderer';
import {
	playAnimation,
	advanceAnimation,
	createAnimationState,
	type AnimationState,
} from '../renderer/AnimationState';

export class StageRunScene implements Scene {
	readonly name = 'StageRunScene';

	private input = new InputSystem();
	private physics = new PhysicsSystem();
	private combat = new CombatSystem();
	private camera = new CameraSystem();
	private items = new ItemSystem();

	private player: Player;
	private platforms: Platform[] = [];
	private pickups: Pickup[] = [];
	private enemies: CombatEntity[] = [];

	private renderer: Renderer | null = null;
	private hitstopRemaining = 0;
	private screenShakeIntensity = 0;

	constructor() {
		this.player = createPlayer();
		// Initialize animation state
		this.player.animState = createAnimationState();
		this.initWorld();
	}

	onEnter(ctx: SceneContext): void {
		console.log('StageRunScene entered');
		this.renderer = ctx.renderer as Renderer;
		// Load sprite manifest if available
		this.renderer.loadSprites('/data/sprites.json').catch(() => {
			console.log('Sprite manifest not found, using fallback rendering');
		});
	}

	onExit(): void {
		console.log('StageRunScene exited');
	}

	update(dt: number): void {
		const action = this.input.snapshot();
		const simDt = this.player.focus > 0 ? dt * 0.62 : dt;

		// Handle hitstop - freeze game briefly for impact
		if (this.hitstopRemaining > 0) {
			this.hitstopRemaining -= dt;
			if (this.hitstopRemaining > 0) {
				return; // Skip update during hitstop
			}
		}

		// Decay screen shake
		if (this.screenShakeIntensity > 0) {
			this.screenShakeIntensity = Math.max(0, this.screenShakeIntensity - dt * 30);
		}

		// System tick order per spec:
		// 1. Input snapshot - done above
		// 2. Replay recording (not implemented)
		// 3. Physics
		this.physics.step(this.player, this.platforms, action, simDt, {
			onJump: () => this.emitJumpParticles(),
			onLand: (fallDistance) => this.emitLandingParticles(fallDistance),
			onCoyoteJump: () => this.emitCoyoteParticles(),
		});
		// 4. Combat with event handlers
		this.combat.step(this.player, this.enemies, action as Record<string, boolean>, simDt, {
			onEvent: (event) => this.handleCombatEvent(event),
			requestHitstop: (duration) => {
				this.hitstopRemaining = duration;
			},
			requestScreenShake: (intensity) => {
				this.screenShakeIntensity = intensity;
			},
		});
		// 5. Items
		this.items.step(this.player, action, this.pickups, simDt);
		// 6-8. Hack, Enemy, Companion (not implemented)
		// 9-11. Beat, WaveDirector, Camera
		this.camera.step(this.player.x, 0, 990, simDt);

		// Player input processing
		processMossInput(this.player, action, simDt, this.combat);

		// Update animation state
		this.updateAnimation();

		// Update VFX
		if (this.renderer) {
			this.renderer.updateVFX(simDt);
		}

		// Clear edge detection
		this.input.clearPressed();
	}

	render(renderer: unknown, alpha: number): void {
		const rend = renderer as Renderer;
		const cam = this.camera.getState();

		// Apply screen shake offset
		const shakeX =
			this.screenShakeIntensity > 0 ? (Math.random() - 0.5) * this.screenShakeIntensity * 2 : 0;
		const shakeY =
			this.screenShakeIntensity > 0 ? (Math.random() - 0.5) * this.screenShakeIntensity * 2 : 0;

		// Save context for screen shake
		const ctx = rend.getContext();
		ctx.save();
		ctx.translate(shakeX, shakeY);

		// Render order: background -> parallax -> platforms -> pickups -> player -> enemies -> vfx -> ui
		rend.clear();
		rend.drawBackground();
		rend.renderParallax(cam.x);
		rend.renderPlatforms(this.platforms, cam.x);
		rend.renderPickups(this.pickups, cam.x);
		rend.renderPlayer(this.player, cam.x);
		rend.renderEnemies(this.enemies, cam.x);
		rend.renderVFX(cam.x);
		rend.renderUI(this.player, cam);

		ctx.restore();
	}

	private updateAnimation(): void {
		const animState = this.player.animState as AnimationState;
		if (!animState) return;

		// Determine animation based on state
		if (!this.player.onGround) {
			if (this.player.vy < 0) {
				playAnimation(animState, 'jump');
			} else {
				playAnimation(animState, 'fall');
			}
		} else if (Math.abs(this.player.vx) > 10) {
			playAnimation(animState, 'run');
		} else {
			playAnimation(animState, 'idle');
		}

		// Check for attack animation
		const lastAction = this.combat.getLastAction();
		if (lastAction?.kind === 'melee' && Date.now() - lastAction.time < 200) {
			playAnimation(animState, 'attack', false);
		}

		// Animation frame advancement happens during render when sprite sheet is available
	}

	private emitJumpParticles(): void {
		if (!this.renderer) return;
		// Emit dust at player's feet
		this.renderer.emitVFX(
			this.player.x + this.player.w / 2,
			this.player.y + this.player.h,
			'dust',
			6,
			40
		);
	}

	private emitLandingParticles(fallDistance: number): void {
		if (!this.renderer) return;
		// More particles for harder landings
		const count = Math.min(12, Math.floor(fallDistance / 20) + 4);
		this.renderer.emitVFX(
			this.player.x + this.player.w / 2,
			this.player.y + this.player.h,
			'dust',
			count,
			60
		);
	}

	private emitCoyoteParticles(): void {
		if (!this.renderer) return;
		// Subtle indicator for coyote jump
		this.renderer.emitVFX(
			this.player.x + this.player.w / 2,
			this.player.y + this.player.h + 10,
			'emp',
			3,
			20
		);
	}

	private handleCombatEvent(event: CombatEvent): void {
		if (!this.renderer) return;

		switch (event.kind) {
			case 'hit':
				// Hit spark
				this.renderer.emitVFX(
					this.player.x + this.player.w / 2 + this.player.dir * 30,
					this.player.y + 20,
					'muzzle',
					5,
					50
				);
				break;
			case 'kill':
				// Death explosion
				this.renderer.emitVFX(
					this.player.x + this.player.w / 2 + this.player.dir * 30,
					this.player.y + 20,
					'blood',
					12,
					80
				);
				break;
			case 'parry':
				// Parry flash
				this.renderer.emitVFX(
					this.player.x + this.player.w / 2,
					this.player.y + this.player.h / 2,
					'emp',
					8,
					60
				);
				break;
			case 'dodge':
				// Dodge trail
				this.renderer.emitVFX(
					this.player.x + this.player.w / 2,
					this.player.y + this.player.h / 2,
					'dust',
					4,
					30
				);
				break;
		}
	}

	private initWorld(): void {
		// Platforms from prototype
		this.platforms = [
			{ x: 0, y: 494, w: 1900, h: 80 },
			{ x: 230, y: 415, w: 135, h: 18 },
			{ x: 455, y: 360, w: 130, h: 18 },
			{ x: 705, y: 405, w: 150, h: 18 },
			{ x: 950, y: 338, w: 170, h: 18 },
			{ x: 1230, y: 420, w: 160, h: 18 },
			{ x: 1480, y: 365, w: 240, h: 18 },
		];

		// Pickups from prototype
		this.pickups = [
			{ id: 'rocket_backpack', x: 270, y: 382, kind: 'rocket', taken: false },
			{ id: 'railgun', x: 500, y: 326, kind: 'railgun', taken: false },
			{ id: 'stim_pack', x: 996, y: 304, kind: 'stim', taken: false },
			{ id: 'katana', x: 1518, y: 330, kind: 'katana', taken: false },
		];

		// Enemies from prototype
		this.enemies = [
			{ x: 620, y: 462, w: 34, h: 32, vx: -42, hp: 2, stun: 0, invuln: 0 },
			{ x: 1130, y: 305, w: 34, h: 30, vx: 0, hp: 2, stun: 0, invuln: 0, phase: 0 },
		];
	}
}
