/**
 * StageRunScene - main gameplay scene
 * Hosts all systems and the game loop tick order
 */

import type { Scene } from '../engine/SceneManager';
import type { SceneContext } from '../engine/SceneManager';
import { InputSystem } from '../systems/InputSystem';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { CompanionSystem, resolveCompanionGameplayModifiers } from '../systems/CompanionSystem';
import type { CombatEvent, CombatEntity } from '../systems/CombatSystem';
import { CameraSystem } from '../systems/CameraSystem';
import { BossPhaseSystem, type RuntimeBossPhase } from '../systems/BossPhaseSystem';
import {
	applyPersistedPayloadPickups,
	ItemSystem,
	type Pickup,
} from '../systems/ItemSystem';
import { cloneStageLayout, type RuntimeStageId } from '../world/stageLayoutRegistry';
import { createPlayer, processMossInput, type Player } from '../actors/MossBadger';
import type { Platform } from '../systems/PhysicsSystem';
import type { Renderer } from '../renderer/Renderer';
import {
	playAnimation,
	createAnimationState,
	type AnimationState,
} from '../renderer/AnimationState';

export interface StageRunSceneOptions {
	stageId?: RuntimeStageId;
	acquiredPayloadIds?: readonly string[];
	branchGameplayHooks?: readonly string[];
	bossPhases?: readonly RuntimeBossPhase[];
	onStoryPayloadCollected?: (payloadId: string) => void;
}

export class StageRunScene implements Scene {
	readonly name = 'StageRunScene';

	private input = new InputSystem();
	private physics = new PhysicsSystem();
	private combat = new CombatSystem();
	private camera = new CameraSystem();
	private companions: CompanionSystem;
	private bossPhases: BossPhaseSystem;
	private items = new ItemSystem({
		onCollect: (pickup) => {
			this.renderer?.emitVFX(pickup.x, pickup.y, 'pickup', 8, 42);
			if (pickup.persistence === 'story_payload' && pickup.itemId) {
				this.options.onStoryPayloadCollected?.(pickup.itemId);
			}
		},
	});

	private player: Player;
	private platforms: Platform[] = [];
	private pickups: Pickup[] = [];
	private enemies: CombatEntity[] = [];

	private renderer: Renderer | null = null;
	private hitstopRemaining = 0;
	private screenShakeIntensity = 0;
	private lastAnimationFrame = 0;

	constructor(private readonly options: StageRunSceneOptions = {}) {
		this.companions = new CompanionSystem(
			undefined,
			resolveCompanionGameplayModifiers(options.branchGameplayHooks ?? [])
		);
		this.bossPhases = new BossPhaseSystem(options.bossPhases ?? []);
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
		this.combat.step(this.player, this.enemies, action as unknown as Record<string, boolean>, simDt, {
			onEvent: (event) => this.handleCombatEvent(event),
			mitigateDamage: (amount) =>
				this.companions.mitigateDamage(amount, {
					onShield: (blocked) => this.renderer?.emitVFX(this.player.x, this.player.y, 'emp', blocked + 3, 30),
				}),
			requestHitstop: (duration) => {
				this.hitstopRemaining = duration;
			},
			requestScreenShake: (intensity) => {
				this.screenShakeIntensity = intensity;
			},
		});
		// 5. Items
		this.items.step(this.player, action, this.pickups, simDt);
		// 6-8. Hack, Enemy, Companion
		this.companions.step(this.player, this.enemies, simDt, {
			onHint: (message) => {
				this.player.companionHint = message;
			},
		});
		const companionState = this.companions.getState();
		this.player.companionShield = companionState.nayaShield;
		this.player.rookOverlayActive = companionState.rookOverlayUntil > 0;
		this.player.companionHint = companionState.auntieHint;
		for (const enemy of this.enemies) {
			enemy.rookMarked = companionState.rookOverlayUntil > 0 && enemy.hp > 0;
		}
		const bossPhaseState = this.bossPhases.step(this.player, this.enemies, simDt);
		this.player.bossPhaseHint = bossPhaseState
			? `Boss ${bossPhaseState.phaseIndex + 1}/${bossPhaseState.phaseCount}: ${bossPhaseState.activePhaseLabel}`
			: undefined;
		// 9-11. Beat, WaveDirector, Camera
		this.camera.step(this.player.x, 0, 990, simDt);

		// Player input processing
		processMossInput(this.player, action, simDt, this.combat);

		// Update animation state
		this.updateAnimation(simDt);

		// Update VFX
		if (this.renderer) {
			this.renderer.updateVFX(simDt);
		}

		// Clear edge detection
		this.input.clearPressed();
	}

	render(renderer: unknown, alpha: number): void {
		const rend = renderer as Renderer;
		const cam = this.camera.getCamera();

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

	private updateAnimation(dt: number): void {
		const animState = this.player.animState as AnimationState;
		if (!animState) return;

		// Determine animation based on state
		if (!this.player.onGround) {
			if (this.player.vy < 0) {
				playAnimation(animState, 'jump_up');
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
			playAnimation(animState, this.player.hasKatana ? 'melee_katana' : 'melee_claws', false);
		}

		this.advanceAnimationFrames(animState, dt);
	}

	private advanceAnimationFrames(animState: AnimationState, dt: number): void {
		const sheet = this.renderer?.getSpriteRenderer().getSheet('moss_badger');
		const animation = sheet?.sheet.animations[animState.currentAnim];
		if (!animation) return;

		animState.timer += dt;
		const frameTime = 1 / animation.fps;
		while (animState.timer >= frameTime) {
			animState.timer -= frameTime;
			this.lastAnimationFrame = animState.frame;
			animState.frame++;
			if (animState.frame >= animation.frames) {
				if (animState.loop) {
					animState.frame = 0;
				} else {
					animState.frame = animation.frames - 1;
				}
			}
			this.emitAnimationEvents(animState.currentAnim, animState.frame);
			if (!animState.loop && animState.frame === animation.frames - 1) break;
		}
	}

	private emitAnimationEvents(animName: string, frame: number): void {
		const renderer = this.renderer;
		if (!renderer) return;
		for (const event of renderer.getSpriteRenderer().getAnimationEvents('moss_badger', animName, frame)) {
			switch (event.kind) {
				case 'footstep':
					renderer.emitVFX(this.player.x + this.player.w / 2, this.player.y + this.player.h, 'dust', 2, 18);
					break;
				case 'vfx': {
					const payload = event.payload ?? {};
					const kind = typeof payload.kind === 'string' ? payload.kind : 'muzzle';
					const count = typeof payload.count === 'number' ? payload.count : 4;
					const spread = typeof payload.spread === 'number' ? payload.spread : 40;
					renderer.emitVFX(
						this.player.x + this.player.w / 2 + this.player.dir * 26,
						this.player.y + this.player.h / 2,
						kind,
						count,
						spread
					);
					break;
				}
			}
		}
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
		const layout = cloneStageLayout(this.options.stageId);
		this.platforms = layout.platforms;
		this.pickups = layout.pickups;
		applyPersistedPayloadPickups(this.pickups, this.options.acquiredPayloadIds ?? []);
		this.enemies = layout.enemies;
	}
}
