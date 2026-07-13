/**
 * StageRunScene - main gameplay scene
 * Hosts all systems and the game loop tick order
 */

import { type Player, createPlayer, processMossInput } from '../actors/MossBadger';
import type { Scene } from '../engine/SceneManager';
import type { SceneContext } from '../engine/SceneManager';
import type { StageRuntimeResult } from '../game/GameFlow';
import {
	type LowerSprawlObjectiveEvent,
	type LowerSprawlObjectiveSnapshot,
	LowerSprawlObjectives,
} from '../game/LowerSprawlObjectives';
import type { StageRuntimeConfig } from '../game/StageRuntimeConfig';
import type { StoryBalanceRules } from '../game/StoryBalanceRules';
import { EncounterGenerator, type GeneratedEnemyPack } from '../procgen/EncounterGenerator';
import type { GeneratedSideRoom } from '../procgen/SideRoomGenerator';
import {
	type AnimationState,
	createAnimationState,
	playAnimation,
} from '../renderer/AnimationState';
import type { Renderer } from '../renderer/Renderer';
import {
	type BossPhaseRuntimeState,
	BossPhaseSystem,
	type RuntimeBossPhase,
} from '../systems/BossPhaseSystem';
import { CameraSystem } from '../systems/CameraSystem';
import { CombatSystem } from '../systems/CombatSystem';
import type { CombatEntity, CombatEvent } from '../systems/CombatSystem';
import { CompanionSystem, resolveCompanionGameplayModifiers } from '../systems/CompanionSystem';
import { InputSystem } from '../systems/InputSystem';
import {
	ItemSystem,
	type Pickup,
	applyPersistedPayloadPickups,
	getCollectedStoryPayloadIds,
} from '../systems/ItemSystem';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import type { Platform } from '../systems/PhysicsSystem';
import { type RuntimeStageId, cloneStageLayout } from '../world/stageLayoutRegistry';

export interface RuntimeTutorialBeat {
	id: string;
	label: string;
	trigger: string;
	teaches: string;
}

export interface RuntimeBossPlaceholder {
	id: string;
	name: string;
	argument: string;
	phaseCount: number;
}

export interface StageRunSceneOptions {
	stageId?: RuntimeStageId;
	acquiredPayloadIds?: readonly string[];
	branchGameplayHooks?: readonly string[];
	balanceRules?: StoryBalanceRules;
	runtimeConfig?: StageRuntimeConfig;
	bossPhases?: readonly RuntimeBossPhase[];
	bossPlaceholder?: RuntimeBossPlaceholder;
	tutorialBeats?: readonly RuntimeTutorialBeat[];
	generatedEnemyPacks?: readonly GeneratedEnemyPack[];
	generatedSideRooms?: readonly GeneratedSideRoom[];
	procgenSeed?: string;
	unlockedSkills?: readonly string[];
	onStoryPayloadCollected?: (payloadId: string) => void;
	onStageComplete?: (result: StageRuntimeResult) => void;
	onReturnToTitle?: () => void;
}

export class StageRunScene implements Scene {
	readonly name = 'StageRunScene';

	private input: InputSystem | null = null;
	private physics = new PhysicsSystem();
	private combat = new CombatSystem();
	private camera = new CameraSystem();
	private companions: CompanionSystem;
	private bossPhases: BossPhaseSystem;
	private encounterGenerator = new EncounterGenerator();
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
	private keyHandler: ((event: KeyboardEvent) => void) | null = null;
	private hitstopRemaining = 0;
	private screenShakeIntensity = 0;
	private lastAnimationFrame = 0;
	private readonly lowerSprawlObjectives: LowerSprawlObjectives | null;
	private stageCompletionDispatched = false;

	constructor(private readonly options: StageRunSceneOptions = {}) {
		this.companions = new CompanionSystem(
			undefined,
			resolveCompanionGameplayModifiers(options.branchGameplayHooks ?? [])
		);
		this.bossPhases = new BossPhaseSystem(options.bossPhases ?? []);
		this.player = createPlayer();
		this.player.unlockedSkills = [...(options.unlockedSkills ?? [])];
		// Initialize animation state
		this.player.animState = createAnimationState();
		this.lowerSprawlObjectives =
			options.stageId === 'lower-sprawl' ? new LowerSprawlObjectives() : null;
		this.initWorld();
	}

	private handleLowerSprawlEvents(events: LowerSprawlObjectiveEvent[]): void {
		if (events.length === 0 || !this.lowerSprawlObjectives) return;
		for (const event of events) {
			if (event.kind === 'meter-scanned') {
				this.renderer?.emitVFX(this.player.x + this.player.w / 2, this.player.y + 12, 'emp', 5, 26);
			} else if (event.kind === 'puzzle-step' || event.kind === 'puzzle-complete') {
				this.renderer?.emitVFX(
					this.player.x + this.player.w / 2,
					this.player.y + 18,
					'pickup',
					6,
					32
				);
			}
			window.dispatchEvent(
				new CustomEvent('badger:lower-sprawl-progress', {
					detail: { event, snapshot: this.lowerSprawlObjectives.getSnapshot() },
				})
			);
		}
	}

	private updateLowerSprawlCompletion(): void {
		const objectives = this.lowerSprawlObjectives;
		if (!objectives || this.stageCompletionDispatched) return;
		const payloadCollected = getCollectedStoryPayloadIds(this.pickups).includes('wafer_key');
		const boss = this.enemies.find((enemy) => enemy.bossId === 'tollbooth-captain-grin');
		this.handleLowerSprawlEvents(
			objectives.observeWorld(payloadCollected, Boolean(boss && boss.hp <= 0))
		);
		const result = objectives.claimCompletion();
		if (!result) return;
		this.stageCompletionDispatched = true;
		window.dispatchEvent(new CustomEvent('badger:stage-complete', { detail: result }));
		this.options.onStageComplete?.(result);
	}

	private renderLowerSprawlWorld(ctx: CanvasRenderingContext2D, cameraX: number): void {
		const snapshot = this.lowerSprawlObjectives?.getSnapshot();
		if (!snapshot) return;
		ctx.save();
		ctx.textAlign = 'center';
		ctx.font = '10px ui-monospace, monospace';
		for (const meter of snapshot.meters) {
			const x = meter.x - cameraX;
			ctx.fillStyle = meter.scanned ? '#67f3c4' : '#ffb35e';
			ctx.fillRect(x - 8, meter.y - 34, 16, 34);
			ctx.fillStyle = '#0b1020';
			ctx.fillRect(x - 4, meter.y - 29, 8, 8);
			ctx.fillStyle = meter.scanned ? '#67f3c4' : '#eaf2ff';
			ctx.fillText(meter.scanned ? 'SCANNED' : 'M: SCAN', x, meter.y - 42);
		}

		const gateX = snapshot.gate.x - cameraX;
		ctx.strokeStyle = snapshot.puzzleStatus === 'solved' ? '#67f3c4' : '#ff5e7a';
		ctx.lineWidth = 4;
		ctx.strokeRect(gateX - 26, snapshot.gate.y - 86, 52, 86);
		ctx.fillStyle = snapshot.puzzleStatus === 'active' ? '#ffb35e' : '#eaf2ff';
		ctx.fillText(
			snapshot.puzzleStatus === 'idle' || snapshot.puzzleStatus === 'failed'
				? 'M: SYNC TOLL'
				: snapshot.puzzleStatus === 'active'
					? `BEAT: ${snapshot.expectedInput?.toUpperCase()}`
					: 'ROUTE OPEN',
			gateX,
			snapshot.gate.y - 94
		);
		ctx.restore();
	}

	private renderLowerSprawlObjectivePanel(ctx: CanvasRenderingContext2D): void {
		const snapshot = this.lowerSprawlObjectives?.getSnapshot();
		if (!snapshot) return;
		const scanned = snapshot.meters.filter((meter) => meter.scanned).length;
		const x = 24;
		const y = ctx.canvas.height - 122;
		ctx.save();
		ctx.fillStyle = 'rgba(4, 6, 12, 0.86)';
		ctx.fillRect(x, y, 430, 98);
		ctx.strokeStyle = snapshot.readyToComplete ? '#67f3c4' : '#ffb35e';
		ctx.strokeRect(x, y, 430, 98);
		ctx.textAlign = 'left';
		ctx.font = '700 12px ui-monospace, monospace';
		ctx.fillStyle = '#ffb35e';
		ctx.fillText('LOWER SPRAWL OBJECTIVES', x + 12, y + 20);
		ctx.font = '11px ui-monospace, monospace';
		ctx.fillStyle = snapshot.questComplete ? '#67f3c4' : '#eaf2ff';
		ctx.fillText(`Side job: toll meters ${scanned}/3`, x + 12, y + 40);
		ctx.fillStyle = snapshot.puzzleStatus === 'solved' ? '#67f3c4' : '#eaf2ff';
		ctx.fillText(
			`Toll rhythm: ${snapshot.puzzleStatus}${snapshot.expectedInput ? ` • ${snapshot.expectedInput}` : ''}`,
			x + 12,
			y + 57
		);
		ctx.fillStyle = snapshot.payloadCollected ? '#67f3c4' : '#eaf2ff';
		ctx.fillText(`Wafer key: ${snapshot.payloadCollected ? 'secured' : 'missing'}`, x + 12, y + 74);
		ctx.fillStyle = snapshot.bossDefeated ? '#67f3c4' : '#ff5e7a';
		ctx.fillText(`Captain Grin: ${snapshot.bossDefeated ? 'defeated' : 'active'}`, x + 220, y + 74);
		ctx.restore();
	}

	getAnimationSnapshot(): {
		currentAnim: string;
		frame: number;
		timer: number;
		loop: boolean;
		frames: number;
		fps: number;
	} | null {
		const state = this.player.animState;
		if (!state) return null;
		const animation = this.renderer?.getSpriteRenderer().getSheet('moss_badger')?.sheet.animations[
			state.currentAnim
		];
		return {
			currentAnim: state.currentAnim,
			frame: state.frame,
			timer: state.timer,
			loop: state.loop,
			frames: animation?.frames ?? 0,
			fps: animation?.fps ?? 0,
		};
	}

	getLowerSprawlObjectiveSnapshot(): LowerSprawlObjectiveSnapshot | null {
		return this.lowerSprawlObjectives?.getSnapshot() ?? null;
	}

	getBossPhaseSnapshot(): BossPhaseRuntimeState | null {
		return this.bossPhases.getState();
	}

	debugTeleportPlayer(x: number, y: number): void {
		this.player.x = x;
		this.player.y = y;
		this.player.vx = 0;
		this.player.vy = 0;
	}

	debugSetBossHp(hp: number): void {
		const boss = this.enemies.find((enemy) => enemy.bossId === this.options.bossPlaceholder?.id);
		if (boss) boss.hp = Math.max(0, Math.min(boss.maxHp, hp));
	}

	getTutorialOverlayBeats(): RuntimeTutorialBeat[] {
		return (this.options.tutorialBeats ?? []).map((beat) => ({ ...beat }));
	}

	getBossPlaceholder(): RuntimeBossPlaceholder | null {
		return this.options.bossPlaceholder ? { ...this.options.bossPlaceholder } : null;
	}

	getBalanceRules(): StoryBalanceRules | null {
		return this.options.balanceRules
			? {
					...this.options.balanceRules,
					activeReasons: [...this.options.balanceRules.activeReasons],
				}
			: null;
	}

	getRuntimeConfig(): StageRuntimeConfig | null {
		return this.options.runtimeConfig
			? {
					...this.options.runtimeConfig,
					hazardIds: [...this.options.runtimeConfig.hazardIds],
					enemyMixTags: [...this.options.runtimeConfig.enemyMixTags],
					modifierRules: this.options.runtimeConfig.modifierRules.map((rule) => ({ ...rule })),
				}
			: null;
	}

	getPlayerSnapshot(): {
		x: number;
		y: number;
		vx: number;
		vy: number;
		hp: number;
		maxHp: number;
		onGround: boolean;
		hasRailgun: boolean;
		hasRocket: boolean;
		hasKatana: boolean;
		fuel: number;
		stims: number;
		meleeTimer: number;
	} {
		const p = this.player;
		return {
			x: p.x,
			y: p.y,
			vx: p.vx,
			vy: p.vy,
			hp: p.hp,
			maxHp: p.maxHp,
			onGround: p.onGround,
			hasRailgun: p.hasRailgun,
			hasRocket: p.hasRocket,
			hasKatana: p.hasKatana,
			fuel: p.fuel,
			stims: p.stims,
			meleeTimer: p.meleeTimer,
		};
	}

	getEnemySnapshots(): Array<{ x: number; y: number; hp: number; maxHp: number; bossId?: string }> {
		return this.enemies.map((e) => ({
			x: e.x,
			y: e.y,
			hp: e.hp,
			maxHp: e.maxHp,
			bossId: 'bossId' in e && typeof e.bossId === 'string' ? e.bossId : undefined,
		}));
	}

	getPickupSnapshots(): Array<{ id: string; x: number; y: number; taken: boolean; kind: string }> {
		return this.pickups.map((p) => ({
			id: p.id,
			x: p.x,
			y: p.y,
			taken: p.taken,
			kind: p.kind,
		}));
	}

	onEnter(ctx: SceneContext): void {
		console.log('StageRunScene entered');
		this.input?.destroy();
		this.input = new InputSystem();
		if (this.options.tutorialBeats?.length) {
			window.dispatchEvent(
				new CustomEvent('badger:tutorial-overlay', { detail: this.getTutorialOverlayBeats() })
			);
		}
		if (this.options.bossPlaceholder) {
			window.dispatchEvent(
				new CustomEvent('badger:boss-placeholder', { detail: this.getBossPlaceholder() })
			);
		}
		if (this.options.balanceRules) {
			window.dispatchEvent(
				new CustomEvent('badger:story-balance', { detail: this.getBalanceRules() })
			);
		}
		if (this.options.runtimeConfig) {
			window.dispatchEvent(
				new CustomEvent('badger:stage-runtime-config', { detail: this.getRuntimeConfig() })
			);
		}
		this.renderer = ctx.renderer;
		// Load sprite manifest if available
		this.renderer.loadSprites('/data/sprites.json').catch(() => {
			console.log('Sprite manifest not found, using fallback rendering');
		});
		const handleKeyDown = (event: KeyboardEvent): void => {
			if (event.code === 'Escape') {
				this.options.onReturnToTitle?.();
				event.preventDefault();
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		this.keyHandler = handleKeyDown;
	}

	onExit(): void {
		console.log('StageRunScene exited');
		this.input?.destroy();
		this.input = null;
		if (this.keyHandler) {
			window.removeEventListener('keydown', this.keyHandler);
			this.keyHandler = null;
		}
	}

	update(dt: number): void {
		const input = this.input;
		if (!input) return;
		const action = input.snapshot();
		const simDt = this.player.focus > 0 ? dt * 0.62 : dt;
		this.handleLowerSprawlEvents(this.lowerSprawlObjectives?.step(simDt) ?? []);
		this.handleLowerSprawlEvents(
			this.lowerSprawlObjectives?.observeAction(this.player, action) ?? []
		);

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
		this.combat.step(this.player, this.enemies, action, simDt, {
			onEvent: (event) => this.handleCombatEvent(event),
			mitigateDamage: (amount) =>
				this.companions.mitigateDamage(amount, {
					onShield: (blocked) =>
						this.renderer?.emitVFX(this.player.x, this.player.y, 'emp', blocked + 3, 30),
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
		processMossInput(this.player, action, simDt, this.combat, this.enemies);

		// Update animation state
		this.updateAnimation(simDt);
		this.updateLowerSprawlCompletion();

		// Clear edge detection
		input.clearPressed();
	}

	render(rend: Renderer, alpha: number): void {
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
		this.renderLowerSprawlWorld(ctx, cam.x);
		rend.renderPickups(this.pickups, cam.x);
		rend.renderPlayer(this.player, cam.x);
		rend.renderEnemies(this.enemies, cam.x);
		rend.renderVFX(cam.x);
		rend.renderUI(this.player, cam);
		this.renderBalanceOverlay(ctx);
		this.renderRuntimeConfigOverlay(ctx);
		this.renderTutorialOverlay(ctx);
		this.renderLowerSprawlObjectivePanel(ctx);

		ctx.restore();
	}

	private renderBalanceOverlay(ctx: CanvasRenderingContext2D): void {
		const rules = this.options.balanceRules;
		if (!rules) return;
		const x = ctx.canvas.width - 310;
		const y = 116;
		ctx.save();
		ctx.fillStyle = 'rgba(4, 6, 12, 0.78)';
		ctx.fillRect(x, y, 286, 112);
		ctx.strokeStyle = rules.hazardIntensity === 'extreme' ? '#ff5e7a' : '#ffb35e';
		ctx.strokeRect(x, y, 286, 112);
		ctx.textAlign = 'left';
		ctx.font = '700 12px ui-monospace, monospace';
		ctx.fillStyle = '#ffb35e';
		ctx.fillText('Story balance', x + 12, y + 20);
		ctx.font = '11px ui-monospace, monospace';
		ctx.fillStyle = '#eaf2ff';
		ctx.fillText(
			`merchant x${rules.merchantPriceModifier.toFixed(2)} / assist ${rules.allyAssistLevel}`,
			x + 12,
			y + 42
		);
		ctx.fillStyle = '#92a4be';
		ctx.fillText(`hazards ${rules.hazardIntensity} / ending ${rules.endingTone}`, x + 12, y + 60);
		ctx.fillStyle = '#67f3c4';
		ctx.fillText(rules.activeReasons.slice(0, 3).join(' • ').slice(0, 42), x + 12, y + 80);
		ctx.restore();
	}

	private renderRuntimeConfigOverlay(ctx: CanvasRenderingContext2D): void {
		const config = this.options.runtimeConfig;
		if (!config || config.modifierRules.length === 0) return;
		const x = ctx.canvas.width - 310;
		const y = 236;
		ctx.save();
		ctx.fillStyle = 'rgba(4, 6, 12, 0.78)';
		ctx.fillRect(x, y, 286, 104);
		ctx.strokeStyle = '#67f3c4';
		ctx.strokeRect(x, y, 286, 104);
		ctx.textAlign = 'left';
		ctx.font = '700 12px ui-monospace, monospace';
		ctx.fillStyle = '#67f3c4';
		ctx.fillText('Stage runtime config', x + 12, y + 20);
		ctx.font = '11px ui-monospace, monospace';
		ctx.fillStyle = '#eaf2ff';
		ctx.fillText(`camera ${config.cameraPressure} / hazards ${config.hazardCount}`, x + 12, y + 42);
		ctx.fillStyle = '#92a4be';
		ctx.fillText(config.enemyMixTags.slice(0, 3).join(' • ').slice(0, 42), x + 12, y + 60);
		ctx.fillStyle = '#ffb35e';
		ctx.fillText(config.modifierRules[0]?.effect.slice(0, 42) ?? '', x + 12, y + 78);
		ctx.restore();
	}

	private renderTutorialOverlay(ctx: CanvasRenderingContext2D): void {
		const beats = this.options.tutorialBeats ?? [];
		if (beats.length === 0) return;
		const x = 24;
		const y = 116;
		const panelW = 396;
		const panelH = Math.min(150, 42 + beats.length * 38);
		ctx.save();
		ctx.fillStyle = 'rgba(4, 6, 12, 0.82)';
		ctx.fillRect(x, y, panelW, panelH);
		ctx.strokeStyle = '#67f3c4';
		ctx.strokeRect(x, y, panelW, panelH);
		ctx.textAlign = 'left';
		ctx.font = '700 13px ui-monospace, monospace';
		ctx.fillStyle = '#67f3c4';
		ctx.fillText('Tutorial beats', x + 14, y + 22);
		ctx.font = '11px ui-monospace, monospace';
		for (const [index, beat] of beats.slice(0, 3).entries()) {
			const lineY = y + 44 + index * 34;
			ctx.fillStyle = '#eaf2ff';
			ctx.fillText(`${beat.label}: ${beat.trigger}`.slice(0, 54), x + 14, lineY);
			ctx.fillStyle = '#92a4be';
			ctx.fillText(beat.teaches.slice(0, 58), x + 14, lineY + 15);
		}
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
		if (this.player.meleeTimer > 0) {
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
		for (const event of renderer
			.getSpriteRenderer()
			.getAnimationEvents('moss_badger', animName, frame)) {
			switch (event.kind) {
				case 'footstep':
					renderer.emitVFX(
						this.player.x + this.player.w / 2,
						this.player.y + this.player.h,
						'dust',
						2,
						18
					);
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
		const generatedPacks =
			this.options.generatedEnemyPacks ??
			this.encounterGenerator.generatePacks(
				{
					stageId: this.options.stageId ?? layout.id,
					seed: this.options.procgenSeed ?? `${this.options.stageId ?? layout.id}:story`,
					gameplayHooks: this.options.branchGameplayHooks ?? [],
				},
				1
			);
		const sideRooms = this.options.generatedSideRooms ?? [];
		this.platforms = [...this.platforms, ...sideRooms.flatMap((room) => room.platforms)];
		this.pickups = [...this.pickups, ...sideRooms.flatMap((room) => room.pickups)];
		const bossPlaceholder = this.createBossPlaceholder(layout.id);
		this.enemies = [
			...layout.enemies,
			...generatedPacks.flatMap((pack) => pack.enemies),
			...sideRooms.flatMap((room) => room.enemyPacks.flatMap((pack) => pack.enemies)),
			...(bossPlaceholder ? [bossPlaceholder] : []),
		];
	}

	private createBossPlaceholder(stageId: string): CombatEntity | null {
		const boss = this.options.bossPlaceholder;
		if (!boss) return null;
		const phaseCount = Math.max(1, boss.phaseCount);
		return {
			x: 1480,
			y: 418,
			w: 42,
			h: 62,
			vx: 0,
			vy: 0,
			onGround: false,
			coyoteLeft: 0,
			jumpBuffered: 0,
			dir: -1,
			hp: 4 + phaseCount * 2,
			maxHp: 4 + phaseCount * 2,
			invuln: 0,
			stun: 0,
			bossId: boss.id,
			bossName: boss.name,
			bossArgument: boss.argument,
			isBossPlaceholder: true,
			procgenFamily: `${stageId}_boss_placeholder`,
			procgenRole: 'boss',
		};
	}
}
