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
import {
	CaptainGrinController,
	type CaptainGrinEvent,
	type CaptainGrinSnapshot,
} from '../systems/CaptainGrinController';
import { CombatSystem } from '../systems/CombatSystem';
import type { CombatEntity, CombatEvent, CombatEvents } from '../systems/CombatSystem';
import { CompanionSystem, resolveCompanionGameplayModifiers } from '../systems/CompanionSystem';
import {
	FIRST_RELEASE_ITEM_CATALOG,
	getFirstReleaseItem,
} from '../systems/FirstReleaseItemCatalog';
import { InputSystem } from '../systems/InputSystem';
import { InventorySystem, type LoadoutSummary } from '../systems/InventorySystem';
import { resolveRuntimeItemEffects } from '../systems/ItemEffectResolver';
import {
	ItemSystem,
	type Pickup,
	applyPersistedPayloadPickups,
	getCollectedStoryPayloadIds,
} from '../systems/ItemSystem';
import {
	FIRST_RELEASE_BUDGET_RULE,
	type LoadoutBudgetReport,
	validateLoadoutBudget,
} from '../systems/LoadoutBudgetSystem';
import {
	type LowerSprawlEnemyEvent,
	LowerSprawlEnemySystem,
} from '../systems/LowerSprawlEnemySystem';
import {
	type LowerSprawlHazardEvent,
	type LowerSprawlHazardSnapshot,
	LowerSprawlHazardSystem,
} from '../systems/LowerSprawlHazardSystem';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import type { Platform } from '../systems/PhysicsSystem';
import { applyRuntimeItemEffectsToCombatEntity } from '../systems/RuntimeItemApplier';
import {
	LOWER_SPRAWL_CHECKPOINTS,
	type StageCheckpointEvent,
	type StageCheckpointSnapshot,
	StageCheckpointSystem,
} from '../systems/StageCheckpointSystem';
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
	private readonly captainGrin: CaptainGrinController | null;
	private readonly lowerSprawlHazards: LowerSprawlHazardSystem | null;
	private readonly lowerSprawlEnemies: LowerSprawlEnemySystem | null;
	private readonly checkpoints: StageCheckpointSystem | null;
	private encounterGenerator = new EncounterGenerator();
	private inventory = new InventorySystem(FIRST_RELEASE_ITEM_CATALOG);
	private loadoutSummary: LoadoutSummary = this.inventory.buildLoadoutSummary();
	private loadoutBudget: LoadoutBudgetReport = validateLoadoutBudget(
		this.loadoutSummary,
		FIRST_RELEASE_ITEM_CATALOG,
		FIRST_RELEASE_BUDGET_RULE
	);
	private items = new ItemSystem({
		onCollect: (pickup) => {
			this.renderer?.emitVFX(pickup.x, pickup.y, 'pickup', 8, 42);
			this.collectLoadoutPickup(pickup);
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
	private debugOverlayVisible = false;

	constructor(private readonly options: StageRunSceneOptions = {}) {
		this.companions = new CompanionSystem(
			undefined,
			resolveCompanionGameplayModifiers(options.branchGameplayHooks ?? [])
		);
		this.bossPhases = new BossPhaseSystem(options.bossPhases ?? []);
		this.captainGrin = options.stageId === 'lower-sprawl' ? new CaptainGrinController() : null;
		this.lowerSprawlHazards =
			options.stageId === 'lower-sprawl' ? new LowerSprawlHazardSystem() : null;
		this.lowerSprawlEnemies =
			options.stageId === 'lower-sprawl' ? new LowerSprawlEnemySystem() : null;
		this.checkpoints =
			options.stageId === 'lower-sprawl'
				? new StageCheckpointSystem(LOWER_SPRAWL_CHECKPOINTS)
				: null;
		this.player = createPlayer();
		this.player.unlockedSkills = [...(options.unlockedSkills ?? [])];
		// Initialize animation state
		this.player.animState = createAnimationState();
		this.lowerSprawlObjectives =
			options.stageId === 'lower-sprawl' ? new LowerSprawlObjectives() : null;
		this.inventory.addItem('claws');
		this.inventory.equip('claws');
		this.refreshLoadout();
		this.player.checkpointLabel = this.checkpoints?.getSnapshot().activeLabel;
		this.player.hudToast =
			options.stageId === 'lower-sprawl' ? 'Follow the public route' : undefined;
		this.player.hudToastTimer = options.stageId === 'lower-sprawl' ? 2.6 : 0;
		this.initWorld();
		this.updateGameplayHints();
	}

	private collectLoadoutPickup(pickup: Pickup): void {
		if (!pickup.itemId) return;
		const item = getFirstReleaseItem(pickup.itemId);
		if (!item) {
			if (pickup.kind === 'stim') this.showToast('Stim cached // use E while grounded and hurt');
			if (pickup.persistence === 'story_payload') this.showToast('Wafer key secured', 2.4);
			return;
		}
		if (!this.inventory.has(pickup.itemId)) this.inventory.addItem(pickup.itemId);
		this.inventory.equip(pickup.itemId);
		this.refreshLoadout();
		const latestBonus = this.loadoutSummary.activeBonuses.at(-1);
		this.showToast(
			latestBonus ? `${item.name} online // ${latestBonus.label}` : `${item.name} online`,
			2.4
		);
		window.dispatchEvent(
			new CustomEvent('badger:loadout-updated', {
				detail: { itemId: pickup.itemId, loadout: this.getLoadoutSnapshot() },
			})
		);
	}

	private showToast(message: string, duration = 1.8): void {
		this.player.hudToast = message;
		this.player.hudToastTimer = duration;
	}

	private handleCheckpointEvents(events: StageCheckpointEvent[]): void {
		for (const event of events) {
			this.player.checkpointLabel = event.checkpoint.label;
			if (event.kind === 'checkpoint-activated') {
				this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
				this.showToast(`Checkpoint // ${event.checkpoint.label}`, 2.1);
				this.renderer?.emitVFX(this.player.x, this.player.y + this.player.h, 'emp', 8, 48);
			} else {
				this.showToast(`Signal restored // ${event.checkpoint.label}`, 2.3);
				this.player.damageFlash = 0.2;
			}
			window.dispatchEvent(new CustomEvent('badger:checkpoint', { detail: event }));
		}
	}

	private handleEnemyEvents(events: LowerSprawlEnemyEvent[]): void {
		for (const event of events) {
			const enemy = this.enemies.find((candidate) => candidate.id === event.enemyId);
			if (event.kind === 'enemy-telegraph' && enemy) {
				this.renderer?.emitVFX(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, 'muzzle', 4, 28);
			}
			window.dispatchEvent(new CustomEvent('badger:lower-sprawl-enemy', { detail: event }));
		}
	}

	private updateFeedbackTimers(dt: number): void {
		this.player.hudToastTimer = Math.max(0, (this.player.hudToastTimer ?? 0) - dt);
		this.player.damageFlash = Math.max(0, (this.player.damageFlash ?? 0) - dt * 1.6);
		this.player.healFlash = Math.max(0, (this.player.healFlash ?? 0) - dt * 1.25);
	}

	private updateGameplayHints(): void {
		const snapshot = this.lowerSprawlObjectives?.getSnapshot();
		if (!snapshot) return;
		const scanned = snapshot.meters.filter((meter) => meter.scanned).length;
		if (scanned < snapshot.meters.length) {
			this.player.objectiveHint = `Scan toll meters // ${scanned}/${snapshot.meters.length}`;
		} else if (snapshot.puzzleStatus !== 'solved') {
			this.player.objectiveHint = 'Synchronize the toll gate';
		} else if (!snapshot.bossDefeated) {
			this.player.objectiveHint = 'Break Captain Grin’s toll claim';
		} else if (!snapshot.payloadCollected) {
			this.player.objectiveHint = 'Secure the wafer key';
		} else {
			this.player.objectiveHint = 'Route liberated';
		}

		const rigPieces = this.loadoutSummary.equippedItemIds.filter((itemId) =>
			['rocket_backpack', 'bassline_boots', 'gravity_talisman'].includes(itemId)
		).length;
		const activeBonus = this.loadoutSummary.activeBonuses.at(-1)?.label;
		this.player.loadoutHint = `Burrowbreaker ${rigPieces}/3${activeBonus ? ` // ${activeBonus}` : ''}`;

		this.player.contextHint = undefined;
		const captain = this.captainGrin?.getSnapshot();
		if (captain?.action === 'windup') {
			this.player.contextHint = 'L parry // Shift dodge';
			return;
		}
		if (this.player.hp <= 2 && this.player.stims > 0 && this.player.onGround) {
			this.player.contextHint = 'E use stim';
			return;
		}
		const centerX = this.player.x + this.player.w / 2;
		const centerY = this.player.y + this.player.h / 2;
		const distance = (x: number, y: number): number => Math.hypot(centerX - x, centerY - y);
		const nearbyMeter = snapshot.meters.find(
			(meter) => !meter.scanned && distance(meter.x, meter.y) < 82
		);
		if (nearbyMeter) {
			this.player.contextHint = 'M scan public toll record';
			return;
		}
		if (snapshot.puzzleStatus !== 'solved' && distance(snapshot.gate.x, snapshot.gate.y) < 88) {
			this.player.contextHint =
				snapshot.puzzleStatus === 'active'
					? `${snapshot.expectedInput ?? 'listen'} // stay on beat`
					: 'M synchronize toll gate';
			return;
		}
		const nearbyPickup = this.pickups.find(
			(pickup) => !pickup.taken && distance(pickup.x + 14, pickup.y + 14) < 74
		);
		if (nearbyPickup) {
			this.player.contextHint =
				nearbyPickup.persistence === 'story_payload' ? 'Secure payload' : 'Gear cache';
			return;
		}
		if (
			this.enemies.some(
				(enemy) => enemy.hp > 0 && Math.abs(centerX - (enemy.x + enemy.w / 2)) < 150
			)
		) {
			this.player.contextHint = 'J strike // L parry // Shift dodge';
		}
	}

	private recoverPlayerIfNeeded(): void {
		if (!this.checkpoints) return;
		this.handleCheckpointEvents(this.checkpoints.step(this.player.x));
		if (this.player.hp > 0 && this.physics.isAlive(this.player, 600)) return;
		this.handleCheckpointEvents([this.checkpoints.respawn(this.player)]);
		this.hitstopRemaining = 0.18;
		this.screenShakeIntensity = 9;
	}

	private refreshLoadout(): void {
		this.loadoutSummary = this.inventory.buildLoadoutSummary();
		this.loadoutBudget = validateLoadoutBudget(
			this.loadoutSummary,
			FIRST_RELEASE_ITEM_CATALOG,
			FIRST_RELEASE_BUDGET_RULE
		);
		const effects = resolveRuntimeItemEffects(this.loadoutSummary);
		const combatant = applyRuntimeItemEffectsToCombatEntity(this.player, effects);
		this.player.airControlMultiplier = effects.physics.airControlMultiplier;
		this.player.maxFallSpeedBonus = effects.physics.maxFallSpeedBonus;
		this.player.itemSetEffects = combatant.itemSetEffects;
	}

	private getCombatEvents(): CombatEvents {
		return {
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
		};
	}

	private handleHazardEvents(events: LowerSprawlHazardEvent[]): void {
		for (const event of events) {
			if (event.kind === 'hazard-warning') {
				this.renderer?.emitVFX(this.player.x, this.player.y + this.player.h, 'dust', 2, 20);
			}
			if (event.kind === 'hazard-hit') {
				this.screenShakeIntensity = Math.max(this.screenShakeIntensity, 7);
			}
			window.dispatchEvent(new CustomEvent('badger:lower-sprawl-hazard', { detail: event }));
		}
	}

	private handleCaptainEvents(events: CaptainGrinEvent[]): void {
		for (const event of events) {
			if (event.kind === 'boss-telegraph') {
				this.renderer?.emitVFX(1510, 450, 'muzzle', 6, 45);
			}
			if (event.kind === 'boss-phase-transition') {
				this.screenShakeIntensity = Math.max(this.screenShakeIntensity, 10);
				this.renderer?.emitVFX(1510, 450, 'emp', 14, 90);
			}
			window.dispatchEvent(new CustomEvent('badger:captain-grin-pattern', { detail: event }));
		}
	}

	private triggerLandingShockwave(): void {
		if (this.player.itemSetEffects?.landingShockwave !== true) return;
		this.combat.resolveAttack(
			this.player,
			this.enemies,
			{
				id: 'burrowbreaker:landing-shockwave',
				source: 'player',
				damage: 0.75,
				damageType: 'blunt',
				stun: 0.28,
				knockbackX: 85,
				knockbackY: -90,
				hitbox: {
					x: this.player.x - 44,
					y: this.player.y + this.player.h - 24,
					w: this.player.w + 88,
					h: 42,
				},
				parryable: false,
			},
			this.getCombatEvents()
		);
		this.renderer?.emitVFX(
			this.player.x + this.player.w / 2,
			this.player.y + this.player.h,
			'emp',
			10,
			70
		);
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

		for (const [index, checkpoint] of (
			this.checkpoints?.getSnapshot().checkpoints ?? []
		).entries()) {
			const checkpointX = checkpoint.x - cameraX;
			const activeIndex = this.checkpoints?.getSnapshot().activeIndex ?? 0;
			const active = index <= activeIndex;
			ctx.fillStyle = active ? '#67f3c4' : '#364457';
			ctx.fillRect(checkpointX - 3, checkpoint.y - 58, 6, 58);
			ctx.beginPath();
			ctx.arc(checkpointX, checkpoint.y - 62, active ? 8 : 5, 0, Math.PI * 2);
			ctx.fill();
			if (index === activeIndex) {
				ctx.fillStyle = '#67f3c4';
				ctx.fillText('RELAY ACTIVE', checkpointX, checkpoint.y - 76);
			}
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

		for (const hazard of this.lowerSprawlHazards?.getSnapshot() ?? []) {
			const hazardX = hazard.x - cameraX;
			ctx.fillStyle = hazard.state === 'active' ? '#ff5e7a' : '#364457';
			ctx.fillRect(hazardX, hazard.y + hazard.h - 10, hazard.w, 10);
			if (hazard.state !== 'idle') {
				ctx.globalAlpha = hazard.state === 'active' ? 0.72 : 0.28;
				ctx.fillStyle = hazard.state === 'active' ? '#eaf2ff' : '#ffb35e';
				ctx.fillRect(hazardX + 8, hazard.y, hazard.w - 16, hazard.h - 8);
				ctx.globalAlpha = 1;
				ctx.fillStyle = '#eaf2ff';
				ctx.fillText(
					hazard.state === 'active' ? 'STEAM' : 'HISS…',
					hazardX + hazard.w / 2,
					hazard.y - 6
				);
			}
		}
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

	getCaptainGrinSnapshot(): CaptainGrinSnapshot | null {
		return this.captainGrin?.getSnapshot() ?? null;
	}

	getLowerSprawlHazardSnapshot(): LowerSprawlHazardSnapshot[] {
		return this.lowerSprawlHazards?.getSnapshot() ?? [];
	}

	getCheckpointSnapshot(): StageCheckpointSnapshot | null {
		return this.checkpoints?.getSnapshot() ?? null;
	}

	getLoadoutSnapshot(): LoadoutSummary & { budget: LoadoutBudgetReport } {
		return {
			...this.loadoutSummary,
			activeBonuses: this.loadoutSummary.activeBonuses.map((bonus) => ({
				...bonus,
				effects: { ...bonus.effects },
			})),
			effects: { ...this.loadoutSummary.effects },
			missingSetPieces: this.loadoutSummary.missingSetPieces.map((set) => ({
				...set,
				missingItemIds: [...set.missingItemIds],
			})),
			budget: {
				...this.loadoutBudget,
				violations: [...this.loadoutBudget.violations],
				counts: { ...this.loadoutBudget.counts },
			},
		};
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

	debugSetPlayerHp(hp: number): void {
		this.player.hp = Math.max(0, Math.min(this.player.maxHp, hp));
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
		maxFuel: number;
		stims: number;
		meleeTimer: number;
		airControlMultiplier: number;
		maxFallSpeedBonus: number;
		checkpointLabel?: string;
		objectiveHint?: string;
		contextHint?: string;
		hudToast?: string;
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
			maxFuel: p.maxFuel,
			stims: p.stims,
			meleeTimer: p.meleeTimer,
			airControlMultiplier: p.airControlMultiplier ?? 1,
			maxFallSpeedBonus: p.maxFallSpeedBonus ?? 0,
			checkpointLabel: p.checkpointLabel,
			objectiveHint: p.objectiveHint,
			contextHint: p.contextHint,
			hudToast: p.hudToast,
		};
	}

	getEnemySnapshots(): Array<{
		id?: string;
		x: number;
		y: number;
		hp: number;
		maxHp: number;
		bossId?: string;
		role?: string;
		aiState?: string;
		attackTelegraph?: number;
	}> {
		return this.enemies.map((e) => ({
			id: e.id,
			x: e.x,
			y: e.y,
			hp: e.hp,
			maxHp: e.maxHp,
			bossId: 'bossId' in e && typeof e.bossId === 'string' ? e.bossId : undefined,
			role: e.procgenRole,
			aiState: e.aiState,
			attackTelegraph: e.attackTelegraph,
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
			} else if (event.code === 'F3') {
				this.debugOverlayVisible = !this.debugOverlayVisible;
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
		this.updateFeedbackTimers(dt);
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
		const combatEvents = this.getCombatEvents();
		this.physics.step(this.player, this.platforms, action, simDt, {
			onJump: () => this.emitJumpParticles(),
			onLand: (fallDistance) => {
				this.emitLandingParticles(fallDistance);
				this.triggerLandingShockwave();
			},
			onCoyoteJump: () => this.emitCoyoteParticles(),
		});
		// 4. Combat with event handlers
		this.combat.step(this.player, this.enemies, action, simDt, combatEvents);
		// 5. Items and hazards
		this.items.step(this.player, action, this.pickups, simDt);
		this.handleHazardEvents(
			this.lowerSprawlHazards?.step(this.player, simDt, this.combat, combatEvents) ?? []
		);
		this.handleEnemyEvents(
			this.lowerSprawlEnemies?.step(this.enemies, this.player, simDt, this.combat, combatEvents) ??
				[]
		);
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
		const captain = this.enemies.find((enemy) => enemy.bossId === 'tollbooth-captain-grin');
		this.handleCaptainEvents(
			this.captainGrin?.step(
				captain,
				this.player,
				bossPhaseState,
				simDt,
				this.combat,
				combatEvents
			) ?? []
		);
		// 9-11. Beat, WaveDirector, Camera
		this.camera.step(this.player.x, 0, 990, simDt, this.player.vx);

		// Player input processing
		processMossInput(this.player, action, simDt, this.combat, this.enemies, combatEvents);

		// Update animation and stage experience state
		this.updateAnimation(simDt);
		this.updateLowerSprawlCompletion();
		this.recoverPlayerIfNeeded();
		this.updateGameplayHints();

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
		if (this.debugOverlayVisible) {
			this.renderBalanceOverlay(ctx);
			this.renderRuntimeConfigOverlay(ctx);
			this.renderTutorialOverlay(ctx);
			this.renderLowerSprawlObjectivePanel(ctx);
			this.renderLoadoutPanel(ctx);
		}

		ctx.restore();
	}

	private renderLoadoutPanel(ctx: CanvasRenderingContext2D): void {
		if (this.options.stageId !== 'lower-sprawl') return;
		const x = ctx.canvas.width - 344;
		const y = ctx.canvas.height - 122;
		const burrowbreaker = this.loadoutSummary.activeBonuses.filter(
			(bonus) => bonus.setId === 'burrowbreaker-rig'
		);
		const equippedPieces = this.loadoutSummary.equippedItemIds.filter((itemId) =>
			['rocket_backpack', 'bassline_boots', 'gravity_talisman'].includes(itemId)
		).length;
		ctx.save();
		ctx.fillStyle = 'rgba(4, 6, 12, 0.86)';
		ctx.fillRect(x, y, 320, 98);
		ctx.strokeStyle = burrowbreaker.length >= 2 ? '#67f3c4' : '#92a4be';
		ctx.strokeRect(x, y, 320, 98);
		ctx.textAlign = 'left';
		ctx.font = '700 12px ui-monospace, monospace';
		ctx.fillStyle = '#67f3c4';
		ctx.fillText(`BURROWBREAKER RIG ${equippedPieces}/3`, x + 12, y + 20);
		ctx.font = '11px ui-monospace, monospace';
		ctx.fillStyle = '#eaf2ff';
		ctx.fillText(
			this.loadoutSummary.equippedItemIds
				.filter((itemId) => itemId !== 'claws')
				.join(' • ')
				.slice(0, 44) || 'Find movement gear on the high route',
			x + 12,
			y + 42
		);
		ctx.fillStyle = burrowbreaker.length > 0 ? '#ffb35e' : '#92a4be';
		ctx.fillText(
			burrowbreaker.map((bonus) => `${bonus.pieces}p ${bonus.label}`).join(' • ') ||
				'2p: landing shockwave',
			x + 12,
			y + 62
		);
		ctx.fillStyle = this.loadoutBudget.valid ? '#67f3c4' : '#ff5e7a';
		ctx.fillText(
			`budget ${this.loadoutBudget.totalCost}/${FIRST_RELEASE_BUDGET_RULE.maxBudget} • ${
				this.loadoutBudget.valid ? 'valid' : this.loadoutBudget.violations[0]
			}`,
			x + 12,
			y + 80
		);
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
		const incomingHit =
			event.source === 'enemy' && (event.kind === 'hit' || event.kind === 'damage');
		if (incomingHit) {
			this.player.damageFlash = 0.34;
			if (this.player.hp <= 2) this.showToast('Integrity critical // find space to stim', 1.5);
		}
		if (event.kind === 'parry' && event.source === 'player') {
			this.showToast('Perfect parry // counter now', 0.85);
		}
		if (event.kind === 'kill' && event.source === 'player') {
			this.showToast(`Target cleared // chain ${this.player.comboCount ?? 0}`, 0.9);
		}

		const renderer = this.renderer;
		if (!renderer) return;

		switch (event.kind) {
			case 'hit':
				if (event.source === 'player') {
					if (this.player.hasRocket) {
						const refund = this.player.itemSetEffects?.fuelRefundOnCombo;
						if (typeof refund === 'number' && refund > 0) {
							this.player.fuel = Math.min(this.player.maxFuel, this.player.fuel + refund);
						}
					}
					renderer.emitVFX(
						this.player.x + this.player.w / 2 + this.player.dir * 30,
						this.player.y + 20,
						'muzzle',
						5,
						50
					);
				} else {
					renderer.emitVFX(
						this.player.x + this.player.w / 2,
						this.player.y + this.player.h / 2,
						'blood',
						7,
						46
					);
				}
				break;
			case 'damage':
				if (event.source === 'enemy') {
					renderer.emitVFX(
						this.player.x + this.player.w / 2,
						this.player.y + this.player.h / 2,
						'blood',
						6,
						42
					);
				}
				break;
			case 'kill':
				renderer.emitVFX(
					this.player.x + this.player.w / 2 + this.player.dir * 30,
					this.player.y + 20,
					'blood',
					12,
					80
				);
				break;
			case 'parry':
				renderer.emitVFX(
					this.player.x + this.player.w / 2,
					this.player.y + this.player.h / 2,
					'emp',
					8,
					60
				);
				break;
			case 'dodge':
				renderer.emitVFX(
					this.player.x + this.player.w / 2,
					this.player.y + this.player.h / 2,
					'dust',
					6,
					46
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
		for (const enemy of this.enemies) {
			if (['patrol', 'turret', 'bruiser'].includes(enemy.procgenRole ?? '')) {
				enemy.usesPatternController = true;
			}
		}
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
