/**
 * StageRunScene - main gameplay scene
 * Hosts all systems and the game loop tick order
 */

import { resolveSkillEffects } from '@badger/progression';
import { type Player, createPlayer, processMossInput } from '../actors/MossBadger';
import type { Scene } from '../engine/SceneManager';
import type { SceneContext } from '../engine/SceneManager';
import {
	type ChromeArcologyObjectiveEvent,
	type ChromeArcologyObjectiveSnapshot,
	ChromeArcologyObjectives,
} from '../game/ChromeArcologyObjectives';
import {
	type DrainmarketObjectiveEvent,
	type DrainmarketObjectiveSnapshot,
	DrainmarketObjectives,
} from '../game/DrainmarketObjectives';
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
import {
	CHROME_ARCOLOGY_PARALLAX_SHEET_ID,
	DRAINMARKET_PARALLAX_SHEET_ID,
	LOWER_SPRAWL_BACKDROP_SHEET_ID,
	PLAYER_SPRITE_SHEET_ID,
	type Renderer,
} from '../renderer/Renderer';
import { runtimeToolsEnabled } from '../runtime/RuntimeEnvironment';
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
import {
	type ChromeArcologyEnemyEvent,
	ChromeArcologyEnemySystem,
} from '../systems/ChromeArcologyEnemySystem';
import { CombatSystem } from '../systems/CombatSystem';
import type { CombatEntity, CombatEvent, CombatEvents } from '../systems/CombatSystem';
import { CompanionSystem, resolveCompanionGameplayModifiers } from '../systems/CompanionSystem';
import {
	type DrainmarketEnemyEvent,
	DrainmarketEnemySystem,
} from '../systems/DrainmarketEnemySystem';
import {
	FIRST_RELEASE_ITEM_CATALOG,
	getFirstReleaseItem,
} from '../systems/FirstReleaseItemCatalog';
import { InputSystem } from '../systems/InputSystem';
import {
	InventorySystem,
	type LoadoutSummary,
	mergeEffectRecords,
} from '../systems/InventorySystem';
import { resolveRuntimeItemEffects } from '../systems/ItemEffectResolver';
import {
	ItemSystem,
	type Pickup,
	applyPersistedPayloadPickups,
	getCollectedStoryPayloadIds,
} from '../systems/ItemSystem';
import {
	KnifeDroneNestController,
	type KnifeDroneNestEvent,
	type KnifeDroneNestSnapshot,
} from '../systems/KnifeDroneNestController';
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
import {
	MadameVitrineController,
	type MadameVitrineEvent,
	type MadameVitrineSnapshot,
} from '../systems/MadameVitrineController';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import type { Platform } from '../systems/PhysicsSystem';
import { applyRuntimeItemEffectsToCombatEntity } from '../systems/RuntimeItemApplier';
import {
	CHROME_ARCOLOGY_CHECKPOINTS,
	DRAINMARKET_CHECKPOINTS,
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
	skillRanks?: Readonly<Record<string, number>>;
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
	private readonly knifeDroneNest: KnifeDroneNestController | null;
	private readonly madameVitrine: MadameVitrineController | null;
	private readonly lowerSprawlHazards: LowerSprawlHazardSystem | null;
	private readonly lowerSprawlEnemies: LowerSprawlEnemySystem | null;
	private readonly drainmarketEnemies: DrainmarketEnemySystem | null;
	private readonly chromeArcologyEnemies: ChromeArcologyEnemySystem | null;
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
	private readonly drainmarketObjectives: DrainmarketObjectives | null;
	private readonly chromeArcologyObjectives: ChromeArcologyObjectives | null;
	private stageCompletionDispatched = false;
	private debugOverlayVisible = false;

	constructor(private readonly options: StageRunSceneOptions = {}) {
		this.companions = new CompanionSystem(
			undefined,
			resolveCompanionGameplayModifiers(options.branchGameplayHooks ?? [])
		);
		this.bossPhases = new BossPhaseSystem(options.bossPhases ?? []);
		this.captainGrin = options.stageId === 'lower-sprawl' ? new CaptainGrinController() : null;
		this.knifeDroneNest = options.stageId === 'drainmarket' ? new KnifeDroneNestController() : null;
		this.madameVitrine =
			options.stageId === 'chrome-arcology' ? new MadameVitrineController() : null;
		this.lowerSprawlHazards =
			options.stageId === 'lower-sprawl' ? new LowerSprawlHazardSystem() : null;
		this.lowerSprawlEnemies =
			options.stageId === 'lower-sprawl' ? new LowerSprawlEnemySystem() : null;
		this.drainmarketEnemies =
			options.stageId === 'drainmarket' ? new DrainmarketEnemySystem() : null;
		this.chromeArcologyEnemies =
			options.stageId === 'chrome-arcology' ? new ChromeArcologyEnemySystem() : null;
		this.checkpoints =
			options.stageId === 'lower-sprawl'
				? new StageCheckpointSystem(LOWER_SPRAWL_CHECKPOINTS)
				: options.stageId === 'drainmarket'
					? new StageCheckpointSystem(DRAINMARKET_CHECKPOINTS)
					: options.stageId === 'chrome-arcology'
						? new StageCheckpointSystem(CHROME_ARCOLOGY_CHECKPOINTS)
						: null;
		this.player = createPlayer();
		this.player.unlockedSkills = [...(options.unlockedSkills ?? [])];
		// Initialize animation state
		this.player.animState = createAnimationState();
		this.lowerSprawlObjectives =
			options.stageId === 'lower-sprawl' ? new LowerSprawlObjectives() : null;
		this.drainmarketObjectives =
			options.stageId === 'drainmarket' ? new DrainmarketObjectives() : null;
		this.chromeArcologyObjectives =
			options.stageId === 'chrome-arcology' ? new ChromeArcologyObjectives() : null;
		this.inventory.addItem('claws');
		this.inventory.equip('claws');
		this.refreshLoadout();
		this.player.checkpointLabel = this.checkpoints?.getSnapshot().activeLabel;
		this.player.hudToast =
			options.stageId === 'lower-sprawl'
				? 'Follow the public route'
				: options.stageId === 'drainmarket'
					? 'Red invoice flash // L parry'
					: options.stageId === 'chrome-arcology'
						? 'K railgun // pierce the glass sightlines'
						: undefined;
		this.player.hudToastTimer = ['lower-sprawl', 'drainmarket', 'chrome-arcology'].includes(
			options.stageId ?? ''
		)
			? 2.6
			: 0;
		this.initWorld();
		this.updateGameplayHints();
	}

	private updateChromeArcologyHints(snapshot: ChromeArcologyObjectiveSnapshot): void {
		const pierced = snapshot.sightlines.filter((sightline) => sightline.pierced).length;
		const scanned = snapshot.cargoTags.filter((tag) => tag.scanned).length;
		if (!this.player.hasRailgun) {
			this.player.objectiveHint = 'Collect the service-floor railgun';
		} else if (pierced < snapshot.sightlines.length) {
			this.player.objectiveHint = `Pierce glass sightlines // ${pierced}/${snapshot.sightlines.length}`;
		} else if (scanned < snapshot.cargoTags.length) {
			this.player.objectiveHint = `Name hidden labor floors // ${scanned}/${snapshot.cargoTags.length}`;
		} else if (snapshot.routerStatus !== 'solved') {
			this.player.objectiveHint = 'Reroute the prisoner elevator';
		} else if (!snapshot.bossDefeated) {
			this.player.objectiveHint = 'Shatter Madame Vitrine’s display';
		} else if (!snapshot.payloadCollected) {
			this.player.objectiveHint = 'Secure the Elevator Seed';
		} else {
			this.player.objectiveHint = 'Vertical authority disrupted';
		}
		this.player.loadoutHint = `Railgun lanes ${pierced}/3 // labor floors ${scanned}/2`;
		this.player.contextHint = undefined;

		const vitrine = this.madameVitrine?.getSnapshot();
		if (vitrine?.action === 'windup') {
			this.player.contextHint =
				vitrine.pendingAttack === 'glass-lane'
					? 'WHITE LANE // SHIFT DODGE'
					: 'GOLD FLASH // L PARRY';
			return;
		}
		const prismLane = this.enemies.some(
			(enemy) =>
				enemy.hp > 0 &&
				enemy.aiState === 'windup' &&
				enemy.spriteSheetId === 'enemy_mirror_sentinel' &&
				Math.abs(enemy.x - this.player.x) < 560
		);
		if (prismLane) {
			this.player.contextHint = 'PRISM LANE // JUMP OR DODGE';
			return;
		}
		if (this.player.hp <= 2 && this.player.stims > 0 && this.player.onGround) {
			this.player.contextHint = 'E use stim';
			return;
		}

		const centerX = this.player.x + this.player.w / 2;
		const centerY = this.player.y + this.player.h / 2;
		const distance = (x: number, y: number): number => Math.hypot(centerX - x, centerY - y);
		const nearbySightline = snapshot.sightlines.find(
			(sightline) => !sightline.pierced && distance(sightline.x, sightline.y) < 98
		);
		if (nearbySightline) {
			this.player.contextHint = this.player.hasRailgun
				? 'FACE THE GLASS // K PIERCE'
				: 'Railgun required';
			return;
		}
		const nearbyTag = snapshot.cargoTags.find((tag) => !tag.scanned && distance(tag.x, tag.y) < 84);
		if (nearbyTag) {
			this.player.contextHint = 'M reveal labor-floor manifest';
			return;
		}
		if (snapshot.routerStatus !== 'solved' && distance(snapshot.router.x, snapshot.router.y) < 92) {
			this.player.contextHint =
				snapshot.routerStatus === 'active'
					? `${snapshot.expectedInput?.toUpperCase() ?? 'WAIT'} // authority sequence`
					: pierced === 3 && scanned === 2
						? 'M open elevator seed router'
						: 'Expose all sightlines and labor floors';
			return;
		}
		const nearbyPickup = this.pickups.find(
			(pickup) => !pickup.taken && distance(pickup.x + 14, pickup.y + 14) < 76
		);
		if (nearbyPickup) {
			this.player.contextHint =
				nearbyPickup.persistence === 'story_payload' ? 'Secure Elevator Seed' : 'Arcology cache';
			return;
		}
		if (
			this.enemies.some(
				(enemy) => enemy.hp > 0 && Math.abs(centerX - (enemy.x + enemy.w / 2)) < 420
			)
		) {
			this.player.contextHint = 'K pierce lane // J close strike // Shift dodge';
		}
	}

	private handleChromeArcologyEvents(events: ChromeArcologyObjectiveEvent[]): void {
		if (events.length === 0 || !this.chromeArcologyObjectives) return;
		for (const event of events) {
			if (event.kind === 'sightline-pierced') {
				const pierced = this.chromeArcologyObjectives
					.getSnapshot()
					.sightlines.filter((sightline) => sightline.pierced).length;
				this.showToast(`Glass sightline pierced // ${pierced}/3`, 1.35);
				this.renderer?.emitVFX(
					this.player.x + this.player.dir * 80,
					this.player.y + 20,
					'emp',
					9,
					74
				);
			} else if (event.kind === 'cargo-tag-scanned') {
				const scanned = this.chromeArcologyObjectives
					.getSnapshot()
					.cargoTags.filter((tag) => tag.scanned).length;
				this.showToast(`Hidden labor floor named // ${scanned}/2`, 1.5);
			} else if (event.kind === 'tutorial-complete') {
				this.showToast('Railgun lesson // one lane, several targets', 1.9);
			} else if (event.kind === 'router-started') {
				this.showToast('Elevator authority exposed // K L K', 1.8);
			} else if (event.kind === 'router-complete') {
				this.showToast('Prisoner elevator rerouted // seed vault open', 2);
				this.renderer?.emitVFX(1780, 420, 'emp', 14, 95);
			} else if (event.kind === 'router-failed') {
				this.showToast('Authority checksum rejected // restart router', 1.5);
			} else if (event.kind === 'hack-mistake-ignored') {
				this.showToast('Street Syntax // authority error ignored', 1.55);
				this.renderer?.emitVFX(this.player.x + 16, this.player.y + 18, 'emp', 8, 52);
			}
			window.dispatchEvent(
				new CustomEvent('badger:chrome-arcology-progress', {
					detail: { event, snapshot: this.chromeArcologyObjectives.getSnapshot() },
				})
			);
		}
	}

	private handleChromeArcologyEnemyEvents(events: ChromeArcologyEnemyEvent[]): void {
		for (const event of events) {
			const enemy = this.enemies.find((candidate) => candidate.id === event.enemyId);
			if (event.kind === 'enemy-telegraph' && enemy) {
				const spread = event.attack === 'prism-lane' ? 82 : 44;
				this.renderer?.emitVFX(enemy.x + enemy.w / 2, enemy.y + 18, 'muzzle', 7, spread);
			}
			window.dispatchEvent(new CustomEvent('badger:chrome-arcology-enemy', { detail: event }));
		}
	}

	private handleMadameVitrineEvents(events: MadameVitrineEvent[]): void {
		for (const event of events) {
			if (event.kind === 'boss-telegraph') {
				const message =
					event.attack === 'glass-lane'
						? 'Glass lane // Shift dodge'
						: event.attack === 'contract-fan'
							? 'Contract fan // L parry or retreat'
							: 'Mirror dash // L parry';
				this.showToast(message, 1.1);
				this.renderer?.emitVFX(2070, 390, 'muzzle', 12, 92);
			}
			if (event.kind === 'boss-phase-transition') {
				this.screenShakeIntensity = Math.max(this.screenShakeIntensity, 12);
				this.renderer?.emitVFX(2070, 390, 'emp', 18, 120);
				this.showToast(
					event.phaseIndex === 1
						? 'Hidden floor revealed // contract fans online'
						: 'Public proof phase // mirrors become weapons',
					1.9
				);
			}
			window.dispatchEvent(new CustomEvent('badger:madame-vitrine-pattern', { detail: event }));
		}
	}

	private collectLoadoutPickup(pickup: Pickup): void {
		if (!pickup.itemId) return;
		const item = getFirstReleaseItem(pickup.itemId);
		if (!item) {
			if (pickup.kind === 'stim') this.showToast('Stim cached // use E while grounded and hurt');
			if (pickup.persistence === 'story_payload') {
				const payloadMessage =
					pickup.itemId === 'stim_cache'
						? 'Stim cache secured'
						: pickup.itemId === 'elevator_seed'
							? 'Elevator seed secured'
							: 'Wafer key secured';
				this.showToast(payloadMessage, 2.4);
			}
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

	private handleDrainmarketEvents(events: DrainmarketObjectiveEvent[]): void {
		if (events.length === 0 || !this.drainmarketObjectives) return;
		for (const event of events) {
			if (event.kind === 'invoice-delivered') {
				const delivered = this.drainmarketObjectives
					.getSnapshot()
					.invoices.filter((invoice) => invoice.delivered).length;
				this.showToast(`Clinic invoices delivered // ${delivered}/3`, 1.35);
				this.renderer?.emitVFX(this.player.x + 16, this.player.y + 18, 'pickup', 5, 30);
			} else if (event.kind === 'parry-window-opened') {
				this.showToast('RED INVOICE FLASH // L parry', 1.45);
			} else if (event.kind === 'tutorial-complete') {
				this.showToast('Counter timing learned // strike during stall', 1.8);
			} else if (event.kind === 'triage-step' || event.kind === 'triage-complete') {
				this.renderer?.emitVFX(this.player.x + 16, this.player.y + 18, 'emp', 7, 36);
				if (event.kind === 'triage-complete') {
					this.showToast('Injury ledger matched // clinic shutters open', 1.9);
				}
			} else if (event.kind === 'triage-failed') {
				this.showToast('Ledger reshuffled // restart triage', 1.4);
			} else if (event.kind === 'hack-mistake-ignored') {
				this.showToast('Street Syntax // triage error ignored', 1.55);
				this.renderer?.emitVFX(this.player.x + 16, this.player.y + 18, 'emp', 8, 52);
			}
			window.dispatchEvent(
				new CustomEvent('badger:drainmarket-progress', {
					detail: { event, snapshot: this.drainmarketObjectives.getSnapshot() },
				})
			);
		}
	}

	private handleKnifeDroneNestEvents(events: KnifeDroneNestEvent[]): void {
		for (const event of events) {
			if (event.kind === 'boss-telegraph') {
				this.handleDrainmarketEvents(
					this.drainmarketObjectives?.observeEnemyTelegraph(event.attack) ?? []
				);
				this.renderer?.emitVFX(1710, 424, 'muzzle', 10, 64);
			}
			if (event.kind === 'boss-phase-transition') {
				this.screenShakeIntensity = Math.max(this.screenShakeIntensity, 11);
				this.renderer?.emitVFX(1710, 424, 'emp', 16, 105);
				this.showToast('Nest phase shift // blade fan online', 1.8);
			}
			window.dispatchEvent(new CustomEvent('badger:knife-drone-nest-pattern', { detail: event }));
		}
	}

	private handleDrainmarketEnemyEvents(events: DrainmarketEnemyEvent[]): void {
		for (const event of events) {
			const enemy = this.enemies.find((candidate) => candidate.id === event.enemyId);
			if (event.kind === 'enemy-telegraph') {
				this.handleDrainmarketEvents(
					this.drainmarketObjectives?.observeEnemyTelegraph(event.attack) ?? []
				);
				if (enemy) {
					this.renderer?.emitVFX(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, 'muzzle', 6, 34);
				}
			}
			window.dispatchEvent(new CustomEvent('badger:drainmarket-enemy', { detail: event }));
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
		const lowerSprawl = this.lowerSprawlObjectives?.getSnapshot();
		if (lowerSprawl) {
			this.updateLowerSprawlHints(lowerSprawl);
			return;
		}
		const drainmarket = this.drainmarketObjectives?.getSnapshot();
		if (drainmarket) {
			this.updateDrainmarketHints(drainmarket);
			return;
		}
		const chromeArcology = this.chromeArcologyObjectives?.getSnapshot();
		if (chromeArcology) this.updateChromeArcologyHints(chromeArcology);
	}

	private updateLowerSprawlHints(snapshot: LowerSprawlObjectiveSnapshot): void {
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

	private updateDrainmarketHints(snapshot: DrainmarketObjectiveSnapshot): void {
		const delivered = snapshot.invoices.filter((invoice) => invoice.delivered).length;
		if (!snapshot.parryTutorialComplete) {
			this.player.objectiveHint = 'Read the red flash // L parry';
		} else if (delivered < snapshot.invoices.length) {
			this.player.objectiveHint = `Deliver clinic invoices // ${delivered}/${snapshot.invoices.length}`;
		} else if (snapshot.triageStatus !== 'solved') {
			this.player.objectiveHint = 'Clear injury-ledger triage';
		} else if (!snapshot.bossDefeated) {
			this.player.objectiveHint = 'Break the Knife-drone Nest';
		} else if (!snapshot.payloadCollected) {
			this.player.objectiveHint = 'Secure the stim cache';
		} else {
			this.player.objectiveHint = 'Clinic route stabilized';
		}
		this.player.loadoutHint = `Clinic route // invoices ${delivered}/${snapshot.invoices.length}`;
		this.player.contextHint = undefined;

		const boss = this.knifeDroneNest?.getSnapshot();
		const enemyWindup = this.enemies.some(
			(enemy) =>
				enemy.hp > 0 && enemy.aiState === 'windup' && Math.abs(enemy.x - this.player.x) < 250
		);
		if (boss?.action === 'windup' || enemyWindup) {
			this.player.contextHint = 'RED FLASH // L PARRY';
			return;
		}
		if (this.player.hp <= 2 && this.player.stims > 0 && this.player.onGround) {
			this.player.contextHint = 'E use stim';
			return;
		}

		const centerX = this.player.x + this.player.w / 2;
		const centerY = this.player.y + this.player.h / 2;
		const distance = (x: number, y: number): number => Math.hypot(centerX - x, centerY - y);
		const nearbyInvoice = snapshot.invoices.find(
			(invoice) => !invoice.delivered && distance(invoice.x, invoice.y) < 84
		);
		if (nearbyInvoice) {
			this.player.contextHint = 'M deliver clinic invoices';
			return;
		}
		if (snapshot.triageStatus !== 'solved' && distance(snapshot.clinic.x, snapshot.clinic.y) < 92) {
			this.player.contextHint =
				snapshot.triageStatus === 'active'
					? `${snapshot.expectedInput?.toUpperCase() ?? 'WAIT'} // triage memory`
					: 'M open injury ledger';
			return;
		}
		const nearbyPickup = this.pickups.find(
			(pickup) => !pickup.taken && distance(pickup.x + 14, pickup.y + 14) < 76
		);
		if (nearbyPickup) {
			this.player.contextHint =
				nearbyPickup.persistence === 'story_payload' ? 'Secure stim cache' : 'Clinic supply cache';
			return;
		}
		if (
			this.enemies.some(
				(enemy) => enemy.hp > 0 && Math.abs(centerX - (enemy.x + enemy.w / 2)) < 175
			)
		) {
			this.player.contextHint = 'J counter // L parry // Shift dodge';
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
		const skillResolution = resolveSkillEffects(
			this.player.unlockedSkills ?? [],
			this.options.skillRanks ?? {}
		);
		this.loadoutSummary = {
			...this.loadoutSummary,
			effects: mergeEffectRecords([this.loadoutSummary.effects, skillResolution.effects]),
		};
		const effects = resolveRuntimeItemEffects(this.loadoutSummary);
		const combatant = applyRuntimeItemEffectsToCombatEntity(this.player, effects);
		this.player.airControlMultiplier = effects.physics.airControlMultiplier;
		this.player.maxFallSpeedBonus = effects.physics.maxFallSpeedBonus;
		this.player.itemSetEffects = combatant.itemSetEffects;
		this.player.skillTrackRanks = { ...skillResolution.trackRanks };
		this.player.gearIconSlots = this.loadoutSummary.equippedItemIds
			.filter(
				(itemId) => !['claws', 'katana', 'railgun', 'rocket_backpack', 'stim_pack'].includes(itemId)
			)
			.map((itemId) => getFirstReleaseItem(itemId))
			.filter((item): item is NonNullable<ReturnType<typeof getFirstReleaseItem>> => Boolean(item))
			.filter((item) => Boolean(item.iconAnimation))
			.slice(0, 6)
			.map((item) => ({
				itemId: item.id,
				label: item.name,
				sheetId: item.iconSheetId ?? 'item_icons',
				animation: item.iconAnimation ?? `${item.id}_icon`,
			}));
		if (this.player.hasRocket) {
			const maxFuel = 3 + effects.physics.rocketFuelBonus;
			this.player.maxFuel = maxFuel;
			this.player.fuel = Math.min(this.player.fuel, maxFuel);
		}
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
			} else if (event.kind === 'puzzle-failed') {
				this.showToast('Toll rhythm rejected // resynchronize', 1.4);
			} else if (event.kind === 'hack-mistake-ignored') {
				this.showToast('Street Syntax // toll error ignored', 1.55);
				this.renderer?.emitVFX(this.player.x + 16, this.player.y + 18, 'emp', 8, 52);
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

	private updateChromeArcologyCompletion(): void {
		const objectives = this.chromeArcologyObjectives;
		if (!objectives || this.stageCompletionDispatched) return;
		const payloadCollected = getCollectedStoryPayloadIds(this.pickups).includes('elevator_seed');
		const boss = this.enemies.find((enemy) => enemy.bossId === 'madame-vitrine');
		this.handleChromeArcologyEvents(
			objectives.observeWorld(payloadCollected, Boolean(boss && boss.hp <= 0))
		);
		const result = objectives.claimCompletion();
		if (!result) return;
		this.stageCompletionDispatched = true;
		window.dispatchEvent(new CustomEvent('badger:stage-complete', { detail: result }));
		this.options.onStageComplete?.(result);
	}

	private updateDrainmarketCompletion(): void {
		const objectives = this.drainmarketObjectives;
		if (!objectives || this.stageCompletionDispatched) return;
		const payloadCollected = getCollectedStoryPayloadIds(this.pickups).includes('stim_cache');
		const boss = this.enemies.find((enemy) => enemy.bossId === 'knife-drone-nest');
		this.handleDrainmarketEvents(
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

	private renderDrainmarketWorld(ctx: CanvasRenderingContext2D, cameraX: number): void {
		const snapshot = this.drainmarketObjectives?.getSnapshot();
		if (!snapshot) return;
		ctx.save();
		ctx.textAlign = 'center';
		ctx.font = '700 10px ui-monospace, monospace';

		for (const invoice of snapshot.invoices) {
			const x = invoice.x - cameraX;
			ctx.fillStyle = invoice.delivered ? '#67f3c4' : '#ff5e7a';
			ctx.fillRect(x - 10, invoice.y - 30, 20, 28);
			ctx.fillStyle = '#eaf2ff';
			ctx.fillRect(x - 6, invoice.y - 25, 12, 2);
			ctx.fillRect(x - 6, invoice.y - 19, 8, 2);
			ctx.fillStyle = invoice.delivered ? '#67f3c4' : '#ffb35e';
			ctx.fillText(invoice.delivered ? 'DELIVERED' : 'M: DELIVER', x, invoice.y - 39);
		}

		const clinicX = snapshot.clinic.x - cameraX;
		ctx.fillStyle = 'rgba(10, 16, 28, 0.92)';
		ctx.fillRect(clinicX - 35, snapshot.clinic.y - 92, 70, 92);
		ctx.strokeStyle = snapshot.triageStatus === 'solved' ? '#67f3c4' : '#ff5e7a';
		ctx.lineWidth = 3;
		ctx.strokeRect(clinicX - 35, snapshot.clinic.y - 92, 70, 92);
		ctx.fillStyle = snapshot.triageStatus === 'active' ? '#ffb35e' : '#eaf2ff';
		ctx.fillText(
			snapshot.triageStatus === 'active'
				? `TRIAGE: ${snapshot.expectedInput?.toUpperCase()}`
				: snapshot.triageStatus === 'solved'
					? 'CLINIC OPEN'
					: 'M: TRIAGE',
			clinicX,
			snapshot.clinic.y - 101
		);

		for (const signX of [430, 1015, 1570]) {
			const x = signX - cameraX;
			ctx.fillStyle = 'rgba(255, 94, 122, 0.18)';
			ctx.fillRect(x - 54, 245, 108, 34);
			ctx.strokeStyle = '#ff5e7a';
			ctx.strokeRect(x - 54, 245, 108, 34);
			ctx.fillStyle = '#ffb35e';
			ctx.fillText('PAIN PRICED LIVE', x, 266);
		}

		for (const [index, checkpoint] of (
			this.checkpoints?.getSnapshot().checkpoints ?? []
		).entries()) {
			const x = checkpoint.x - cameraX;
			const activeIndex = this.checkpoints?.getSnapshot().activeIndex ?? 0;
			const active = index <= activeIndex;
			ctx.fillStyle = active ? '#67f3c4' : '#364457';
			ctx.fillRect(x - 3, checkpoint.y - 56, 6, 56);
			ctx.beginPath();
			ctx.arc(x, checkpoint.y - 61, active ? 8 : 5, 0, Math.PI * 2);
			ctx.fill();
			if (index === activeIndex) {
				ctx.fillStyle = '#67f3c4';
				ctx.fillText('CLINIC RELAY', x, checkpoint.y - 75);
			}
		}
		ctx.restore();
	}

	private renderChromeArcologyWorld(ctx: CanvasRenderingContext2D, cameraX: number): void {
		const snapshot = this.chromeArcologyObjectives?.getSnapshot();
		if (!snapshot) return;
		ctx.save();
		ctx.textAlign = 'center';
		ctx.font = '700 10px ui-monospace, monospace';

		for (const sightline of snapshot.sightlines) {
			const sourceX = sightline.x - cameraX;
			const targetX = sightline.targetX - cameraX;
			ctx.fillStyle = sightline.pierced ? '#67f3c4' : '#eaf2ff';
			ctx.fillRect(sourceX - 5, sightline.y - 54, 10, 54);
			ctx.fillRect(targetX - 6, sightline.y - 72, 12, 72);
			ctx.strokeStyle = sightline.pierced ? '#67f3c4' : 'rgba(234, 242, 255, 0.28)';
			ctx.lineWidth = sightline.pierced ? 3 : 1;
			ctx.beginPath();
			ctx.moveTo(sourceX, sightline.y - 28);
			ctx.lineTo(targetX, sightline.y - 28);
			ctx.stroke();
			ctx.fillStyle = sightline.pierced ? '#67f3c4' : '#eaf2ff';
			ctx.fillText(sightline.pierced ? 'LANE OPEN' : 'K: PIERCE', sourceX, sightline.y - 64);
		}

		for (const tag of snapshot.cargoTags) {
			const x = tag.x - cameraX;
			ctx.fillStyle = tag.scanned ? '#67f3c4' : '#ffb35e';
			ctx.fillRect(x - 19, tag.y - 38, 38, 30);
			ctx.fillStyle = '#09101c';
			ctx.fillRect(x - 14, tag.y - 32, 28, 3);
			ctx.fillRect(x - 14, tag.y - 24, 20, 3);
			ctx.fillStyle = tag.scanned ? '#67f3c4' : '#ffb35e';
			ctx.fillText(tag.scanned ? tag.id.toUpperCase() : 'M: MANIFEST', x, tag.y - 47);
		}

		const routerX = snapshot.router.x - cameraX;
		ctx.fillStyle = 'rgba(7, 12, 22, 0.92)';
		ctx.fillRect(routerX - 38, snapshot.router.y - 96, 76, 96);
		ctx.strokeStyle = snapshot.routerStatus === 'solved' ? '#67f3c4' : '#ffb35e';
		ctx.lineWidth = 3;
		ctx.strokeRect(routerX - 38, snapshot.router.y - 96, 76, 96);
		ctx.fillStyle = snapshot.routerStatus === 'active' ? '#ff5e7a' : '#eaf2ff';
		ctx.fillText(
			snapshot.routerStatus === 'active'
				? `AUTH: ${snapshot.expectedInput?.toUpperCase()}`
				: snapshot.routerStatus === 'solved'
					? 'PRISONER ROUTE OPEN'
					: 'M: SEED ROUTER',
			routerX,
			snapshot.router.y - 105
		);

		for (const [index, checkpoint] of (
			this.checkpoints?.getSnapshot().checkpoints ?? []
		).entries()) {
			const x = checkpoint.x - cameraX;
			const activeIndex = this.checkpoints?.getSnapshot().activeIndex ?? 0;
			const active = index <= activeIndex;
			ctx.fillStyle = active ? '#67f3c4' : '#667184';
			ctx.fillRect(x - 3, checkpoint.y - 56, 6, 56);
			ctx.beginPath();
			ctx.arc(x, checkpoint.y - 62, active ? 8 : 5, 0, Math.PI * 2);
			ctx.fill();
			if (index === activeIndex) {
				ctx.fillStyle = '#67f3c4';
				ctx.fillText('SERVICE ACCESS', x, checkpoint.y - 77);
			}
		}

		for (const [x, label] of [
			[520, 'GUESTS ASCEND'],
			[1090, 'LABOR DESCENDS'],
			[1600, 'VISIBILITY IS RENTED'],
		] as const) {
			const screenX = x - cameraX;
			ctx.fillStyle = 'rgba(234, 242, 255, 0.12)';
			ctx.fillRect(screenX - 68, 232, 136, 32);
			ctx.strokeStyle = '#eaf2ff';
			ctx.strokeRect(screenX - 68, 232, 136, 32);
			ctx.fillStyle = '#ffb35e';
			ctx.fillText(label, screenX, 252);
		}
		ctx.restore();
	}

	private renderRailgunBeam(ctx: CanvasRenderingContext2D, cameraX: number): void {
		if ((this.player.railgunFlash ?? 0) <= 0) return;
		const startX = this.player.x + (this.player.dir > 0 ? this.player.w : 0) - cameraX;
		const endX = startX + this.player.dir * 560;
		const y = this.player.y + 23;
		ctx.save();
		ctx.globalAlpha = Math.min(1, (this.player.railgunFlash ?? 0) / 0.08);
		ctx.strokeStyle = '#eaf2ff';
		ctx.lineWidth = 8;
		ctx.beginPath();
		ctx.moveTo(startX, y);
		ctx.lineTo(endX, y);
		ctx.stroke();
		ctx.strokeStyle = '#67f3c4';
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.moveTo(startX, y);
		ctx.lineTo(endX, y);
		ctx.stroke();
		ctx.restore();
	}

	private renderChromeArcologyObjectivePanel(ctx: CanvasRenderingContext2D): void {
		const snapshot = this.chromeArcologyObjectives?.getSnapshot();
		if (!snapshot) return;
		const pierced = snapshot.sightlines.filter((sightline) => sightline.pierced).length;
		const scanned = snapshot.cargoTags.filter((tag) => tag.scanned).length;
		const x = 24;
		const y = ctx.canvas.height - 122;
		ctx.save();
		ctx.fillStyle = 'rgba(4, 6, 12, 0.9)';
		ctx.fillRect(x, y, 460, 98);
		ctx.strokeStyle = snapshot.readyToComplete ? '#67f3c4' : '#eaf2ff';
		ctx.strokeRect(x, y, 460, 98);
		ctx.textAlign = 'left';
		ctx.font = '700 12px ui-monospace, monospace';
		ctx.fillStyle = '#eaf2ff';
		ctx.fillText('CHROME ARCOLOGY OBJECTIVES', x + 12, y + 20);
		ctx.font = '11px ui-monospace, monospace';
		ctx.fillStyle = pierced === 3 ? '#67f3c4' : '#eaf2ff';
		ctx.fillText(`Railgun sightlines: ${pierced}/3`, x + 12, y + 40);
		ctx.fillStyle = scanned === 2 ? '#67f3c4' : '#ffb35e';
		ctx.fillText(`Hidden labor floors: ${scanned}/2`, x + 210, y + 40);
		ctx.fillStyle = snapshot.routerStatus === 'solved' ? '#67f3c4' : '#eaf2ff';
		ctx.fillText(
			`Elevator router: ${snapshot.routerStatus}${snapshot.expectedInput ? ` • ${snapshot.expectedInput}` : ''}`,
			x + 12,
			y + 59
		);
		ctx.fillStyle = snapshot.payloadCollected ? '#67f3c4' : '#eaf2ff';
		ctx.fillText(
			`Elevator Seed: ${snapshot.payloadCollected ? 'secured' : 'missing'}`,
			x + 12,
			y + 78
		);
		ctx.fillStyle = snapshot.bossDefeated ? '#67f3c4' : '#ff5e7a';
		ctx.fillText(`Vitrine: ${snapshot.bossDefeated ? 'shattered' : 'active'}`, x + 260, y + 78);
		ctx.restore();
	}

	private renderDrainmarketObjectivePanel(ctx: CanvasRenderingContext2D): void {
		const snapshot = this.drainmarketObjectives?.getSnapshot();
		if (!snapshot) return;
		const delivered = snapshot.invoices.filter((invoice) => invoice.delivered).length;
		const x = 24;
		const y = ctx.canvas.height - 122;
		ctx.save();
		ctx.fillStyle = 'rgba(4, 6, 12, 0.88)';
		ctx.fillRect(x, y, 430, 98);
		ctx.strokeStyle = snapshot.readyToComplete ? '#67f3c4' : '#ff5e7a';
		ctx.strokeRect(x, y, 430, 98);
		ctx.textAlign = 'left';
		ctx.font = '700 12px ui-monospace, monospace';
		ctx.fillStyle = '#ff5e7a';
		ctx.fillText('DRAINMARKET OBJECTIVES', x + 12, y + 20);
		ctx.font = '11px ui-monospace, monospace';
		ctx.fillStyle = snapshot.questComplete ? '#67f3c4' : '#eaf2ff';
		ctx.fillText(`Clinic invoices: ${delivered}/3`, x + 12, y + 40);
		ctx.fillStyle = snapshot.triageStatus === 'solved' ? '#67f3c4' : '#eaf2ff';
		ctx.fillText(
			`Injury ledger: ${snapshot.triageStatus}${snapshot.expectedInput ? ` • ${snapshot.expectedInput}` : ''}`,
			x + 12,
			y + 57
		);
		ctx.fillStyle = snapshot.payloadCollected ? '#67f3c4' : '#eaf2ff';
		ctx.fillText(
			`Stim cache: ${snapshot.payloadCollected ? 'secured' : 'missing'}`,
			x + 12,
			y + 76
		);
		ctx.fillStyle = snapshot.bossDefeated ? '#67f3c4' : '#ff5e7a';
		ctx.fillText(`Knife nest: ${snapshot.bossDefeated ? 'broken' : 'active'}`, x + 230, y + 76);
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
		const animation = this.renderer?.getSpriteRenderer().getSheet(PLAYER_SPRITE_SHEET_ID)?.sheet
			.animations[state.currentAnim];
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

	getDrainmarketObjectiveSnapshot(): DrainmarketObjectiveSnapshot | null {
		return this.drainmarketObjectives?.getSnapshot() ?? null;
	}

	getChromeArcologyObjectiveSnapshot(): ChromeArcologyObjectiveSnapshot | null {
		return this.chromeArcologyObjectives?.getSnapshot() ?? null;
	}

	getBossPhaseSnapshot(): BossPhaseRuntimeState | null {
		return this.bossPhases.getState();
	}

	getCaptainGrinSnapshot(): CaptainGrinSnapshot | null {
		return this.captainGrin?.getSnapshot() ?? null;
	}

	getKnifeDroneNestSnapshot(): KnifeDroneNestSnapshot | null {
		return this.knifeDroneNest?.getSnapshot() ?? null;
	}

	getMadameVitrineSnapshot(): MadameVitrineSnapshot | null {
		return this.madameVitrine?.getSnapshot() ?? null;
	}

	getLowerSprawlHazardSnapshot(): LowerSprawlHazardSnapshot[] {
		return this.lowerSprawlHazards?.getSnapshot() ?? [];
	}

	getCheckpointSnapshot(): StageCheckpointSnapshot | null {
		return this.checkpoints?.getSnapshot() ?? null;
	}

	getLoadoutSnapshot(): LoadoutSummary & {
		budget: LoadoutBudgetReport;
		skillTrackRanks: Record<'clawline' | 'railgun' | 'rocket' | 'hacking', number>;
	} {
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
			skillTrackRanks: {
				clawline: this.player.skillTrackRanks?.clawline ?? 0,
				railgun: this.player.skillTrackRanks?.railgun ?? 0,
				rocket: this.player.skillTrackRanks?.rocket ?? 0,
				hacking: this.player.skillTrackRanks?.hacking ?? 0,
			},
		};
	}

	debugTeleportPlayer(x: number, y: number): void {
		this.player.x = x;
		this.player.y = y;
		this.player.vx = 0;
		this.player.vy = 0;
		this.player.stun = 0;
		this.player.dodgeActive = 0;
		this.player.isDodging = false;
		this.player.meleeTimer = 0;
		this.player.parryCooldown = 0;
		this.player.dodgeCooldown = 0;
		this.player.invuln = Math.max(this.player.invuln, 0.18);
		this.hitstopRemaining = 0;
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
		dir: number;
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
		shootCd: number;
		railgunFlash: number;
		railgunHitCount: number;
		airControlMultiplier: number;
		maxFallSpeedBonus: number;
		checkpointLabel?: string;
		objectiveHint?: string;
		contextHint?: string;
		hudToast?: string;
		gearIconSlots: Array<{ itemId: string; label: string; sheetId: string; animation: string }>;
	} {
		const p = this.player;
		return {
			x: p.x,
			y: p.y,
			dir: p.dir,
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
			shootCd: p.shootCd,
			railgunFlash: p.railgunFlash ?? 0,
			railgunHitCount: p.railgunHitCount ?? 0,
			airControlMultiplier: p.airControlMultiplier ?? 1,
			maxFallSpeedBonus: p.maxFallSpeedBonus ?? 0,
			checkpointLabel: p.checkpointLabel,
			objectiveHint: p.objectiveHint,
			contextHint: p.contextHint,
			hudToast: p.hudToast,
			gearIconSlots: (p.gearIconSlots ?? []).map((slot) => ({ ...slot })),
		};
	}

	getEnemySnapshots(): Array<{
		id?: string;
		x: number;
		y: number;
		w: number;
		h: number;
		hp: number;
		maxHp: number;
		bossId?: string;
		role?: string;
		aiState?: string;
		attackTelegraph?: number;
		spriteSheetId?: string;
		spriteAnimation?: string;
	}> {
		return this.enemies.map((e) => ({
			id: e.id,
			x: e.x,
			y: e.y,
			w: e.w,
			h: e.h,
			hp: e.hp,
			maxHp: e.maxHp,
			bossId: 'bossId' in e && typeof e.bossId === 'string' ? e.bossId : undefined,
			role: e.procgenRole,
			aiState: e.aiState,
			attackTelegraph: e.attackTelegraph,
			spriteSheetId: e.spriteSheetId,
			spriteAnimation: e.spriteAnimation,
		}));
	}

	getPickupSnapshots(): Array<{
		id: string;
		itemId?: string;
		x: number;
		y: number;
		taken: boolean;
		kind: string;
		animation?: string;
		spriteSheetId?: string;
	}> {
		return this.pickups.map((p) => ({
			id: p.id,
			itemId: p.itemId,
			x: p.x,
			y: p.y,
			taken: p.taken,
			kind: p.kind,
			animation: p.animation,
			spriteSheetId: p.spriteSheetId,
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
		const toolsEnabled = runtimeToolsEnabled();
		const handleKeyDown = (event: KeyboardEvent): void => {
			if (event.code === 'Escape') {
				this.options.onReturnToTitle?.();
				event.preventDefault();
			} else if (event.code === 'F3' && toolsEnabled) {
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
		this.handleLowerSprawlEvents(this.lowerSprawlObjectives?.step(simDt, this.player) ?? []);
		this.handleLowerSprawlEvents(
			this.lowerSprawlObjectives?.observeAction(this.player, action) ?? []
		);
		this.handleDrainmarketEvents(this.drainmarketObjectives?.step(simDt, this.player) ?? []);
		this.handleDrainmarketEvents(
			this.drainmarketObjectives?.observeAction(this.player, action) ?? []
		);
		this.handleChromeArcologyEvents(this.chromeArcologyObjectives?.step(simDt, this.player) ?? []);
		this.handleChromeArcologyEvents(
			this.chromeArcologyObjectives?.observeAction(this.player, action) ?? []
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
		this.handleDrainmarketEnemyEvents(
			this.drainmarketEnemies?.step(this.enemies, this.player, simDt, this.combat, combatEvents) ??
				[]
		);
		this.handleChromeArcologyEnemyEvents(
			this.chromeArcologyEnemies?.step(
				this.enemies,
				this.player,
				simDt,
				this.combat,
				combatEvents
			) ?? []
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
		const knifeNest = this.enemies.find((enemy) => enemy.bossId === 'knife-drone-nest');
		this.handleKnifeDroneNestEvents(
			this.knifeDroneNest?.step(
				knifeNest,
				this.player,
				bossPhaseState,
				simDt,
				this.combat,
				combatEvents
			) ?? []
		);
		const vitrine = this.enemies.find((enemy) => enemy.bossId === 'madame-vitrine');
		this.handleMadameVitrineEvents(
			this.madameVitrine?.step(
				vitrine,
				this.player,
				bossPhaseState,
				simDt,
				this.combat,
				combatEvents
			) ?? []
		);
		// 9-11. Beat, WaveDirector, Camera
		const worldRight = Math.max(...this.platforms.map((platform) => platform.x + platform.w), 1950);
		this.camera.step(this.player.x, 0, Math.max(0, worldRight - 960), simDt, this.player.vx);

		// Player input processing
		processMossInput(this.player, action, simDt, this.combat, this.enemies, combatEvents);

		// Update animation and stage experience state
		this.updateAnimation(simDt);
		this.updateLowerSprawlCompletion();
		this.updateDrainmarketCompletion();
		this.updateChromeArcologyCompletion();
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
		const hasStageArt =
			this.options.stageId === 'lower-sprawl'
				? rend.renderStageBackdrop(LOWER_SPRAWL_BACKDROP_SHEET_ID)
				: this.options.stageId === 'drainmarket'
					? rend.renderStageParallax(DRAINMARKET_PARALLAX_SHEET_ID, cam.x)
					: this.options.stageId === 'chrome-arcology'
						? rend.renderStageParallax(CHROME_ARCOLOGY_PARALLAX_SHEET_ID, cam.x)
						: false;
		if (!hasStageArt) {
			rend.drawBackground();
			rend.renderParallax(cam.x);
		}
		rend.renderPlatforms(this.platforms, cam.x);
		this.renderLowerSprawlWorld(ctx, cam.x);
		this.renderDrainmarketWorld(ctx, cam.x);
		this.renderChromeArcologyWorld(ctx, cam.x);
		rend.renderPickups(this.pickups, cam.x);
		rend.renderPlayer(this.player, cam.x);
		this.renderRailgunBeam(ctx, cam.x);
		rend.renderEnemies(this.enemies, cam.x);
		rend.renderVFX(cam.x);
		rend.renderUI(this.player, cam);
		if (this.debugOverlayVisible) {
			this.renderBalanceOverlay(ctx);
			this.renderRuntimeConfigOverlay(ctx);
			this.renderTutorialOverlay(ctx);
			this.renderLowerSprawlObjectivePanel(ctx);
			this.renderDrainmarketObjectivePanel(ctx);
			this.renderChromeArcologyObjectivePanel(ctx);
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

		if (this.player.hp <= 0) {
			playAnimation(animState, 'death_or_down', false);
		} else if (this.player.stun > 0) {
			playAnimation(animState, 'hit', false);
		} else if ((this.player.parryWindow ?? 0) > 0) {
			playAnimation(animState, 'parry', false);
		} else if (this.player.hasRailgun && (this.player.railgunAnimationTimer ?? 0) > 0) {
			playAnimation(animState, 'shoot_railgun', false);
		} else if (this.player.meleeTimer > 0) {
			playAnimation(animState, this.player.hasKatana ? 'melee_katana' : 'melee_claws', false);
		} else if (this.player.boostCd > 0.18 && !this.player.onGround) {
			playAnimation(animState, 'rocket_boost', false);
		} else if (this.player.justLanded) {
			playAnimation(animState, 'land', false);
		} else if (this.player.isDodging) {
			playAnimation(animState, 'skid', false);
		} else if (!this.player.onGround) {
			playAnimation(animState, this.player.vy < 0 ? 'jump_up' : 'fall');
		} else if (Math.abs(this.player.vx) > 10) {
			playAnimation(animState, 'run');
		} else {
			playAnimation(animState, 'idle');
		}

		this.advanceAnimationFrames(animState, dt);
	}

	private advanceAnimationFrames(animState: AnimationState, dt: number): void {
		const sheet = this.renderer?.getSpriteRenderer().getSheet(PLAYER_SPRITE_SHEET_ID);
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
			.getAnimationEvents(PLAYER_SPRITE_SHEET_ID, animName, frame)) {
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
			this.handleDrainmarketEvents(
				this.drainmarketObjectives?.observeParry(event.moveId ?? '') ?? []
			);
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
			const lowerSprawlControlled =
				this.options.stageId === 'lower-sprawl' &&
				['patrol', 'turret', 'bruiser'].includes(enemy.procgenRole ?? '');
			const drainmarketControlled =
				this.options.stageId === 'drainmarket' &&
				(['skirmisher', 'ranged', 'trapper', 'bruiser'].includes(enemy.procgenRole ?? '') ||
					/knife_drone|price_tag_wasp|invoice_snare|clinic_collector/i.test(
						enemy.procgenFamily ?? ''
					));
			const chromeArcologyControlled =
				this.options.stageId === 'chrome-arcology' &&
				(['ranged', 'bruiser'].includes(enemy.procgenRole ?? '') ||
					/chrome_bellhop|mirror_sentinel|compliance_shield|contract_drone/i.test(
						enemy.procgenFamily ?? ''
					));
			if (lowerSprawlControlled || drainmarketControlled || chromeArcologyControlled) {
				enemy.usesPatternController = true;
			}
		}
	}

	private createBossPlaceholder(stageId: string): CombatEntity | null {
		const boss = this.options.bossPlaceholder;
		if (!boss) return null;
		const phaseCount = Math.max(1, boss.phaseCount);
		const isKnifeNest = boss.id === 'knife-drone-nest';
		const isMadameVitrine = boss.id === 'madame-vitrine';
		const hp = isMadameVitrine ? 12 : isKnifeNest ? 8 : 4 + phaseCount * 2;
		return {
			x: isMadameVitrine ? 2070 : isKnifeNest ? 1710 : 1480,
			y: isMadameVitrine ? 340 : isKnifeNest ? 348 : 418,
			w: isMadameVitrine ? 72 : isKnifeNest ? 64 : 42,
			h: isMadameVitrine ? 90 : isKnifeNest ? 82 : 62,
			vx: 0,
			vy: 0,
			onGround: isKnifeNest || isMadameVitrine,
			coyoteLeft: 0,
			jumpBuffered: 0,
			dir: -1,
			hp,
			maxHp: hp,
			invuln: 0,
			stun: 0,
			bossId: boss.id,
			bossName: boss.name,
			bossArgument: boss.argument,
			faction: 'enemy',
			isBossPlaceholder: true,
			procgenFamily: `${stageId}_boss_placeholder`,
			procgenRole: 'boss',
		};
	}
}
