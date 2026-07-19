/**
 * StageRunScene - main gameplay scene
 * Hosts all systems and the game loop tick order
 */

import { resolveSkillEffects } from '@badger/progression';
import { createSystemPipeline } from '../../../../vendor/arcade-runtime.mjs';
import { type Player, createPlayer, processMossInput } from '../actors/MossBadger';
import {
	type TrainingDummy,
	configureTrainingDummy,
	createTrainingDummy,
	hitTrainingDummy,
	processTrainingDummy,
} from '../actors/TrainingDummy';
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
import {
	type DubColonyObjectiveEvent,
	type DubColonyObjectiveSnapshot,
	DubColonyObjectives,
} from '../game/DubColonyObjectives';
import type { StageRuntimeResult } from '../game/GameFlow';
import {
	getStoryBossSpriteSheet,
	isLateStoryStage,
} from '../game/LateStageSpriteBindings';
import {
	type LateStageObjectiveEvent,
	type LateStageObjectiveSnapshot,
	type LateStageInterfaceSnapshot,
	LateStageObjectives,
} from '../game/LateStageObjectives';
import {
	type LowerSprawlObjectiveEvent,
	type LowerSprawlObjectiveSnapshot,
	LowerSprawlObjectives,
} from '../game/LowerSprawlObjectives';
import {
	type MirrorPalaceObjectiveEvent,
	type MirrorPalaceObjectiveSnapshot,
	MirrorPalaceObjectives,
} from '../game/MirrorPalaceObjectives';
import { getStagePlatformArt } from '../game/StageArtRegistry';
import type { StageRuntimeConfig } from '../game/StageRuntimeConfig';
import type { StoryBalanceRules } from '../game/StoryBalanceRules';
import {
	DUMMY_PRESETS,
	type DummyPresetId,
	TRAINING_KITS,
	TRAINING_LESSONS,
	type TrainingAction,
	type TrainingKitId,
	type TrainingLessonId,
	type TrainingOverlayState,
	createTrainingMode,
} from '../game/TrainingMode';
import { EncounterGenerator, type GeneratedEnemyPack } from '../procgen/EncounterGenerator';
import type { GeneratedSideRoom } from '../procgen/SideRoomGenerator';
import {
	type AnimationState,
	advanceAnimation,
	createAnimationState,
	playAnimation,
} from '../renderer/AnimationState';
import {
	GAMEPLAY_HUD_WORLD_OVERLAY_TOP,
	buildGameplayHudLayout,
} from '../renderer/GameplayHudLayout';
import {
	ANTENNA_BARRENS_PARALLAX_SHEET_ID,
	ASTEROID_REDOUBT_PARALLAX_SHEET_ID,
	CHROME_ARCOLOGY_PARALLAX_SHEET_ID,
	DRAINMARKET_PARALLAX_SHEET_ID,
	DUB_COLONY_PARALLAX_SHEET_ID,
	LOWER_SPRAWL_BACKDROP_SHEET_ID,
	LOWER_SPRAWL_PARALLAX_SHEET_ID,
	MIRROR_PALACE_PARALLAX_SHEET_ID,
	ORBITAL_LIFT_PARALLAX_SHEET_ID,
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
import { type DubColonyEnemyEvent, DubColonyEnemySystem } from '../systems/DubColonyEnemySystem';
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
	KingFeedbackController,
	type KingFeedbackEvent,
	type KingFeedbackSnapshot,
} from '../systems/KingFeedbackController';
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
import {
	type MirrorPalaceEnemyEvent,
	MirrorPalaceEnemySystem,
} from '../systems/MirrorPalaceEnemySystem';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import type { Platform } from '../systems/PhysicsSystem';
import {
	ReflectionJudgeController,
	type ReflectionJudgeEvent,
	type ReflectionJudgeSnapshot,
} from '../systems/ReflectionJudgeController';
import { applyRuntimeItemEffectsToCombatEntity } from '../systems/RuntimeItemApplier';
import {
	CHROME_ARCOLOGY_CHECKPOINTS,
	DRAINMARKET_CHECKPOINTS,
	DUB_COLONY_CHECKPOINTS,
	LOWER_SPRAWL_CHECKPOINTS,
	MIRROR_PALACE_CHECKPOINTS,
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

export interface TrainingRunOptions {
	enabled: true;
	seed: string;
	lessonId?: TrainingLessonId;
	dummyPresetId?: DummyPresetId;
	kitId?: TrainingKitId;
	onRerollStage?: () => void;
}

export interface TrainingRunSnapshot {
	stageId: RuntimeStageId;
	seed: string;
	lessonId: TrainingLessonId;
	dummyPresetId: DummyPresetId;
	kitId: TrainingKitId;
	dummy: {
		x: number;
		y: number;
		spawnX: number;
		spawnY: number;
		hp: 'infinite';
		flashTimer: number;
		attackTelegraph: number;
	};
	player: {
		x: number;
		y: number;
		hp: number;
		maxHp: number;
		hasRailgun: boolean;
		hasRocket: boolean;
		fuel: number;
		maxFuel: number;
		stims: number;
	};
	overlays: TrainingOverlayState;
	metrics: ReturnType<ReturnType<typeof createTrainingMode>['getState']>['metrics'];
	arena: { left: number; right: number; floorY: number };
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
	storyResultFlags?: readonly string[];
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
	training?: TrainingRunOptions;
}

type StageRunAction = ReturnType<InputSystem['snapshot']>;

interface StageRunUpdateContext {
	dt: number;
	simDt: number;
	action: StageRunAction;
	input: InputSystem;
	combatEvents: CombatEvents | null;
	bossPhaseState: BossPhaseRuntimeState | null;
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
	private readonly reflectionJudge: ReflectionJudgeController | null;
	private readonly kingFeedback: KingFeedbackController | null;
	private readonly lowerSprawlHazards: LowerSprawlHazardSystem | null;
	private readonly lowerSprawlEnemies: LowerSprawlEnemySystem | null;
	private readonly drainmarketEnemies: DrainmarketEnemySystem | null;
	private readonly chromeArcologyEnemies: ChromeArcologyEnemySystem | null;
	private readonly mirrorPalaceEnemies: MirrorPalaceEnemySystem | null;
	private readonly dubColonyEnemies: DubColonyEnemySystem | null;
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
			this.player.pickupReactionTimer = Math.max(this.player.pickupReactionTimer ?? 0, 0.34);
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
	private readonly mirrorPalaceObjectives: MirrorPalaceObjectives | null;
	private readonly dubColonyObjectives: DubColonyObjectives | null;
	private readonly lateStageObjectives: LateStageObjectives | null;
	private nayaAssistTimer = 0;
	private stageCompletionDispatched = false;
	private debugOverlayVisible = false;
	private readonly training: ReturnType<typeof createTrainingMode> | null;
	private trainingDummy: TrainingDummy | null = null;
	private trainingElapsed = 0;
	private trainingDamageNumberTimer = 0;
	private trainingArena = { left: 0, right: 960, floorY: 494 };
	private animationTransitions: Array<{ name: string; frame: number }> = [];
	private readonly updatePipeline = createSystemPipeline<StageRunUpdateContext>({
		phases: ['frame', 'objectives', 'physics', 'combat', 'actors', 'presentation'],
	});

	constructor(private readonly options: StageRunSceneOptions = {}) {
		this.training = options.training ? createTrainingMode() : null;
		this.companions = new CompanionSystem(
			undefined,
			resolveCompanionGameplayModifiers(options.branchGameplayHooks ?? [])
		);
		this.bossPhases = new BossPhaseSystem(options.bossPhases ?? []);
		this.captainGrin =
			!options.training && options.stageId === 'lower-sprawl' ? new CaptainGrinController() : null;
		this.knifeDroneNest =
			!options.training && options.stageId === 'drainmarket'
				? new KnifeDroneNestController()
				: null;
		this.madameVitrine =
			!options.training && options.stageId === 'chrome-arcology'
				? new MadameVitrineController()
				: null;
		this.reflectionJudge =
			!options.training && options.stageId === 'mirror-palace'
				? new ReflectionJudgeController()
				: null;
		this.kingFeedback =
			!options.training && options.stageId === 'dub-colony' ? new KingFeedbackController() : null;
		this.lowerSprawlHazards =
			!options.training && options.stageId === 'lower-sprawl'
				? new LowerSprawlHazardSystem()
				: null;
		this.lowerSprawlEnemies =
			!options.training && options.stageId === 'lower-sprawl' ? new LowerSprawlEnemySystem() : null;
		this.drainmarketEnemies =
			!options.training && options.stageId === 'drainmarket' ? new DrainmarketEnemySystem() : null;
		this.chromeArcologyEnemies =
			!options.training && options.stageId === 'chrome-arcology'
				? new ChromeArcologyEnemySystem()
				: null;
		this.mirrorPalaceEnemies =
			!options.training && options.stageId === 'mirror-palace'
				? new MirrorPalaceEnemySystem()
				: null;
		this.dubColonyEnemies =
			!options.training && options.stageId === 'dub-colony' ? new DubColonyEnemySystem() : null;
		this.checkpoints = options.training
			? null
			: options.stageId === 'lower-sprawl'
				? new StageCheckpointSystem(LOWER_SPRAWL_CHECKPOINTS)
				: options.stageId === 'drainmarket'
					? new StageCheckpointSystem(DRAINMARKET_CHECKPOINTS)
					: options.stageId === 'chrome-arcology'
						? new StageCheckpointSystem(CHROME_ARCOLOGY_CHECKPOINTS)
						: options.stageId === 'mirror-palace'
							? new StageCheckpointSystem(MIRROR_PALACE_CHECKPOINTS)
							: options.stageId === 'dub-colony'
								? new StageCheckpointSystem(DUB_COLONY_CHECKPOINTS)
								: null;
		this.player = createPlayer();
		this.player.unlockedSkills = [...(options.unlockedSkills ?? [])];
		// Initialize animation state
		this.player.animState = createAnimationState();
		this.lowerSprawlObjectives =
			!options.training && options.stageId === 'lower-sprawl' ? new LowerSprawlObjectives() : null;
		this.drainmarketObjectives =
			!options.training && options.stageId === 'drainmarket' ? new DrainmarketObjectives() : null;
		this.chromeArcologyObjectives =
			!options.training && options.stageId === 'chrome-arcology'
				? new ChromeArcologyObjectives()
				: null;
		this.mirrorPalaceObjectives =
			!options.training && options.stageId === 'mirror-palace'
				? new MirrorPalaceObjectives()
				: null;
		this.dubColonyObjectives =
			!options.training && options.stageId === 'dub-colony'
				? new DubColonyObjectives(options.storyResultFlags ?? [])
				: null;
		this.lateStageObjectives =
			!options.training && options.stageId && isLateStoryStage(options.stageId)
				? new LateStageObjectives(options.stageId)
				: null;
		if (this.training && options.training) {
			if (options.training.lessonId) this.training.selectLesson(options.training.lessonId);
			if (options.training.dummyPresetId) {
				this.training.selectDummyPreset(options.training.dummyPresetId);
			}
			if (options.training.kitId) this.training.selectKit(options.training.kitId);
		}
		this.inventory.addItem('claws');
		this.inventory.equip('claws');
		this.refreshLoadout();
		this.player.checkpointLabel = this.checkpoints?.getSnapshot().activeLabel;
		this.player.hudToast = options.training
			? 'Dummy dojo online // infinite integrity'
			: options.stageId === 'lower-sprawl'
				? 'Follow the public route'
				: options.stageId === 'drainmarket'
					? 'Red invoice flash // L parry'
					: options.stageId === 'chrome-arcology'
						? 'K railgun // pierce the glass sightlines'
						: options.stageId === 'mirror-palace'
							? 'Airborne E boost // break the false route'
							: options.stageId === 'dub-colony'
								? 'Watch the woofer ring // act on the bass pulse'
								: options.stageId === 'antenna-barrens'
									? 'M repair code gates // expose the ledger'
									: options.stageId === 'orbital-lift'
										? 'M reverse cargo claims // tag witnesses'
										: options.stageId === 'asteroid-redoubt'
											? 'M tune transmitter roots // publish the method'
											: undefined;
		this.player.hudToastTimer = options.training
			? 3.2
			: [
					'lower-sprawl',
					'drainmarket',
					'chrome-arcology',
					'mirror-palace',
					'dub-colony',
					'antenna-barrens',
					'orbital-lift',
					'asteroid-redoubt',
				].includes(options.stageId ?? '')
				? 2.6
				: 0;
		this.configureUpdatePipeline();
		this.initWorld();
		if (this.training) this.updateTrainingHints();
		else this.updateGameplayHints();
	}

	getUpdatePipelineSnapshot(): ReturnType<typeof this.updatePipeline.snapshot> {
		return this.updatePipeline.snapshot();
	}

	getAnimationTransitionSnapshot(): Array<{ name: string; frame: number }> {
		return this.animationTransitions.map((transition) => ({ ...transition }));
	}

	getGameplayHudLayoutSnapshot(): ReturnType<typeof buildGameplayHudLayout> {
		const companionLineCount =
			Number((this.player.companionShield ?? 0) > 0) +
			Number(Boolean(this.player.rookOverlayActive)) +
			Number(Boolean(this.player.companionHint));
		const canvas = this.renderer?.getContext().canvas;
		return buildGameplayHudLayout(
			canvas?.width ?? 960,
			canvas?.height ?? 540,
			companionLineCount,
			(this.player.gearIconSlots ?? []).length
		);
	}

	getTrainingSnapshot(): TrainingRunSnapshot | null {
		if (!this.training || !this.trainingDummy || !this.options.training || !this.options.stageId) {
			return null;
		}
		const state = this.training.getState();
		return {
			stageId: this.options.stageId,
			seed: this.options.training.seed,
			lessonId: state.lessonId,
			dummyPresetId: state.dummyPresetId,
			kitId: state.kitId,
			dummy: {
				x: this.trainingDummy.x,
				y: this.trainingDummy.y,
				spawnX: this.trainingDummy.spawnX,
				spawnY: this.trainingDummy.spawnY,
				hp: 'infinite',
				flashTimer: this.trainingDummy.flashTimer,
				attackTelegraph: this.trainingDummy.attackTelegraph,
			},
			player: {
				x: this.player.x,
				y: this.player.y,
				hp: this.player.hp,
				maxHp: this.player.maxHp,
				hasRailgun: this.player.hasRailgun,
				hasRocket: this.player.hasRocket,
				fuel: this.player.fuel,
				maxFuel: this.player.maxFuel,
				stims: this.player.stims,
			},
			overlays: { ...state.overlays },
			metrics: { ...state.metrics },
			arena: { ...this.trainingArena },
		};
	}

	private emitTrainingState(): void {
		const snapshot = this.getTrainingSnapshot();
		if (snapshot)
			window.dispatchEvent(new CustomEvent('badger:training-state', { detail: snapshot }));
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

	private handleLateStageEvents(events: LateStageObjectiveEvent[]): void {
		const objectives = this.lateStageObjectives;
		if (!objectives || events.length === 0) return;
		for (const event of events) {
			const snapshot = objectives.getSnapshot();
			if (
				event.kind === 'primary-node-completed' ||
				event.kind === 'support-node-completed'
			) {
				this.player.interactionAnimationTimer = Math.max(
					this.player.interactionAnimationTimer ?? 0,
					0.48
				);
				this.renderer?.emitVFX(this.player.x + 17, this.player.y + 20, 'emp', 8, 54);
			}
			if (event.kind === 'interface-started') {
				const label =
					event.interfaceKind === 'fasttype'
						? 'FastType carrier locked // type the repair exactly'
						: event.interfaceKind === 'cargo-routing'
							? 'Cargo routing board online // reverse the ownership claim'
							: 'Broadcast composer online // publish a method, not a hero';
				this.showToast(label, 2);
			} else if (event.kind === 'interface-completed') {
				const gradeLabel =
					event.grade === 'clean'
						? 'CLEAN SIGNAL'
						: event.grade === 'recovered'
							? 'RECOVERED SIGNAL'
							: 'ASSISTED SIGNAL';
				this.showToast(
					`${gradeLabel} // ${event.mistakes} correction${event.mistakes === 1 ? '' : 's'} // ${(event.timeMs / 1000).toFixed(1)}s`,
					1.9
				);
				this.renderer?.emitVFX(this.player.x + 17, this.player.y + 20, 'pickup', 10, 68);
			} else if (event.kind === 'interface-failed') {
				this.showToast(
					event.attemptsLeft === 0
						? 'Public assist engaged // timer paused // verified clues online'
						: `${event.reason === 'timeout' ? 'Carrier expired' : 'Validation rejected'} // ${event.attemptsLeft} attempt${event.attemptsLeft === 1 ? '' : 's'} left`,
					1.7
				);
				this.renderer?.emitVFX(this.player.x + 17, this.player.y + 20, 'muzzle', 7, 48);
			} else if (event.kind === 'interface-cancelled') {
				this.showToast('Console closed // field controls restored', 1.25);
			} else if (event.kind === 'primary-node-completed') {
				const completed = snapshot.primaryNodes.filter((node) => node.completed).length;
				this.showToast(`${snapshot.primaryLabel} // ${completed}/${snapshot.primaryNodes.length}`, 1.45);
			} else if (event.kind === 'support-node-completed') {
				const completed = snapshot.supportNodes.filter((node) => node.completed).length;
				this.showToast(`${snapshot.supportLabel} // ${completed}/${snapshot.supportNodes.length}`, 1.45);
			} else if (event.kind === 'tutorial-complete') {
				this.showToast(`Lesson recorded // ${event.id.replaceAll('-', ' ')}`, 1.55);
			} else if (event.kind === 'minigame-complete') {
				this.showToast(`${snapshot.primaryLabel} // route unlocked`, 1.9);
				this.renderer?.emitVFX(this.player.x + 17, this.player.y + 20, 'pickup', 12, 76);
			} else if (event.kind === 'quest-complete') {
				this.showToast(`${snapshot.supportLabel} // public record complete`, 1.8);
			} else if (event.kind === 'stage-ready') {
				this.showToast(snapshot.completionLabel, 2.2);
			}
			window.dispatchEvent(
				new CustomEvent('badger:late-stage-progress', {
					detail: { event, snapshot },
				})
			);
		}
	}

	private initTrainingWorld(layout: ReturnType<typeof cloneStageLayout>): void {
		this.platforms = layout.platforms.map((platform) => ({ ...platform }));
		this.pickups = [];
		const floor = [...this.platforms]
			.filter((platform) => platform.w >= 420)
			.sort((a, b) => b.w - a.w || b.y - a.y)[0] ?? { x: 0, y: 494, w: 960, h: 80 };
		const left = floor.x + 72;
		const right = floor.x + floor.w - 72;
		this.trainingArena = { left, right, floorY: floor.y };
		this.player.x = Math.min(right - 420, left + 72);
		this.player.y = floor.y - this.player.h;
		this.player.onGround = true;
		const state = this.training?.getState();
		this.trainingDummy = createTrainingDummy(
			Math.min(right - 80, this.player.x + 64),
			floor.y - 50,
			state?.dummyPresetId ?? 'idle'
		);
		this.enemies = [this.trainingDummy];
		this.player.checkpointLabel = `Dummy dojo // ${this.options.stageId ?? layout.id}`;
		this.applyTrainingKit();
		this.updateTrainingHints();
	}

	private applyTrainingKit(): void {
		if (!this.training) return;
		const unlocks = this.training.getPlayerKit().unlocks;
		this.player.hasRailgun = unlocks.includes('railgun');
		this.player.hasRocket = unlocks.includes('rocket_pack');
		this.player.hasKatana = this.training.getState().kitId === 'full';
		this.player.maxFuel = this.player.hasRocket ? 8 : 0;
		this.player.fuel = this.player.maxFuel;
		this.player.stims = 9;
		this.player.hp = this.player.maxHp;
	}

	private resetTrainingPractice(): void {
		if (!this.training || !this.trainingDummy) return;
		this.training.resetPractice();
		this.player.x = this.trainingArena.left + 72;
		this.player.y = this.trainingArena.floorY - this.player.h;
		this.player.vx = 0;
		this.player.vy = 0;
		this.player.onGround = true;
		this.player.comboCount = 0;
		this.player.comboTimer = 0;
		this.trainingDummy.spawnX = Math.min(this.trainingArena.right - 80, this.player.x + 64);
		this.trainingDummy.spawnY = this.trainingArena.floorY - this.trainingDummy.h;
		configureTrainingDummy(this.trainingDummy, this.training.getState().dummyPresetId);
		this.trainingDamageNumberTimer = 0;
		this.input?.clearPressed();
		this.applyTrainingKit();
		this.updateTrainingHints();
		this.showToast('Practice reset // positions and metrics restored', 1.5);
	}

	private cycleTrainingLesson(delta: number): void {
		if (!this.training) return;
		const current = TRAINING_LESSONS.findIndex(
			(lesson) => lesson.id === this.training?.getState().lessonId
		);
		const next =
			TRAINING_LESSONS[(current + delta + TRAINING_LESSONS.length) % TRAINING_LESSONS.length];
		if (next) this.training.selectLesson(next.id);
		this.updateTrainingHints();
	}

	private cycleTrainingDummy(delta: number): void {
		if (!this.training || !this.trainingDummy) return;
		const current = DUMMY_PRESETS.findIndex(
			(preset) => preset.id === this.training?.getState().dummyPresetId
		);
		const next = DUMMY_PRESETS[(current + delta + DUMMY_PRESETS.length) % DUMMY_PRESETS.length];
		if (!next) return;
		this.training.selectDummyPreset(next.id);
		configureTrainingDummy(this.trainingDummy, next.id);
		this.updateTrainingHints();
	}

	private selectTrainingKit(kitId: TrainingKitId): void {
		if (!this.training) return;
		this.training.selectKit(kitId);
		this.applyTrainingKit();
		this.updateTrainingHints();
	}

	private updateTrainingHints(): void {
		if (!this.training) return;
		const state = this.training.getState();
		const lesson = this.training.getLesson();
		const preset = this.training.getDummyPreset();
		this.player.objectiveHint = `${lesson.label} // ${preset.label}`;
		this.player.loadoutHint = `${this.options.stageId ?? 'stage'} // ${this.training.getPlayerKit().label} // ∞ resources`;
		this.player.contextHint = 'H overlays • [ ] lesson • , . dummy • 1-4 kit • R reset • N stage';
		this.player.checkpointLabel = `Training // ${state.metrics.hitCount} hits // ${state.metrics.damageTotal.toFixed(1)} dmg`;
	}

	private updateDubColonyHints(snapshot: DubColonyObjectiveSnapshot): void {
		const parts = snapshot.spareParts.filter((part) => part.recovered).length;
		const votes = snapshot.voteCards.filter((card) => card.recovered).length;
		const tuned = snapshot.reactorNodes.filter((node) => node.tuned).length;
		if (parts < snapshot.spareParts.length) {
			this.player.objectiveHint = `Recover chorus spare parts // ${parts}/${snapshot.spareParts.length}`;
		} else if (votes < snapshot.voteCards.length) {
			this.player.objectiveHint = `Restore missing vote cards // ${votes}/${snapshot.voteCards.length}`;
		} else if (!snapshot.reactorSynchronized) {
			this.player.objectiveHint = `Tune the Bass Reactor on beat // ${tuned}/${snapshot.reactorNodes.length}`;
		} else if (!snapshot.bossDefeated) {
			this.player.objectiveHint = 'Answer King Feedback on the Assembly Deck';
		} else if (!snapshot.payloadCollected) {
			this.player.objectiveHint = 'Secure the Bass Reactor Core';
		} else {
			this.player.objectiveHint = 'The colony can hear itself again';
		}
		this.player.loadoutHint = `${snapshot.alignment.toUpperCase()} vote // ${snapshot.bpm} BPM // streak ${snapshot.beatStreak}`;
		this.player.contextHint = undefined;

		const king = this.kingFeedback?.getSnapshot();
		if (king?.action === 'windup') {
			this.player.contextHint =
				king.pendingAttack === 'emergency-crown'
					? 'COMMAND LANE // JUMP'
					: king.pendingAttack === 'security-pulse'
						? 'BASS FLASH // L PARRY'
						: 'FULL-DECK PULSE // MOVE WITH NAYA';
			return;
		}
		if (snapshot.jamRemaining > 0) {
			this.player.contextHint = `RHYTHM JAMMED // ${snapshot.jamRemaining.toFixed(1)}s`;
			return;
		}
		const centerX = this.player.x + this.player.w / 2;
		const centerY = this.player.y + this.player.h / 2;
		const distance = (x: number, y: number): number => Math.hypot(centerX - x, centerY - y);
		const part = snapshot.spareParts.find(
			(entry) => !entry.recovered && distance(entry.x, entry.y) < 84
		);
		if (part) {
			this.player.contextHint = 'M recover reactor spare';
			return;
		}
		const vote = snapshot.voteCards.find(
			(entry) => !entry.recovered && distance(entry.x, entry.y) < 84
		);
		if (vote) {
			this.player.contextHint = 'M return the hidden vote card';
			return;
		}
		const node = snapshot.reactorNodes.find(
			(entry) => !entry.tuned && distance(entry.x, entry.y) < 116
		);
		if (node) {
			this.player.contextHint = `${snapshot.inBeatWindow ? 'NOW' : 'WAIT'} // ${node.expectedAction.toUpperCase()} ON WOOFER PULSE`;
			return;
		}
		const guard = this.enemies.find(
			(enemy) =>
				enemy.hp > 0 &&
				enemy.procgenFamily === 'feedback_guard' &&
				enemy.aiState === 'windup' &&
				Math.abs(enemy.x - this.player.x) < 110
		);
		if (guard) this.player.contextHint = 'M remind the guard who the shield serves';
	}

	private handleDubColonyEvents(events: DubColonyObjectiveEvent[]): void {
		if (events.length === 0 || !this.dubColonyObjectives) return;
		for (const event of events) {
			if (['spare-part-recovered', 'vote-card-recovered'].includes(event.kind)) {
				this.player.interactionAnimationTimer = Math.max(
					this.player.interactionAnimationTimer ?? 0,
					0.46
				);
			}
			if (event.kind === 'spare-part-recovered') {
				const count = this.dubColonyObjectives
					.getSnapshot(this.player)
					.spareParts.filter((part) => part.recovered).length;
				this.showToast(`Chorus spare recovered // ${count}/3`, 1.45);
			} else if (event.kind === 'vote-card-recovered') {
				const count = this.dubColonyObjectives
					.getSnapshot(this.player)
					.voteCards.filter((card) => card.recovered).length;
				this.showToast(`Vote returned to the assembly // ${count}/3`, 1.55);
			} else if (event.kind === 'beat-hit') {
				this.nayaAssistTimer = 0.62;
				this.companions.rechargeNayaShield(event.grade === 'perfect' ? 0.8 : 0.4, {
					onShield: () =>
						this.renderer?.emitVFX(this.player.x - 18, this.player.y + 12, 'emp', 8, 50),
				});
				this.showToast(`${event.grade.toUpperCase()} // ${event.action} joins the chorus`, 1.1);
			} else if (event.kind === 'beat-missed') {
				this.showToast('Offbeat // the reactor keeps listening', 0.9);
			} else if (event.kind === 'rhythm-jammed') {
				this.showToast('Signal jammer erased the downbeat', 1.35);
			} else if (event.kind === 'tutorial-complete') {
				this.showToast('Naya sync // shared timing restores the shield', 2);
			} else if (event.kind === 'reactor-synchronized') {
				this.showToast('Bass Reactor synchronized // no channel dominates', 2.2);
				this.renderer?.emitVFX(2210, 420, 'emp', 18, 130);
			}
			window.dispatchEvent(
				new CustomEvent('badger:dub-colony-progress', {
					detail: { event, snapshot: this.dubColonyObjectives.getSnapshot(this.player) },
				})
			);
		}
	}

	private handleDubColonyEnemyEvents(events: DubColonyEnemyEvent[]): void {
		for (const event of events) {
			const enemy =
				'enemyId' in event
					? this.enemies.find((candidate) => candidate.id === event.enemyId)
					: undefined;
			if (event.kind === 'enemy-telegraph' && enemy) {
				this.renderer?.emitVFX(
					enemy.x + enemy.w / 2,
					enemy.y + enemy.h / 2,
					event.attack === 'static-burst' ? 'emp' : 'muzzle',
					8,
					event.attack === 'static-burst' ? 92 : 48
				);
			}
			if (event.kind === 'rhythm-jammed') {
				this.handleDubColonyEvents(this.dubColonyObjectives?.jamRhythm(event.duration) ?? []);
			}
			if (event.kind === 'guard-talked-down') {
				this.showToast('Guard stands down // safety is not silence', 1.8);
				this.player.interactionAnimationTimer = 0.5;
			}
			window.dispatchEvent(new CustomEvent('badger:dub-colony-enemy', { detail: event }));
		}
	}

	private handleKingFeedbackEvents(events: KingFeedbackEvent[]): void {
		for (const event of events) {
			if (event.kind === 'boss-telegraph') {
				const message =
					event.attack === 'security-pulse'
						? 'Security Pulse // L parry the fear'
						: event.attack === 'emergency-crown'
							? 'Emergency Crown // jump the command lane'
							: 'Chorus Test // no single safe voice';
				this.showToast(message, 1.2);
				this.renderer?.emitVFX(2500, 390, 'muzzle', 14, 110);
			}
			if (event.kind === 'boss-phase-transition') {
				this.screenShakeIntensity = Math.max(this.screenShakeIntensity, 13);
				this.renderer?.emitVFX(2500, 390, 'emp', 20, 140);
				this.showToast(
					event.phaseIndex === 1
						? 'Emergency command takes the crown'
						: 'The assembly answers as a chorus',
					1.9
				);
			}
			window.dispatchEvent(new CustomEvent('badger:king-feedback-pattern', { detail: event }));
		}
	}

	private updateMirrorPalaceHints(snapshot: MirrorPalaceObjectiveSnapshot): void {
		const heard = snapshot.guests.filter((guest) => guest.heard).length;
		const broken = snapshot.traversalSeals.filter((seal) => seal.broken).length;
		if (!this.player.hasRocket) {
			this.player.objectiveHint = 'Collect the foyer rocket backpack';
		} else if (broken < snapshot.traversalSeals.length) {
			this.player.objectiveHint = `Break false routes // ${broken}/${snapshot.traversalSeals.length}`;
		} else if (heard < snapshot.guests.length) {
			this.player.objectiveHint = `Hear the refusals // ${heard}/${snapshot.guests.length}`;
		} else if (snapshot.etiquetteStatus !== 'solved') {
			this.player.objectiveHint = 'Repeat the banquet refusal sequence';
		} else if (!snapshot.bossDefeated) {
			this.player.objectiveHint = 'Reject the Reflection Judge’s contract';
		} else if (!snapshot.payloadCollected) {
			this.player.objectiveHint = 'Secure the Mirror Pass';
		} else {
			this.player.objectiveHint = 'The banquet has lost its authority';
		}
		this.player.loadoutHint = `Rocket seals ${broken}/3 // refusal table ${heard}/3`;
		this.player.contextHint = undefined;

		const judge = this.reflectionJudge?.getSnapshot();
		if (judge?.action === 'windup') {
			this.player.contextHint =
				judge.pendingAttack === 'mirror-verdict'
					? 'VERDICT LANE // AIRBORNE E BOOST'
					: 'GOLD GAVEL // L PARRY';
			return;
		}
		const centerX = this.player.x + this.player.w / 2;
		const centerY = this.player.y + this.player.h / 2;
		const distance = (x: number, y: number): number => Math.hypot(centerX - x, centerY - y);
		const guest = snapshot.guests.find((entry) => !entry.heard && distance(entry.x, entry.y) < 86);
		if (guest) {
			this.player.contextHint = 'M listen to the refusal testimony';
			return;
		}
		const seal = snapshot.traversalSeals.find(
			(entry) => !entry.broken && distance(entry.x, entry.y) < 122
		);
		if (seal) {
			this.player.contextHint =
				seal.kind === 'reflection-loop'
					? 'ENTER RIGHT // REVERSE LEFT ON SECOND SHIMMER'
					: this.player.hasRocket
						? 'AIRBORNE E // BREAK CONTRACT ROUTE'
						: 'Rocket backpack required';
			return;
		}
		if (
			snapshot.etiquetteStatus !== 'solved' &&
			distance(snapshot.etiquetteTerminal.x, snapshot.etiquetteTerminal.y) < 94
		) {
			this.player.contextHint =
				snapshot.etiquetteStatus === 'active'
					? `${snapshot.expectedInput?.toUpperCase() ?? 'WAIT'} // refuse politely`
					: heard === 3 && broken === 3
						? 'M begin banquet etiquette loop'
						: 'Collect every refusal and break every route';
		}
	}

	private handleMirrorPalaceEvents(events: MirrorPalaceObjectiveEvent[]): void {
		if (events.length === 0 || !this.mirrorPalaceObjectives) return;
		for (const event of events) {
			if (
				['refusal-heard', 'etiquette-started', 'etiquette-step', 'etiquette-complete'].includes(
					event.kind
				)
			) {
				this.player.interactionAnimationTimer = Math.max(
					this.player.interactionAnimationTimer ?? 0,
					0.46
				);
			}
			if (event.kind === 'refusal-heard') {
				const heard = this.mirrorPalaceObjectives
					.getSnapshot()
					.guests.filter((guest) => guest.heard).length;
				this.showToast(`Refusal entered into the public record // ${heard}/3`, 1.6);
			} else if (event.kind === 'traversal-seal-broken') {
				this.showToast(`False route broken // ${event.id}`, 1.45);
				this.renderer?.emitVFX(this.player.x + 16, this.player.y + 20, 'rocket', 10, 70);
			} else if (event.kind === 'tutorial-complete') {
				this.showToast('Rocket lesson // momentum is not consent', 1.9);
			} else if (event.kind === 'etiquette-started') {
				this.showToast('Banquet etiquette // L J SHIFT L', 1.9);
			} else if (event.kind === 'etiquette-complete') {
				this.showToast('Refusal sequence accepted // court doors open', 2);
				this.renderer?.emitVFX(1880, 420, 'emp', 14, 100);
			} else if (event.kind === 'etiquette-failed') {
				this.showToast('The mirrors applauded the wrong answer // restart', 1.6);
			} else if (event.kind === 'hack-mistake-ignored') {
				this.showToast('Street Syntax // one etiquette lie ignored', 1.6);
			}
			window.dispatchEvent(
				new CustomEvent('badger:mirror-palace-progress', {
					detail: { event, snapshot: this.mirrorPalaceObjectives.getSnapshot() },
				})
			);
		}
	}

	private handleMirrorPalaceEnemyEvents(events: MirrorPalaceEnemyEvent[]): void {
		for (const event of events) {
			const enemy = this.enemies.find((candidate) => candidate.id === event.enemyId);
			if (event.kind === 'enemy-telegraph' && enemy) {
				this.renderer?.emitVFX(
					enemy.x + enemy.w / 2,
					enemy.y + 18,
					event.attack === 'reflection-lane' ? 'emp' : 'muzzle',
					8,
					event.attack === 'reflection-lane' ? 86 : 46
				);
			}
			window.dispatchEvent(new CustomEvent('badger:mirror-palace-enemy', { detail: event }));
		}
	}

	private handleReflectionJudgeEvents(events: ReflectionJudgeEvent[]): void {
		for (const event of events) {
			if (event.kind === 'boss-telegraph') {
				const message =
					event.attack === 'mirror-verdict'
						? 'Mirror verdict // boost over the white lane'
						: event.attack === 'contract-gavel'
							? 'Contract gavel // L parry'
							: 'False self dash // wait, then L';
				this.showToast(message, 1.2);
				this.renderer?.emitVFX(2280, 390, 'muzzle', 12, 96);
			}
			if (event.kind === 'boss-phase-transition') {
				this.screenShakeIntensity = Math.max(this.screenShakeIntensity, 12);
				this.renderer?.emitVFX(2280, 390, 'emp', 18, 125);
				this.showToast(
					event.phaseIndex === 1
						? 'The signed image cracks // verdict lanes online'
						: 'The false self enters the record',
					1.9
				);
			}
			window.dispatchEvent(new CustomEvent('badger:reflection-judge-pattern', { detail: event }));
		}
	}

	private handleChromeArcologyEvents(events: ChromeArcologyObjectiveEvent[]): void {
		if (events.length === 0 || !this.chromeArcologyObjectives) return;
		for (const event of events) {
			if (
				['cargo-tag-scanned', 'router-started', 'router-step', 'router-complete'].includes(
					event.kind
				)
			) {
				this.player.interactionAnimationTimer = Math.max(
					this.player.interactionAnimationTimer ?? 0,
					0.42
				);
			}
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
							: pickup.itemId === 'mirror_pass'
								? 'Mirror Pass secured'
								: pickup.itemId === 'bass_reactor_core'
									? 'Bass Reactor Core secured'
									: pickup.itemId === 'debt_ledger_shard'
										? 'Debt Ledger Shard secured'
										: pickup.itemId === 'cargo_reversal_key'
											? 'Cargo Reversal Key secured'
											: pickup.itemId === 'asteroid_transmitter_root'
												? 'Asteroid Transmitter Root secured'
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
			if (
				['invoice-delivered', 'triage-started', 'triage-step', 'triage-complete'].includes(
					event.kind
				)
			) {
				this.player.interactionAnimationTimer = Math.max(
					this.player.interactionAnimationTimer ?? 0,
					0.42
				);
			}
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
		this.nayaAssistTimer = Math.max(0, this.nayaAssistTimer - dt);
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
		if (chromeArcology) {
			this.updateChromeArcologyHints(chromeArcology);
			return;
		}
		const mirrorPalace = this.mirrorPalaceObjectives?.getSnapshot();
		if (mirrorPalace) {
			this.updateMirrorPalaceHints(mirrorPalace);
			return;
		}
		const dubColony = this.dubColonyObjectives?.getSnapshot(this.player);
		if (dubColony) {
			this.updateDubColonyHints(dubColony);
			return;
		}
		const lateStage = this.lateStageObjectives?.getSnapshot();
		if (lateStage) this.updateLateStageHints(lateStage);
	}

	private updateLateStageHints(snapshot: LateStageObjectiveSnapshot): void {
		const primary = snapshot.primaryNodes.filter((node) => node.completed).length;
		const support = snapshot.supportNodes.filter((node) => node.completed).length;
		if (snapshot.interface.status === 'active') {
			this.player.objectiveHint = snapshot.interface.title;
			this.player.loadoutHint = `${snapshot.interface.timeRemaining.toFixed(1)}s // ${snapshot.interface.attemptsLeft} attempts`;
			this.player.contextHint =
				snapshot.interface.kind === 'fasttype'
					? 'TYPE EXACTLY // ENTER submit // ESC cancel'
					: 'ARROWS edit // 1–3 choose // ENTER submit // ESC cancel';
			return;
		}
		if (!snapshot.primaryComplete) {
			this.player.objectiveHint = `${snapshot.primaryLabel} // ${primary}/${snapshot.primaryNodes.length}`;
		} else if (!snapshot.bossDefeated) {
			this.player.objectiveHint = `Defeat ${snapshot.bossLabel}`;
		} else if (!snapshot.payloadCollected) {
			this.player.objectiveHint = `Secure ${snapshot.payloadLabel}`;
		} else {
			this.player.objectiveHint = snapshot.completionLabel;
		}
		this.player.loadoutHint = `${snapshot.primaryLabel} ${primary}/${snapshot.primaryNodes.length} // ${snapshot.supportLabel} ${support}/${snapshot.supportNodes.length}`;
		this.player.contextHint = undefined;

		const centerX = this.player.x + this.player.w / 2;
		const centerY = this.player.y + this.player.h / 2;
		const distance = (x: number, y: number): number => Math.hypot(centerX - x, centerY - y);
		const primaryNode = snapshot.primaryNodes.find(
			(node) => !node.completed && distance(node.x, node.y) < 90
		);
		if (primaryNode) {
			this.player.contextHint = `M // ${primaryNode.label}`;
			return;
		}
		const supportNode = snapshot.supportNodes.find(
			(node) => !node.completed && distance(node.x, node.y) < 90
		);
		if (supportNode) {
			this.player.contextHint = `M // ${supportNode.label}`;
			return;
		}
		const nearbyPickup = this.pickups.find(
			(pickup) => !pickup.taken && distance(pickup.x + 14, pickup.y + 14) < 78
		);
		if (nearbyPickup) {
			this.player.contextHint =
				nearbyPickup.persistence === 'story_payload' ? `Secure ${snapshot.payloadLabel}` : 'Gear cache';
			return;
		}
		const boss = this.enemies.find((enemy) => enemy.bossId === snapshot.bossId && enemy.hp > 0);
		if (boss && Math.abs(centerX - (boss.x + boss.w / 2)) < 420) {
			this.player.contextHint = 'J strike // L parry // Shift dodge';
		}
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
			if (
				['meter-scanned', 'puzzle-started', 'puzzle-step', 'puzzle-complete'].includes(event.kind)
			) {
				this.player.interactionAnimationTimer = Math.max(
					this.player.interactionAnimationTimer ?? 0,
					0.42
				);
			}
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
		this.player.victoryAnimationTimer = 0.8;
		this.stageCompletionDispatched = true;
		window.dispatchEvent(new CustomEvent('badger:stage-complete', { detail: result }));
		this.options.onStageComplete?.(result);
	}

	private updateLateStageCompletion(): void {
		const objectives = this.lateStageObjectives;
		if (!objectives || this.stageCompletionDispatched) return;
		const snapshot = objectives.getSnapshot();
		const payloadCollected = getCollectedStoryPayloadIds(this.pickups).includes(snapshot.payloadId);
		const boss = this.enemies.find((enemy) => enemy.bossId === snapshot.bossId);
		this.handleLateStageEvents(
			objectives.observeWorld(payloadCollected, Boolean(boss && boss.hp <= 0))
		);
		const result = objectives.claimCompletion();
		if (!result) return;
		this.player.victoryAnimationTimer = 0.8;
		this.stageCompletionDispatched = true;
		window.dispatchEvent(new CustomEvent('badger:stage-complete', { detail: result }));
		this.options.onStageComplete?.(result);
	}

	private updateDubColonyCompletion(): void {
		const objectives = this.dubColonyObjectives;
		if (!objectives || this.stageCompletionDispatched) return;
		const payloadCollected = getCollectedStoryPayloadIds(this.pickups).includes(
			'bass_reactor_core'
		);
		const boss = this.enemies.find((enemy) => enemy.bossId === 'king-feedback');
		this.handleDubColonyEvents(
			objectives.observeWorld(payloadCollected, Boolean(boss && boss.hp <= 0))
		);
		const result = objectives.claimCompletion();
		if (!result) return;
		this.player.victoryAnimationTimer = 0.8;
		this.stageCompletionDispatched = true;
		window.dispatchEvent(new CustomEvent('badger:stage-complete', { detail: result }));
		this.options.onStageComplete?.(result);
	}

	private updateMirrorPalaceCompletion(): void {
		const objectives = this.mirrorPalaceObjectives;
		if (!objectives || this.stageCompletionDispatched) return;
		const payloadCollected = getCollectedStoryPayloadIds(this.pickups).includes('mirror_pass');
		const boss = this.enemies.find((enemy) => enemy.bossId === 'reflection-judge');
		this.handleMirrorPalaceEvents(
			objectives.observeWorld(payloadCollected, Boolean(boss && boss.hp <= 0))
		);
		const result = objectives.claimCompletion();
		if (!result) return;
		this.player.victoryAnimationTimer = 0.8;
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
		this.player.victoryAnimationTimer = 0.8;
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
		this.player.victoryAnimationTimer = 0.8;
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

	private renderLateStageInterface(ctx: CanvasRenderingContext2D): void {
		const interfaceState = this.lateStageObjectives?.getSnapshot().interface;
		if (!interfaceState || interfaceState.status !== 'active') return;

		const panel = { x: 96, y: 62, w: ctx.canvas.width - 192, h: ctx.canvas.height - 124 };
		const accent =
			interfaceState.kind === 'fasttype'
				? '#67f3c4'
				: interfaceState.kind === 'cargo-routing'
					? '#ffb35e'
					: '#8aa8ff';
		ctx.save();
		ctx.fillStyle = 'rgba(2, 5, 12, 0.82)';
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.fillStyle = 'rgba(7, 12, 24, 0.98)';
		ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
		ctx.strokeStyle = accent;
		ctx.lineWidth = 3;
		ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);
		ctx.textAlign = 'left';
		ctx.textBaseline = 'alphabetic';
		ctx.font = '900 18px ui-monospace, monospace';
		ctx.fillStyle = accent;
		ctx.fillText(interfaceState.title, panel.x + 24, panel.y + 32);
		ctx.font = '700 10px ui-monospace, monospace';
		ctx.fillStyle = '#eaf2ff';
		ctx.fillText(
			`NODE ${interfaceState.nodeIndex}/${interfaceState.nodeCount} // ${interfaceState.mistakes} CORRECTIONS`,
			panel.x + 24,
			panel.y + 51
		);
		ctx.font = '11px ui-monospace, monospace';
		ctx.fillStyle = '#b9c8dc';
		ctx.fillText(interfaceState.instructions, panel.x + 24, panel.y + 70);

		const timerWidth = 176;
		const timerX = panel.x + panel.w - timerWidth - 24;
		const maxTime =
			interfaceState.kind === 'fasttype'
				? 14
				: interfaceState.kind === 'cargo-routing'
					? 24
					: 28;
		ctx.fillStyle = '#17243a';
		ctx.fillRect(timerX, panel.y + 22, timerWidth, 10);
		ctx.fillStyle = interfaceState.assistActive
			? '#8aa8ff'
			: interfaceState.timeRemaining < 5
				? '#ff5e7a'
				: accent;
		ctx.fillRect(
			timerX,
			panel.y + 22,
			interfaceState.assistActive
				? timerWidth
				: timerWidth * Math.max(0, Math.min(1, interfaceState.timeRemaining / maxTime)),
			10
		);
		ctx.textAlign = 'right';
		ctx.font = '700 10px ui-monospace, monospace';
		ctx.fillStyle = '#eaf2ff';
		ctx.fillText(
			interfaceState.assistActive
				? 'PUBLIC ASSIST // TIMER PAUSED'
				: `${interfaceState.timeRemaining.toFixed(1)}s // ${interfaceState.attemptsLeft} ATTEMPTS`,
			panel.x + panel.w - 24,
			panel.y + 52
		);

		if (interfaceState.feedback) {
			const feedbackColor =
				interfaceState.feedbackKind === 'assist' ? '#8aa8ff' : '#ff5e7a';
			ctx.textAlign = 'left';
			ctx.fillStyle = 'rgba(2, 5, 12, 0.94)';
			ctx.fillRect(panel.x + 24, panel.y + 81, panel.w - 48, 26);
			ctx.strokeStyle = feedbackColor;
			ctx.lineWidth = 1;
			ctx.strokeRect(panel.x + 24, panel.y + 81, panel.w - 48, 26);
			ctx.font = '800 10px ui-monospace, monospace';
			ctx.fillStyle = feedbackColor;
			ctx.fillText(
				`${interfaceState.feedbackKind === 'assist' ? 'ASSIST' : 'REVISE'} // ${interfaceState.feedback}`,
				panel.x + 34,
				panel.y + 98
			);
		}

		if (interfaceState.kind === 'fasttype') {
			this.renderFastTypeInterface(ctx, interfaceState, panel, accent);
		} else {
			this.renderSelectionInterface(ctx, interfaceState, panel, accent);
		}
		ctx.restore();
	}

	private renderFastTypeInterface(
		ctx: CanvasRenderingContext2D,
		interfaceState: Extract<LateStageInterfaceSnapshot, { kind: 'fasttype' }>,
		panel: { x: number; y: number; w: number; h: number },
		accent: string
	): void {
		const contentX = panel.x + 34;
		const targetY = panel.y + 128;
		ctx.textAlign = 'left';
		ctx.font = '700 10px ui-monospace, monospace';
		ctx.fillStyle = '#92a4be';
		ctx.fillText('RECONSTRUCTED REPAIR LINE', contentX, targetY);
		ctx.fillStyle = '#0b1322';
		ctx.fillRect(contentX, targetY + 14, panel.w - 68, 58);
		ctx.strokeStyle = '#31445f';
		ctx.strokeRect(contentX, targetY + 14, panel.w - 68, 58);
		ctx.font = '900 22px ui-monospace, monospace';
		ctx.fillStyle = '#eaf2ff';
		ctx.fillText(interfaceState.target, contentX + 18, targetY + 51);

		const inputY = targetY + 105;
		ctx.font = '700 10px ui-monospace, monospace';
		ctx.fillStyle = '#92a4be';
		ctx.fillText('LIVE CARRIER INPUT', contentX, inputY);
		ctx.fillStyle = '#050a13';
		ctx.fillRect(contentX, inputY + 14, panel.w - 68, 66);
		ctx.strokeStyle = interfaceState.correctPrefixLength === interfaceState.input.length ? accent : '#ff5e7a';
		ctx.lineWidth = 2;
		ctx.strokeRect(contentX, inputY + 14, panel.w - 68, 66);
		ctx.font = '900 22px ui-monospace, monospace';
		const prefix = interfaceState.input.slice(0, interfaceState.correctPrefixLength);
		const suffix = interfaceState.input.slice(interfaceState.correctPrefixLength);
		ctx.fillStyle = accent;
		ctx.fillText(prefix, contentX + 18, inputY + 56);
		const prefixWidth = ctx.measureText(prefix).width;
		ctx.fillStyle = '#ff5e7a';
		ctx.fillText(suffix, contentX + 18 + prefixWidth, inputY + 56);
		const cursorX = contentX + 18 + ctx.measureText(interfaceState.input).width;
		ctx.fillStyle = Math.floor(interfaceState.timeRemaining * 4) % 2 === 0 ? accent : '#eaf2ff';
		ctx.fillRect(cursorX + 2, inputY + 31, 3, 28);
		if (interfaceState.assistActive && interfaceState.expectedChar !== null) {
			ctx.font = '800 11px ui-monospace, monospace';
			ctx.fillStyle = '#8aa8ff';
			ctx.fillText(
				`NEXT VERIFIED BYTE // ${interfaceState.expectedChar === ' ' ? '[SPACE]' : interfaceState.expectedChar}`,
				contentX,
				inputY + 101
			);
		}

		ctx.font = '11px ui-monospace, monospace';
		ctx.fillStyle = '#b9c8dc';
		ctx.fillText('Backspace edits // Enter validates exact bytes // Escape closes console', contentX, panel.y + panel.h - 28);
	}

	private renderSelectionInterface(
		ctx: CanvasRenderingContext2D,
		interfaceState: Extract<
			LateStageInterfaceSnapshot,
			{ kind: 'cargo-routing' | 'broadcast-composition' }
		>,
		panel: { x: number; y: number; w: number; h: number },
		accent: string
	): void {
		const contentX = panel.x + 28;
		const contentY = panel.y + 112;
		const gap = 16;
		const columnWidth = (panel.w - 56 - gap * 2) / 3;
		for (const [columnIndex, column] of interfaceState.columns.entries()) {
			const x = contentX + columnIndex * (columnWidth + gap);
			const focused = interfaceState.focusIndex === columnIndex;
			const incorrect = interfaceState.incorrectColumnIds.includes(column.id);
			ctx.fillStyle = focused ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.22)';
			ctx.fillRect(x, contentY, columnWidth, 194);
			ctx.strokeStyle = incorrect ? '#ff5e7a' : focused ? accent : '#31445f';
			ctx.lineWidth = incorrect || focused ? 3 : 1;
			ctx.strokeRect(x, contentY, columnWidth, 194);
			ctx.textAlign = 'center';
			ctx.font = '900 11px ui-monospace, monospace';
			ctx.fillStyle = incorrect ? '#ff5e7a' : focused ? accent : '#92a4be';
			ctx.fillText(
				`${focused ? '▶ ' : ''}${column.label}${incorrect ? ' // REVISE' : ''}`,
				x + columnWidth / 2,
				contentY + 24
			);
			for (const [optionIndex, option] of column.options.entries()) {
				const optionY = contentY + 46 + optionIndex * 42;
				const selected = column.selectedIndex === optionIndex;
				ctx.fillStyle = selected ? accent : '#121d2f';
				ctx.fillRect(x + 12, optionY, columnWidth - 24, 30);
				ctx.strokeStyle = selected ? '#eaf2ff' : '#31445f';
				ctx.strokeRect(x + 12, optionY, columnWidth - 24, 30);
				ctx.font = `${selected ? '900' : '700'} 11px ui-monospace, monospace`;
				ctx.fillStyle = selected ? '#07101e' : '#b9c8dc';
				ctx.fillText(
					`${selected ? '▶' : ' '} ${optionIndex + 1}  ${option}`,
					x + columnWidth / 2,
					optionY + 20
				);
			}
			if (column.hint) {
				ctx.font = '700 8px ui-monospace, monospace';
				ctx.fillStyle = incorrect || interfaceState.assistActive ? '#eaf2ff' : '#92a4be';
				ctx.fillText(column.hint.slice(0, 34), x + columnWidth / 2, contentY + 181);
			}
		}

		const previewY = contentY + 207;
		ctx.fillStyle = '#050a13';
		ctx.fillRect(contentX, previewY, panel.w - 56, 58);
		ctx.strokeStyle = accent;
		ctx.lineWidth = 2;
		ctx.strokeRect(contentX, previewY, panel.w - 56, 58);
		ctx.textAlign = 'left';
		ctx.font = '700 9px ui-monospace, monospace';
		ctx.fillStyle = '#92a4be';
		ctx.fillText(
			interfaceState.kind === 'cargo-routing' ? 'ROUTE PREVIEW' : 'ON-AIR SENTENCE PREVIEW',
			contentX + 14,
			previewY + 18
		);
		ctx.font = '900 14px ui-monospace, monospace';
		ctx.fillStyle = '#eaf2ff';
		ctx.fillText(interfaceState.preview, contentX + 14, previewY + 43);
		ctx.font = '11px ui-monospace, monospace';
		ctx.fillStyle = '#b9c8dc';
		ctx.fillText('←/→ focus // ↑/↓ rewrite // 1–3 direct select // Enter validate // Escape cancel', contentX, panel.y + panel.h - 22);
	}

	private renderLateStageObjectivePanel(ctx: CanvasRenderingContext2D): void {
		const snapshot = this.lateStageObjectives?.getSnapshot();
		if (!snapshot) return;
		const primary = snapshot.primaryNodes.filter((node) => node.completed).length;
		const support = snapshot.supportNodes.filter((node) => node.completed).length;
		const x = 24;
		const y = ctx.canvas.height - 122;
		ctx.save();
		ctx.fillStyle = 'rgba(4, 6, 12, 0.9)';
		ctx.fillRect(x, y, 520, 98);
		ctx.strokeStyle = snapshot.readyToComplete ? '#67f3c4' : '#8aa8ff';
		ctx.strokeRect(x, y, 520, 98);
		ctx.textAlign = 'left';
		ctx.font = '700 12px ui-monospace, monospace';
		ctx.fillStyle = '#8aa8ff';
		ctx.fillText(`${snapshot.stageId.toUpperCase()} // RELEASE ROUTE`, x + 12, y + 20);
		ctx.font = '11px ui-monospace, monospace';
		ctx.fillStyle = snapshot.primaryComplete ? '#67f3c4' : '#eaf2ff';
		ctx.fillText(`${snapshot.primaryLabel}: ${primary}/${snapshot.primaryNodes.length}`, x + 12, y + 41);
		ctx.fillStyle = snapshot.supportComplete ? '#67f3c4' : '#ffb35e';
		ctx.fillText(`${snapshot.supportLabel}: ${support}/${snapshot.supportNodes.length}`, x + 12, y + 60);
		ctx.fillStyle = snapshot.payloadCollected ? '#67f3c4' : '#eaf2ff';
		ctx.fillText(`${snapshot.payloadLabel}: ${snapshot.payloadCollected ? 'secured' : 'missing'}`, x + 12, y + 80);
		ctx.fillStyle = snapshot.bossDefeated ? '#67f3c4' : '#ff5e7a';
		ctx.fillText(`${snapshot.bossLabel}: ${snapshot.bossDefeated ? 'defeated' : 'active'}`, x + 300, y + 80);
		ctx.restore();
	}

	private renderLateStageWorld(ctx: CanvasRenderingContext2D, cameraX: number): void {
		const snapshot = this.lateStageObjectives?.getSnapshot();
		if (!snapshot) return;
		ctx.save();
		ctx.textAlign = 'center';
		ctx.font = '700 9px ui-monospace, monospace';
		for (const node of snapshot.primaryNodes) {
			const x = node.x - cameraX;
			ctx.fillStyle = node.completed ? '#67f3c4' : '#ffb35e';
			ctx.fillRect(x - 18, node.y - 62, 36, 58);
			ctx.strokeStyle = node.completed ? '#67f3c4' : '#eaf2ff';
			ctx.lineWidth = node.completed ? 3 : 2;
			ctx.strokeRect(x - 18, node.y - 62, 36, 58);
			ctx.fillStyle = '#08111f';
			ctx.fillRect(x - 10, node.y - 52, 20, 14);
			ctx.fillStyle = node.completed ? '#67f3c4' : '#eaf2ff';
			ctx.fillText(
				node.completed ? (node.grade ?? 'ROUTED').toUpperCase() : 'M: ROUTE',
				x,
				node.y - 72
			);
		}
		for (const node of snapshot.supportNodes) {
			const x = node.x - cameraX;
			ctx.fillStyle = node.completed ? '#67f3c4' : '#8aa8ff';
			ctx.fillRect(x - 14, node.y - 34, 28, 26);
			ctx.strokeStyle = '#eaf2ff';
			ctx.strokeRect(x - 14, node.y - 34, 28, 26);
			ctx.fillStyle = node.completed ? '#67f3c4' : '#eaf2ff';
			ctx.fillText(node.completed ? 'PUBLIC' : 'M: RECOVER', x, node.y - 43);
		}
		ctx.restore();
	}

	private renderTrainingOverlay(ctx: CanvasRenderingContext2D, cameraX: number): void {
		const snapshot = this.getTrainingSnapshot();
		const dummy = this.trainingDummy;
		if (!snapshot || !dummy) return;
		const { overlays, metrics } = snapshot;
		const playerX = this.player.x - cameraX;
		const dummyX = dummy.x - cameraX;

		ctx.save();
		ctx.textAlign = 'left';
		ctx.textBaseline = 'alphabetic';

		if (overlays.showHurtboxes) {
			ctx.lineWidth = 2;
			ctx.strokeStyle = '#67f3c4';
			ctx.strokeRect(playerX, this.player.y, this.player.w, this.player.h);
			ctx.strokeStyle = '#8aa8ff';
			ctx.strokeRect(dummyX, dummy.y, dummy.w, dummy.h);
		}

		if (overlays.showHitboxes) {
			ctx.lineWidth = 2;
			ctx.strokeStyle = '#ffb35e';
			ctx.setLineDash([5, 3]);
			if (this.player.meleeTimer > 0) {
				const width = this.player.hasKatana ? 50 : 42;
				ctx.strokeRect(
					playerX + (this.player.dir > 0 ? this.player.w : -width),
					this.player.y + 8,
					width,
					this.player.hasKatana ? 32 : 28
				);
			}
			if ((this.player.railgunAnimationTimer ?? 0) > 0) {
				ctx.strokeRect(
					this.player.dir > 0 ? playerX + this.player.w : playerX - 560,
					this.player.y + 14,
					560,
					18
				);
			}
			if (dummy.attackTelegraph > 0) {
				ctx.strokeStyle = '#ff5e7a';
				ctx.strokeRect(dummy.dir > 0 ? dummyX + dummy.w : dummyX - 76, dummy.y + 6, 76, 38);
			}
			ctx.setLineDash([]);
		}

		ctx.textAlign = 'center';
		ctx.font = '700 10px ui-monospace, monospace';
		ctx.fillStyle = '#8aa8ff';
		ctx.fillText('DUMMY // ∞', dummyX + dummy.w / 2, dummy.y - 14);
		if (overlays.showDamageNumbers && this.trainingDamageNumberTimer > 0) {
			ctx.globalAlpha = Math.min(1, this.trainingDamageNumberTimer * 2);
			ctx.fillStyle = '#ffb35e';
			ctx.font = '900 16px ui-monospace, monospace';
			ctx.fillText(
				`-${metrics.lastHitDamage.toFixed(1)}`,
				dummyX + dummy.w / 2,
				dummy.y - 32 - (0.75 - this.trainingDamageNumberTimer) * 18
			);
			ctx.globalAlpha = 1;
		}

		if (overlays.showFrameData) {
			const panelY = GAMEPLAY_HUD_WORLD_OVERLAY_TOP + 42;
			ctx.textAlign = 'left';
			ctx.fillStyle = 'rgba(4, 6, 12, 0.88)';
			ctx.fillRect(12, panelY, 286, 116);
			ctx.strokeStyle = '#8aa8ff';
			ctx.strokeRect(12, panelY, 286, 116);
			ctx.fillStyle = '#8aa8ff';
			ctx.font = '700 10px ui-monospace, monospace';
			ctx.fillText('DUMMY LAB // LIVE FRAME DATA', 24, panelY + 18);
			ctx.fillStyle = '#eaf2ff';
			ctx.font = '9px ui-monospace, monospace';
			ctx.fillText(
				`stage ${snapshot.stageId} // seed ${snapshot.seed.slice(-12)}`,
				24,
				panelY + 36
			);
			ctx.fillText(
				`lesson ${snapshot.lessonId} // dummy ${snapshot.dummyPresetId} // kit ${snapshot.kitId}`,
				24,
				panelY + 52
			);
			ctx.fillStyle = '#67f3c4';
			ctx.fillText(
				`last ${metrics.lastHitDamage.toFixed(1)} // combo ${metrics.comboDamage.toFixed(1)} // hps ${metrics.hitsPerSecond}`,
				24,
				panelY + 70
			);
			ctx.fillStyle = '#ffb35e';
			ctx.fillText(
				`rail ${metrics.railReloadDeltaMs}ms // parry ${metrics.parryWindowDeltaMs}ms // hack ${metrics.hackCastTimeMs}ms`,
				24,
				panelY + 87
			);
			ctx.fillStyle = '#92a4be';
			ctx.fillText(
				`melee active ${metrics.meleeActiveFrames}f // recovery ${metrics.recoveryFrames}f`,
				24,
				panelY + 104
			);
		}
		ctx.restore();
	}

	private renderDubColonyObjectivePanel(ctx: CanvasRenderingContext2D): void {
		const snapshot = this.dubColonyObjectives?.getSnapshot(this.player);
		if (!snapshot) return;
		const parts = snapshot.spareParts.filter((part) => part.recovered).length;
		const votes = snapshot.voteCards.filter((card) => card.recovered).length;
		const tuned = snapshot.reactorNodes.filter((node) => node.tuned).length;
		const x = 24;
		const y = ctx.canvas.height - 126;
		ctx.save();
		ctx.fillStyle = 'rgba(4, 6, 12, 0.9)';
		ctx.fillRect(x, y, 500, 102);
		ctx.strokeStyle = snapshot.readyToComplete ? '#67f3c4' : '#ffb35e';
		ctx.strokeRect(x, y, 500, 102);
		ctx.textAlign = 'left';
		ctx.font = '700 12px ui-monospace, monospace';
		ctx.fillStyle = '#ffb35e';
		ctx.fillText(`DUB COLONY // ${snapshot.alignment.toUpperCase()} ASSEMBLY`, x + 12, y + 20);
		ctx.font = '11px ui-monospace, monospace';
		ctx.fillStyle = parts === 3 ? '#67f3c4' : '#eaf2ff';
		ctx.fillText(`Reactor spares: ${parts}/3`, x + 12, y + 41);
		ctx.fillStyle = votes === 3 ? '#67f3c4' : '#eaf2ff';
		ctx.fillText(`Vote cards: ${votes}/3`, x + 190, y + 41);
		ctx.fillStyle = tuned === 3 ? '#67f3c4' : snapshot.inBeatWindow ? '#ffb35e' : '#eaf2ff';
		ctx.fillText(
			`Reactor sync: ${tuned}/3 • ${snapshot.bpm} BPM • ${snapshot.lastGrade ?? 'listen'}`,
			x + 12,
			y + 61
		);
		ctx.fillStyle = snapshot.payloadCollected ? '#67f3c4' : '#eaf2ff';
		ctx.fillText(`Bass Core: ${snapshot.payloadCollected ? 'secured' : 'waiting'}`, x + 12, y + 82);
		ctx.fillStyle = snapshot.bossDefeated ? '#67f3c4' : '#ff5e7a';
		ctx.fillText(
			`King Feedback: ${snapshot.bossDefeated ? 'listening' : 'commanding'}`,
			x + 245,
			y + 82
		);
		ctx.restore();
	}

	private renderDubColonyWorld(ctx: CanvasRenderingContext2D, cameraX: number): void {
		const snapshot = this.dubColonyObjectives?.getSnapshot(this.player);
		if (!snapshot) return;
		const sprites = this.renderer?.getSpriteRenderer();
		ctx.save();
		ctx.textAlign = 'center';
		ctx.font = '700 10px ui-monospace, monospace';

		if (sprites?.hasSheet('dub_colony_tiles')) {
			for (const x of [360, 980, 1680, 2320]) {
				sprites.drawFrame('dub_colony_tiles', 'speaker_stack', 0, x - cameraX, 462);
			}
			const pulseFrame = snapshot.beatIndex % 4;
			for (const node of snapshot.reactorNodes) {
				sprites.drawFrame(
					'dub_colony_tiles',
					'woofer_pulse',
					pulseFrame,
					node.x - cameraX - 16,
					node.y - 32
				);
			}
		}

		for (const part of snapshot.spareParts) {
			const x = part.x - cameraX;
			ctx.fillStyle = part.recovered ? '#67f3c4' : '#ffb35e';
			ctx.fillRect(x - 12, part.y - 28, 24, 22);
			ctx.strokeStyle = '#eaf2ff';
			ctx.strokeRect(x - 12, part.y - 28, 24, 22);
			ctx.fillStyle = part.recovered ? '#67f3c4' : '#eaf2ff';
			ctx.fillText(part.recovered ? 'IN CHORUS' : 'M: RECOVER', x, part.y - 36);
		}

		for (const card of snapshot.voteCards) {
			const x = card.x - cameraX;
			ctx.fillStyle = card.recovered ? '#67f3c4' : '#eaf2ff';
			ctx.fillRect(x - 9, card.y - 26, 18, 20);
			ctx.fillStyle = card.recovered ? '#67f3c4' : '#ffb35e';
			ctx.fillText(card.recovered ? 'VOTE RETURNED' : 'M: VOTE CARD', x, card.y - 34);
			if (sprites?.hasSheet('character_little_ix')) {
				const animation = card.recovered ? 'assist' : 'idle';
				const frame = snapshot.beatIndex % (card.recovered ? 6 : 4);
				sprites.drawFrame('character_little_ix', animation, frame, x - 60, card.y - 48);
			}
		}

		for (const node of snapshot.reactorNodes) {
			const x = node.x - cameraX;
			const pulse = snapshot.inBeatWindow
				? 1
				: 0.45 + Math.sin(snapshot.beatPhase * Math.PI * 2) * 0.18;
			ctx.globalAlpha = Math.max(0.25, pulse);
			ctx.strokeStyle = node.tuned ? '#67f3c4' : snapshot.jamRemaining > 0 ? '#ff5e7a' : '#ffb35e';
			ctx.lineWidth = snapshot.inBeatWindow ? 5 : 2;
			ctx.beginPath();
			ctx.arc(x, node.y - 18, 24 + snapshot.beatPhase * 20, 0, Math.PI * 2);
			ctx.stroke();
			ctx.globalAlpha = 1;
			ctx.fillStyle = node.tuned ? '#67f3c4' : '#eaf2ff';
			ctx.fillText(
				node.tuned ? 'SYNCED' : `${node.expectedAction.toUpperCase()} ON PULSE`,
				x,
				node.y - 58
			);
		}

		if (sprites?.hasSheet('character_naya_root')) {
			const assist = this.nayaAssistTimer > 0;
			const animation = assist ? 'assist' : 'idle';
			const frameCount = assist ? 6 : 4;
			const frame = snapshot.beatIndex % frameCount;
			const nayaX = this.player.x - cameraX - (this.player.dir > 0 ? 48 : -38);
			const nayaY = this.player.y + this.player.h - 48;
			sprites.drawFrame('character_naya_root', animation, frame, nayaX, nayaY, this.player.dir < 0);
			ctx.strokeStyle = assist ? '#67f3c4' : 'rgba(103, 243, 196, 0.38)';
			ctx.lineWidth = assist ? 4 : 2;
			ctx.beginPath();
			ctx.arc(nayaX + 24, nayaY + 24, 28 + (assist ? 7 : 0), 0, Math.PI * 2);
			ctx.stroke();
		}

		for (const [index, checkpoint] of (
			this.checkpoints?.getSnapshot().checkpoints ?? []
		).entries()) {
			const x = checkpoint.x - cameraX;
			const activeIndex = this.checkpoints?.getSnapshot().activeIndex ?? 0;
			const active = index <= activeIndex;
			ctx.fillStyle = active ? '#67f3c4' : '#5b4b35';
			ctx.fillRect(x - 3, checkpoint.y - 56, 6, 56);
			ctx.beginPath();
			ctx.arc(x, checkpoint.y - 62, active ? 8 : 5, 0, Math.PI * 2);
			ctx.fill();
		}

		ctx.fillStyle = 'rgba(4, 6, 12, 0.78)';
		ctx.fillRect(ctx.canvas.width / 2 - 92, GAMEPLAY_HUD_WORLD_OVERLAY_TOP, 184, 34);
		ctx.strokeStyle = snapshot.jamRemaining > 0 ? '#ff5e7a' : '#ffb35e';
		ctx.strokeRect(ctx.canvas.width / 2 - 92, GAMEPLAY_HUD_WORLD_OVERLAY_TOP, 184, 34);
		ctx.fillStyle = snapshot.inBeatWindow ? '#67f3c4' : '#eaf2ff';
		ctx.fillText(
			snapshot.jamRemaining > 0
				? 'STATIC OWNS THE CHANNEL'
				: snapshot.inBeatWindow
					? '● DOWNBEAT ●'
					: `BEAT ${snapshot.beatIndex + 1} // LISTEN`,
			ctx.canvas.width / 2,
			GAMEPLAY_HUD_WORLD_OVERLAY_TOP + 22
		);
		ctx.restore();
	}

	private renderMirrorPalaceObjectivePanel(ctx: CanvasRenderingContext2D): void {
		const snapshot = this.mirrorPalaceObjectives?.getSnapshot();
		if (!snapshot) return;
		const heard = snapshot.guests.filter((guest) => guest.heard).length;
		const broken = snapshot.traversalSeals.filter((seal) => seal.broken).length;
		const x = 24;
		const y = ctx.canvas.height - 122;
		ctx.save();
		ctx.fillStyle = 'rgba(4, 6, 12, 0.9)';
		ctx.fillRect(x, y, 470, 98);
		ctx.strokeStyle = snapshot.readyToComplete ? '#67f3c4' : '#8f68ff';
		ctx.strokeRect(x, y, 470, 98);
		ctx.textAlign = 'left';
		ctx.font = '700 12px ui-monospace, monospace';
		ctx.fillStyle = '#8f68ff';
		ctx.fillText('MIRROR PALACE OBJECTIVES', x + 12, y + 20);
		ctx.font = '11px ui-monospace, monospace';
		ctx.fillStyle = heard === 3 ? '#67f3c4' : '#eaf2ff';
		ctx.fillText(`Refusal testimonies: ${heard}/3`, x + 12, y + 40);
		ctx.fillStyle = broken === 3 ? '#67f3c4' : '#ffb35e';
		ctx.fillText(`False routes: ${broken}/3`, x + 240, y + 40);
		ctx.fillStyle = snapshot.etiquetteStatus === 'solved' ? '#67f3c4' : '#eaf2ff';
		ctx.fillText(
			`Banquet etiquette: ${snapshot.etiquetteStatus}${snapshot.expectedInput ? ` • ${snapshot.expectedInput}` : ''}`,
			x + 12,
			y + 59
		);
		ctx.fillStyle = snapshot.payloadCollected ? '#67f3c4' : '#eaf2ff';
		ctx.fillText(
			`Mirror Pass: ${snapshot.payloadCollected ? 'secured' : 'missing'}`,
			x + 12,
			y + 78
		);
		ctx.fillStyle = snapshot.bossDefeated ? '#67f3c4' : '#ff5e7a';
		ctx.fillText(`Judge: ${snapshot.bossDefeated ? 'refused' : 'presiding'}`, x + 270, y + 78);
		ctx.restore();
	}

	private renderMirrorPalaceWorld(ctx: CanvasRenderingContext2D, cameraX: number): void {
		const snapshot = this.mirrorPalaceObjectives?.getSnapshot();
		if (!snapshot) return;
		ctx.save();
		ctx.textAlign = 'center';
		ctx.font = '700 10px ui-monospace, monospace';

		for (const guest of snapshot.guests) {
			const x = guest.x - cameraX;
			ctx.fillStyle = guest.heard ? '#67f3c4' : '#8f68ff';
			ctx.fillRect(x - 13, guest.y - 46, 26, 38);
			ctx.fillStyle = '#eaf2ff';
			ctx.fillRect(x - 5, guest.y - 38, 10, 10);
			ctx.fillStyle = guest.heard ? '#67f3c4' : '#ffb35e';
			ctx.fillText(guest.heard ? 'REFUSAL HEARD' : 'M: LISTEN', x, guest.y - 54);
		}

		for (const seal of snapshot.traversalSeals) {
			const x = seal.x - cameraX;
			ctx.strokeStyle = seal.broken ? '#67f3c4' : '#eaf2ff';
			ctx.lineWidth = seal.broken ? 2 : 4;
			ctx.strokeRect(x - 30, seal.y - 92, 60, 92);
			ctx.globalAlpha = seal.broken ? 0.18 : 0.52;
			ctx.fillStyle = seal.kind === 'reflection-loop' ? '#8f68ff' : '#ffb35e';
			ctx.fillRect(x - 24, seal.y - 84, 48, 76);
			ctx.globalAlpha = 1;
			ctx.fillStyle = seal.broken ? '#67f3c4' : '#eaf2ff';
			ctx.fillText(
				seal.broken
					? 'FALSE ROUTE BROKEN'
					: seal.kind === 'reflection-loop'
						? 'RIGHT → LEFT'
						: 'AIRBORNE E',
				x,
				seal.y - 101
			);
		}

		const terminalX = snapshot.etiquetteTerminal.x - cameraX;
		ctx.fillStyle = 'rgba(8, 6, 16, 0.92)';
		ctx.fillRect(terminalX - 42, snapshot.etiquetteTerminal.y - 98, 84, 98);
		ctx.strokeStyle = snapshot.etiquetteStatus === 'solved' ? '#67f3c4' : '#8f68ff';
		ctx.lineWidth = 3;
		ctx.strokeRect(terminalX - 42, snapshot.etiquetteTerminal.y - 98, 84, 98);
		ctx.fillStyle = snapshot.etiquetteStatus === 'active' ? '#ffb35e' : '#eaf2ff';
		ctx.fillText(
			snapshot.etiquetteStatus === 'active'
				? `REFUSE: ${snapshot.expectedInput?.toUpperCase()}`
				: snapshot.etiquetteStatus === 'solved'
					? 'TABLE OPEN'
					: 'M: BANQUET TABLE',
			terminalX,
			snapshot.etiquetteTerminal.y - 107
		);

		for (const [index, checkpoint] of (
			this.checkpoints?.getSnapshot().checkpoints ?? []
		).entries()) {
			const x = checkpoint.x - cameraX;
			const activeIndex = this.checkpoints?.getSnapshot().activeIndex ?? 0;
			const active = index <= activeIndex;
			ctx.fillStyle = active ? '#67f3c4' : '#60557f';
			ctx.fillRect(x - 3, checkpoint.y - 56, 6, 56);
			ctx.beginPath();
			ctx.arc(x, checkpoint.y - 62, active ? 8 : 5, 0, Math.PI * 2);
			ctx.fill();
		}

		for (const [x, label] of [
			[420, 'A CONTRACT IS A COMPLIMENT'],
			[1220, 'THE MIRROR REMEMBERS YOUR DEBT'],
			[1860, 'APPLAUSE CONFIRMS CONSENT'],
		] as const) {
			const screenX = x - cameraX;
			ctx.fillStyle = 'rgba(143, 104, 255, 0.15)';
			ctx.fillRect(screenX - 92, 238, 184, 32);
			ctx.strokeStyle = '#8f68ff';
			ctx.strokeRect(screenX - 92, 238, 184, 32);
			ctx.fillStyle = '#eaf2ff';
			ctx.fillText(label, screenX, 258);
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

	getMirrorPalaceObjectiveSnapshot(): MirrorPalaceObjectiveSnapshot | null {
		return this.mirrorPalaceObjectives?.getSnapshot() ?? null;
	}

	getDubColonyObjectiveSnapshot(): DubColonyObjectiveSnapshot | null {
		return this.dubColonyObjectives?.getSnapshot(this.player) ?? null;
	}

	getLateStageObjectiveSnapshot(): LateStageObjectiveSnapshot | null {
		return this.lateStageObjectives?.getSnapshot() ?? null;
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

	getReflectionJudgeSnapshot(): ReflectionJudgeSnapshot | null {
		return this.reflectionJudge?.getSnapshot() ?? null;
	}

	getKingFeedbackSnapshot(): KingFeedbackSnapshot | null {
		return this.kingFeedback?.getSnapshot() ?? null;
	}

	getCompanionSnapshot(): ReturnType<CompanionSystem['getState']> & { nayaAssistTimer: number } {
		return {
			...this.companions.getState(),
			nayaAssistTimer: Number(this.nayaAssistTimer.toFixed(3)),
		};
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

	debugSetEnemyHp(enemyId: string, hp: number): void {
		const enemy = this.enemies.find((candidate) => candidate.id === enemyId);
		if (!enemy) return;
		enemy.hp = Math.max(0, Math.min(enemy.maxHp, hp));
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
		bossSpriteSheetId?: string;
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
			bossSpriteSheetId: e.bossSpriteSheetId,
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
			const interfaceResult = this.lateStageObjectives?.handleInterfaceKey(event);
			if (interfaceResult?.consumed) {
				this.handleLateStageEvents(interfaceResult.events);
				this.updateGameplayHints();
				event.preventDefault();
				return;
			}
			if (event.code === 'Escape') {
				this.options.onReturnToTitle?.();
				event.preventDefault();
			} else if (this.training) {
				switch (event.code) {
					case 'KeyH':
						this.training.toggleAllOverlays();
						break;
					case 'F1':
						this.training.toggleOverlay('showHitboxes');
						break;
					case 'F2':
						this.training.toggleOverlay('showHurtboxes');
						break;
					case 'F3':
						this.training.toggleOverlay('showFrameData');
						break;
					case 'F4':
						this.training.toggleOverlay('showDamageNumbers');
						break;
					case 'BracketLeft':
						this.cycleTrainingLesson(-1);
						break;
					case 'BracketRight':
						this.cycleTrainingLesson(1);
						break;
					case 'Comma':
						this.cycleTrainingDummy(-1);
						break;
					case 'Period':
						this.cycleTrainingDummy(1);
						break;
					case 'Digit1':
					case 'Digit2':
					case 'Digit3':
					case 'Digit4': {
						const kit = TRAINING_KITS[Number(event.code.slice(-1)) - 1];
						if (kit) this.selectTrainingKit(kit.id);
						break;
					}
					case 'KeyR':
						this.resetTrainingPractice();
						break;
					case 'KeyN':
						this.options.training?.onRerollStage?.();
						break;
				}
				this.emitTrainingState();
				event.preventDefault();
			} else if (event.code === 'F3' && toolsEnabled) {
				this.debugOverlayVisible = !this.debugOverlayVisible;
				event.preventDefault();
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		this.keyHandler = handleKeyDown;
		if (this.training) this.emitTrainingState();
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

	private getTrainingCombatEvents(): CombatEvents {
		return {
			onEvent: (event) => {
				this.handleCombatEvent(event);
				if (!this.training || !this.trainingDummy) return;
				if (
					event.source === 'player' &&
					event.targetId === this.trainingDummy.id &&
					(event.kind === 'hit' || event.kind === 'kill')
				) {
					const moveId = event.moveId ?? '';
					const action: TrainingAction = moveId.includes('railgun')
						? 'railgun'
						: moveId.includes('parry')
							? 'parry'
							: 'melee';
					this.training.recordHit({
						damage: event.damage ?? 0,
						action,
						timeMs: this.trainingElapsed * 1000,
					});
					hitTrainingDummy(this.trainingDummy, this.trainingElapsed * 1000);
					this.trainingDamageNumberTimer = 0.75;
					this.updateTrainingHints();
				}
				if (event.kind === 'parry' && event.source === 'player') {
					this.training.recordMeasurements({
						parryWindowDeltaMs: Math.round((this.player.parryWindow ?? 0.15) * 1000),
					});
				}
			},
			mitigateDamage: () => 0,
			requestHitstop: (duration) => {
				this.hitstopRemaining = Math.min(duration, 0.06);
			},
			requestScreenShake: (intensity) => {
				this.screenShakeIntensity = Math.min(intensity, 5);
			},
		};
	}

	private updateTraining(dt: number, action: ReturnType<InputSystem['snapshot']>): void {
		const input = this.input;
		const dummy = this.trainingDummy;
		if (!input || !this.training || !dummy) return;
		this.trainingElapsed += dt;
		this.trainingDamageNumberTimer = Math.max(0, this.trainingDamageNumberTimer - dt);
		this.updateFeedbackTimers(dt);
		const events = this.getTrainingCombatEvents();
		this.physics.step(this.player, this.platforms, action, dt, {
			onJump: () => this.emitJumpParticles(),
			onLand: (fallDistance) => this.emitLandingParticles(fallDistance),
			onCoyoteJump: () => this.emitCoyoteParticles(),
		});
		this.combat.step(this.player, [dummy], action, dt, events);
		processMossInput(this.player, action, dt, this.combat, [dummy], events);

		if (action.hackPressed && Math.abs(this.player.x - dummy.x) < 180) {
			this.training.recordHit({
				damage: 0.5,
				action: 'codegate',
				timeMs: this.trainingElapsed * 1000,
			});
			this.training.recordMeasurements({ hackCastTimeMs: 420 });
			hitTrainingDummy(dummy, this.trainingElapsed * 1000);
			this.trainingDamageNumberTimer = 0.75;
			this.renderer?.emitVFX(dummy.x + dummy.w / 2, dummy.y + dummy.h / 2, 'emp', 8, 52);
		}

		const dummyStep = processTrainingDummy(dummy, dt);
		if (dummyStep.attackFired && Math.abs(this.player.x - dummy.x) < 150) {
			this.combat.resolveAttack(
				dummy,
				[this.player],
				{
					id: 'training-dummy:telegraphed-strike',
					source: 'enemy',
					damage: 1,
					stun: 0.2,
					knockbackX: 80,
					hitbox: {
						x: dummy.dir > 0 ? dummy.x + dummy.w : dummy.x - 76,
						y: dummy.y + 6,
						w: 76,
						h: 38,
					},
					parryable: true,
				},
				events
			);
		}

		if (action.shootPressed && this.player.hasRailgun) {
			this.training.recordMeasurements({
				railReloadDeltaMs: Math.round(this.player.shootCd * 1000),
			});
		}
		if (action.parryPressed) {
			this.training.recordMeasurements({
				parryWindowDeltaMs: Math.round((this.player.parryWindow ?? 0) * 1000),
			});
		}
		if (action.meleePressed) {
			const animationName = this.player.hasKatana ? 'melee_katana' : 'melee_claws';
			const animation = this.renderer?.getSpriteRenderer().getSheet(PLAYER_SPRITE_SHEET_ID)?.sheet
				.animations[animationName];
			const frames = animation?.frames ?? 4;
			this.training.recordMeasurements({
				meleeActiveFrames: Math.max(1, Math.ceil(frames * 0.5)),
				recoveryFrames: Math.max(1, frames - Math.ceil(frames * 0.5)),
			});
		}

		this.player.hp = this.player.maxHp;
		this.player.invuln = Math.max(this.player.invuln, 0.08);
		this.player.stims = 9;
		if (this.player.hasRocket) this.player.fuel = this.player.maxFuel;
		dummy.hp = Number.POSITIVE_INFINITY;
		dummy.maxHp = Number.POSITIVE_INFINITY;
		const worldRight = Math.max(...this.platforms.map((platform) => platform.x + platform.w), 960);
		this.camera.step(this.player.x, 0, Math.max(0, worldRight - 960), dt, this.player.vx);
		this.updateAnimation(dt);
		this.updateTrainingHints();
		input.clearPressed();
	}

	private configureUpdatePipeline(): void {
		this.updatePipeline.add(
			'feedback-timers',
			({ dt }) => this.updateFeedbackTimers(dt),
			{ phase: 'frame' }
		);
		this.updatePipeline.add('stage-objectives', (context) => this.stepStageObjectives(context), {
			phase: 'objectives',
		});
		this.updatePipeline.add('hitstop', (context) => this.stepHitstop(context), {
			phase: 'objectives',
			after: 'stage-objectives',
		});
		this.updatePipeline.add('screen-shake-decay', ({ dt }) => this.stepScreenShake(dt), {
			phase: 'objectives',
			after: 'hitstop',
		});
		this.updatePipeline.add('player-physics', (context) => this.stepPlayerPhysics(context), {
			phase: 'physics',
		});
		this.updatePipeline.add('combat-and-world', (context) => this.stepCombatAndWorld(context), {
			phase: 'combat',
		});
		this.updatePipeline.add('companions-and-bosses', (context) => this.stepActors(context), {
			phase: 'actors',
		});
		this.updatePipeline.add('camera-and-presentation', (context) => this.stepPresentation(context), {
			phase: 'presentation',
		});
	}

	private stepStageObjectives({
		dt,
		simDt,
		action,
		input,
	}: StageRunUpdateContext): { halt: true } | undefined {
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
		this.handleMirrorPalaceEvents(this.mirrorPalaceObjectives?.step(simDt, this.player) ?? []);
		this.handleMirrorPalaceEvents(
			this.mirrorPalaceObjectives?.observeAction(this.player, action) ?? []
		);
		this.handleDubColonyEvents(this.dubColonyObjectives?.step(simDt) ?? []);
		this.handleDubColonyEvents(this.dubColonyObjectives?.observeAction(this.player, action) ?? []);
		this.handleLateStageEvents(this.lateStageObjectives?.step(dt) ?? []);
		this.handleLateStageEvents(this.lateStageObjectives?.observeAction(this.player, action) ?? []);
		if (this.lateStageObjectives?.isInterfaceActive()) {
			this.player.vx = 0;
			this.player.vy = 0;
			this.updateGameplayHints();
			input.clearPressed();
			return { halt: true };
		}
		return undefined;
	}

	private stepHitstop({ dt }: StageRunUpdateContext): { halt: true } | undefined {
		if (this.hitstopRemaining <= 0) return;
		this.hitstopRemaining -= dt;
		return this.hitstopRemaining > 0 ? { halt: true } : undefined;
	}

	private stepScreenShake(dt: number): void {
		if (this.screenShakeIntensity > 0) {
			this.screenShakeIntensity = Math.max(0, this.screenShakeIntensity - dt * 30);
		}
	}

	private stepPlayerPhysics(context: StageRunUpdateContext): void {
		const { action, simDt } = context;
		const combatEvents = this.getCombatEvents();
		context.combatEvents = combatEvents;
		this.physics.step(this.player, this.platforms, action, simDt, {
			onJump: () => this.emitJumpParticles(),
			onLand: (fallDistance) => {
				this.emitLandingParticles(fallDistance);
				this.triggerLandingShockwave();
			},
			onCoyoteJump: () => this.emitCoyoteParticles(),
		});
	}

	private stepCombatAndWorld({ action, simDt, combatEvents }: StageRunUpdateContext): void {
		if (!combatEvents) throw new Error('stage update pipeline requires combat events after physics');
		this.combat.step(this.player, this.enemies, action, simDt, combatEvents);
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
		this.handleMirrorPalaceEnemyEvents(
			this.mirrorPalaceEnemies?.step(this.enemies, this.player, simDt, this.combat, combatEvents) ??
				[]
		);
		this.handleDubColonyEnemyEvents(
			this.dubColonyEnemies?.step(
				this.enemies,
				this.player,
				action,
				simDt,
				this.combat,
				combatEvents
			) ?? []
		);
	}

	private stepActors(context: StageRunUpdateContext): void {
		const { simDt, combatEvents } = context;
		if (!combatEvents) throw new Error('stage update pipeline requires combat events before actors');
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
		context.bossPhaseState = bossPhaseState;
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
		const reflectionJudge = this.enemies.find((enemy) => enemy.bossId === 'reflection-judge');
		this.handleReflectionJudgeEvents(
			this.reflectionJudge?.step(
				reflectionJudge,
				this.player,
				bossPhaseState,
				simDt,
				this.combat,
				combatEvents
			) ?? []
		);
		const kingFeedback = this.enemies.find((enemy) => enemy.bossId === 'king-feedback');
		this.handleKingFeedbackEvents(
			this.kingFeedback?.step(
				kingFeedback,
				this.player,
				bossPhaseState,
				simDt,
				this.combat,
				combatEvents
			) ?? []
		);
	}

	private stepPresentation({ action, simDt, input, combatEvents }: StageRunUpdateContext): void {
		if (!combatEvents) throw new Error('stage update pipeline requires combat events before presentation');
		const worldRight = Math.max(...this.platforms.map((platform) => platform.x + platform.w), 1950);
		this.camera.step(this.player.x, 0, Math.max(0, worldRight - 960), simDt, this.player.vx);
		processMossInput(this.player, action, simDt, this.combat, this.enemies, combatEvents);
		this.updateAnimation(simDt);
		this.updateLowerSprawlCompletion();
		this.updateDrainmarketCompletion();
		this.updateChromeArcologyCompletion();
		this.updateMirrorPalaceCompletion();
		this.updateDubColonyCompletion();
		this.updateLateStageCompletion();
		this.recoverPlayerIfNeeded();
		this.updateGameplayHints();
		input.clearPressed();
	}

	update(dt: number): void {
		const input = this.input;
		if (!input) return;
		const action = input.snapshot();
		if (this.training) {
			this.updateTraining(dt, action);
			return;
		}
		const simDt = this.player.focus > 0 ? dt * 0.62 : dt;
		this.updatePipeline.run({
			dt,
			simDt,
			action,
			input,
			combatEvents: null,
			bossPhaseState: null,
		});
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
				? rend.renderStageParallax(LOWER_SPRAWL_PARALLAX_SHEET_ID, cam.x) ||
					rend.renderStageBackdrop(LOWER_SPRAWL_BACKDROP_SHEET_ID)
				: this.options.stageId === 'drainmarket'
					? rend.renderStageParallax(DRAINMARKET_PARALLAX_SHEET_ID, cam.x)
					: this.options.stageId === 'chrome-arcology'
						? rend.renderStageParallax(CHROME_ARCOLOGY_PARALLAX_SHEET_ID, cam.x)
						: this.options.stageId === 'mirror-palace'
							? rend.renderStageParallax(MIRROR_PALACE_PARALLAX_SHEET_ID, cam.x)
							: this.options.stageId === 'dub-colony'
								? rend.renderStageParallax(DUB_COLONY_PARALLAX_SHEET_ID, cam.x)
								: this.options.stageId === 'antenna-barrens'
									? rend.renderStageParallax(ANTENNA_BARRENS_PARALLAX_SHEET_ID, cam.x)
									: this.options.stageId === 'orbital-lift'
										? rend.renderStageParallax(ORBITAL_LIFT_PARALLAX_SHEET_ID, cam.x)
										: this.options.stageId === 'asteroid-redoubt'
											? rend.renderStageParallax(ASTEROID_REDOUBT_PARALLAX_SHEET_ID, cam.x)
											: false;
		if (!hasStageArt) {
			rend.drawBackground();
			rend.renderParallax(cam.x);
		}
		rend.renderPlatforms(
			this.platforms,
			cam.x,
			getStagePlatformArt(this.options.stageId ?? 'lower-sprawl')
		);
		this.renderLowerSprawlWorld(ctx, cam.x);
		this.renderDrainmarketWorld(ctx, cam.x);
		this.renderChromeArcologyWorld(ctx, cam.x);
		this.renderMirrorPalaceWorld(ctx, cam.x);
		this.renderDubColonyWorld(ctx, cam.x);
		this.renderLateStageWorld(ctx, cam.x);
		rend.renderPickups(this.pickups, cam.x);
		rend.renderPlayer(this.player, cam.x);
		this.renderRailgunBeam(ctx, cam.x);
		rend.renderEnemies(this.enemies, cam.x);
		rend.renderVFX(cam.x);
		rend.renderUI(this.player, cam);
		if (this.training) this.renderTrainingOverlay(ctx, cam.x);
		if (this.debugOverlayVisible) {
			this.renderBalanceOverlay(ctx);
			this.renderRuntimeConfigOverlay(ctx);
			this.renderTutorialOverlay(ctx);
			this.renderLowerSprawlObjectivePanel(ctx);
			this.renderDrainmarketObjectivePanel(ctx);
			this.renderChromeArcologyObjectivePanel(ctx);
			this.renderMirrorPalaceObjectivePanel(ctx);
			this.renderDubColonyObjectivePanel(ctx);
			this.renderLateStageObjectivePanel(ctx);
			this.renderLoadoutPanel(ctx);
		}
		this.renderLateStageInterface(ctx);

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
		} else if ((this.player.victoryAnimationTimer ?? 0) > 0) {
			playAnimation(animState, 'victory', false);
		} else if ((this.player.parryWindow ?? 0) > 0) {
			playAnimation(animState, 'parry', false);
		} else if (this.player.hasRailgun && (this.player.railgunAnimationTimer ?? 0) > 0) {
			playAnimation(animState, 'shoot_railgun', false);
		} else if (this.player.meleeTimer > 0) {
			playAnimation(animState, this.player.hasKatana ? 'melee_katana' : 'melee_claws', false);
		} else if (this.player.boostCd > 0.18 && !this.player.onGround) {
			playAnimation(animState, 'rocket_boost', false);
		} else if ((this.player.interactionAnimationTimer ?? 0) > 0) {
			playAnimation(animState, 'interact', false);
		} else if ((this.player.hackAnimationTimer ?? 0) > 0) {
			playAnimation(animState, 'hack', false);
		} else if ((this.player.pickupReactionTimer ?? 0) > 0) {
			playAnimation(animState, 'pickup_react', false);
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

		const lastTransition = this.animationTransitions.at(-1);
		if (lastTransition?.name !== animState.currentAnim) {
			this.animationTransitions.push({ name: animState.currentAnim, frame: animState.frame });
			if (this.animationTransitions.length > 32) this.animationTransitions.shift();
			window.dispatchEvent(
				new CustomEvent('badger:animation-transition', {
					detail: { name: animState.currentAnim, frame: animState.frame },
				})
			);
		}

		this.advanceAnimationFrames(animState, dt);
	}

	private advanceAnimationFrames(animState: AnimationState, dt: number): void {
		const sheet = this.renderer?.getSpriteRenderer().getSheet(PLAYER_SPRITE_SHEET_ID);
		if (!sheet) return;

		let previousFrame = animState.frame;
		for (const frame of advanceAnimation(animState, sheet, dt)) {
			this.lastAnimationFrame = previousFrame;
			this.emitAnimationEvents(animState.currentAnim, frame);
			previousFrame = frame;
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
		if (this.training) {
			this.initTrainingWorld(layout);
			return;
		}
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
			const mirrorPalaceControlled =
				this.options.stageId === 'mirror-palace' &&
				(['ranged', 'bruiser'].includes(enemy.procgenRole ?? '') ||
					/banquet_usher|mirror_sentinel/i.test(enemy.procgenFamily ?? ''));
			const dubColonyControlled =
				this.options.stageId === 'dub-colony' &&
				(['ranged', 'bruiser'].includes(enemy.procgenRole ?? '') ||
					/signal_jammer_bat|feedback_guard/i.test(enemy.procgenFamily ?? ''));
			if (
				lowerSprawlControlled ||
				drainmarketControlled ||
				chromeArcologyControlled ||
				mirrorPalaceControlled ||
				dubColonyControlled
			) {
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
		const isReflectionJudge = boss.id === 'reflection-judge';
		const isKingFeedback = boss.id === 'king-feedback';
		const bossSpriteSheetId = getStoryBossSpriteSheet(boss.id);
		const hp = isKingFeedback
			? 15
			: isReflectionJudge
				? 14
				: isMadameVitrine
					? 12
					: isKnifeNest
						? 8
						: 4 + phaseCount * 2;
		return {
			x: isKingFeedback
				? 2500
				: isReflectionJudge
					? 2280
					: isMadameVitrine
						? 2070
						: isKnifeNest
							? 1710
							: 1480,
			y: isKingFeedback
				? 330
				: isReflectionJudge
					? 340
					: isMadameVitrine
						? 340
						: isKnifeNest
							? 348
							: 418,
			w: isKingFeedback
				? 84
				: isReflectionJudge
					? 76
					: isMadameVitrine
						? 72
						: isKnifeNest
							? 64
							: 42,
			h: isKingFeedback
				? 96
				: isReflectionJudge
					? 92
					: isMadameVitrine
						? 90
						: isKnifeNest
							? 82
							: 62,
			vx: 0,
			vy: 0,
			onGround: isKnifeNest || isMadameVitrine || isReflectionJudge || isKingFeedback,
			coyoteLeft: 0,
			jumpBuffered: 0,
			dir: -1,
			hp,
			maxHp: hp,
			invuln: 0,
			stun: 0,
			bossId: boss.id,
			bossName: boss.name,
			bossSpriteSheetId,
			bossAnimation: bossSpriteSheetId ? 'idle' : undefined,
			bossArgument: boss.argument,
			faction: 'enemy',
			isBossPlaceholder: true,
			procgenFamily: `${stageId}_boss_placeholder`,
			procgenRole: 'boss',
		};
	}
}
