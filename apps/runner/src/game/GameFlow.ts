import { FIRST_RELEASE_SKILL_NODES } from '@badger/progression';
import {
	BRANCH_CONSEQUENCES,
	type BossPhase,
	type BranchConsequence,
	CAMPAIGN,
	type CampaignStage,
	type SideQuest,
	type StageMinigame,
	type StageModifier,
	type StageTemplate,
} from './Campaign';
import { MODE_OPTIONS } from './ModeMenu';
import type { ResolutionApproach } from './ResolutionApproach';
import type { DroppedItem } from '../systems/ItemDropSystem';
import type { BuildTelemetrySnapshot } from '../systems/BuildComparisonTelemetrySystem';
import { sanitizeBuildTelemetryHistory } from '../systems/BuildComparisonTelemetrySystem';
import type { ExpeditionCommit } from './adventure/ExpeditionLedger';
import {
	advanceBadgerCampaignStage,
	createBadgerCampaignStageState,
	inspectBadgerCampaignProgress,
} from './RuntimeStageComposition';
import { createDefaultStoryProgress, migrateStoryProgress } from './StoryProgressMigration';
export type MenuOptionId =
	| 'story'
	| 'versus'
	| 'training'
	| 'skills'
	| 'builds'
	| 'endless';

export interface MenuOption {
	id: MenuOptionId;
	label: string;
	description: string;
}

export interface StageSpec {
	id: string;
	name: string;
	objective: string;
	dramaticQuestion: string;
	primaryVerb: string;
	rewardBlueprintShards: number;
	actId?: string;
	chapter: number;
	chapterId: string;
	place?: string;
	heistPayloadId?: string;
	placard?: string;
	boss?: BossContract;
	resultFlag?: string;
	tutorialBeats?: TutorialBeat[];
	stageModifiers?: StageModifier[];
	stageTemplate?: StageTemplate;
	choiceOutcomes?: ChoiceOutcome[];
	traversalHazards?: TraversalHazard[];
	sideQuests?: SideQuest[];
	minigames?: StageMinigame[];
}

export interface DialogueSpec {
	id: string;
	speaker: string;
	lines: string[];
	next: { mode: 'stage'; stageId: string };
}

export interface DebriefSpec {
	id: string;
	stageId: string;
	speaker: string;
	lines: string[];
}

export interface TutorialBeat {
	id: string;
	label: string;
	trigger: string;
	teaches: string;
}

export type LioTrustBranch = 'exposed' | 'protected' | 'baited';
export type ColonyAlignmentBranch = 'chorus' | 'army' | 'supplier';
export type LedgerReleaseBranch = 'public-dump' | 'targeted-burn' | 'prisoner-trade';
export type CargoReversalBranch = 'safe-partial' | 'full-release' | 'decoy-reversal';
export type FinalBroadcastBranch = 'abolish-skylock' | 'chorus-control' | 'publish-tools';
export type StoryChoiceBranch =
	| LioTrustBranch
	| ColonyAlignmentBranch
	| LedgerReleaseBranch
	| CargoReversalBranch
	| FinalBroadcastBranch;

export interface ChoiceOutcome {
	id: string;
	prompt: string;
	branch: StoryChoiceBranch;
	resultFlag: string;
	consequence: string;
	metaDelta?: { dubFavor?: number; orbitHeat?: number };
}

export interface TraversalHazard {
	id: string;
	label: string;
	teaches: string;
}

export interface BossLesson {
	id: string;
	cue: string;
	response: string;
}

export interface BossBehaviorContract {
	id: string;
	label: string;
	placeholder: boolean;
	phases: Array<{ id: string; mechanic: string }>;
}

export interface BossHackDuelContract {
	id: string;
	label: string;
	placeholder: boolean;
	rounds: number;
	mechanics: string[];
}

export interface BossContract {
	id: string;
	name: string;
	phaseCount: number;
	argument: string;
	phases?: BossPhase[];
	lessons?: BossLesson[];
	behavior?: BossBehaviorContract;
	hackDuel?: BossHackDuelContract;
}

export interface MetaState {
	credchips: number;
	blueprintShards: number;
	dubFavor: number;
	orbitHeat: number;
	unlockedBoons: string[];
	purchasedSkills: string[];
	skillRanks?: Record<string, number>;
	buildTelemetryHistory?: BuildTelemetrySnapshot[];
}

export interface StoryProgress {
	schemaVersion: number;
	currentStageId: string;
	completedStageIds: string[];
	completedChapterIds: string[];
	acquiredPayloads: string[];
	resultFlags: string[];
	lioTrust?: LioTrustBranch;
	colonyAlignment?: ColonyAlignmentBranch;
	finalBroadcastDoctrine?: FinalBroadcastBranch;
	campaignComplete: boolean;
}

export interface SkillNode {
	id: string;
	name: string;
	cost: number;
	prereqs: string[];
	unlocked: boolean;
	track?: string;
	tier?: number;
	column?: number;
	branch?: string;
	maxRank?: number;
	rank?: number;
	description?: string;
	iconAnimation?: string;
	effects?: Record<string, number | string | boolean>;
}

export interface StageRuntimeResult {
	stageId: string;
	completedQuestIds: string[];
	completedMinigameIds: string[];
	completedTutorialIds: string[];
	expeditionCommit?: ExpeditionCommit;
	rewardDrops?: DroppedItem[];
	buildTelemetry?: BuildTelemetrySnapshot;
	resolutionApproaches?: ResolutionApproach[];
	resolutionConstraints?: {
		nonLethal?: boolean;
		undetected?: boolean;
	};
}

export type SkillPurchaseFailure =
	| 'unknown-skill'
	| 'already-unlocked'
	| 'missing-prerequisite'
	| 'insufficient-shards';

export type SkillPurchaseResult =
	| { ok: true; state: MetaState; node: SkillNode }
	| { ok: false; state: MetaState; reason: SkillPurchaseFailure };

export type CredchipTransactionResult =
	| { ok: true; balance: number }
	| { ok: false; balance: number; reason: 'invalid-amount' | 'insufficient-credchips' };

export type GameFlowState =
	| { mode: 'menu' }
	| { mode: 'title-card'; stageId: string; stageIndex: number; placard: string }
	| { mode: 'dialogue'; dialogueId: string; lineIndex: number }
	| { mode: 'stage'; stageId: string; stageIndex: number }
	| { mode: 'debrief'; stageId: string; stageIndex: number; debriefId: string; lineIndex: number }
	| { mode: 'versus'; arenaId: string; winScore: number; playerScore: number; rivalScore: number }
	| { mode: 'training'; dummy: { label: string; invincible: true; hp: 'infinite' } }
	| { mode: 'skills'; selectedSkillId: string }
	| { mode: 'builds'; selectedBuildId: string; detailPage: 'routes' | 'evidence' }
	| { mode: 'endless'; seed: string; floor: number };

const MENU_OPTIONS: MenuOption[] = MODE_OPTIONS;

function stageRewardShards(stage: CampaignStage): number {
	return stage.rewards.includes('two_blueprint_shards')
		? 2
		: stage.rewards.includes('blueprint_shard')
			? 1
			: 0;
}

function toChapterId(chapter: number): string {
	return `ch${String(chapter).padStart(2, '0')}`;
}

const STAGES: StageSpec[] = CAMPAIGN.stages.map((stage) => ({
	id: stage.id,
	name: stage.name,
	objective: `${stage.primaryVerb}: ${stage.dramaticQuestion}`,
	dramaticQuestion: stage.dramaticQuestion,
	primaryVerb: stage.primaryVerb,
	rewardBlueprintShards: stageRewardShards(stage),
	actId: stage.actId,
	chapter: stage.chapter,
	chapterId: toChapterId(stage.chapter),
	place: stage.place,
	heistPayloadId: stage.heistPayload.id,
	placard: stage.placard,
	boss: {
		...stage.boss,
		lessons: stage.boss.lessons?.map((lesson) => ({ ...lesson })),
		phases: stage.boss.phases?.map((phase) => ({ ...phase })),
	},
	resultFlag: stage.resultFlag,
	tutorialBeats: stage.tutorialBeats?.map((beat) => ({ ...beat })),
	stageModifiers: stage.stageModifiers?.map((modifier) => ({ ...modifier })),
	stageTemplate: stage.stageTemplate
		? { ...stage.stageTemplate, segments: [...stage.stageTemplate.segments] }
		: undefined,
	choiceOutcomes: stage.choice.outcomes?.map((outcome) => ({ ...outcome })),
	traversalHazards: stage.traversalHazards?.map((hazard) => ({ ...hazard })),
	sideQuests: stage.sideQuests?.map((quest) => ({ ...quest })),
	minigames: stage.minigames?.map((minigame) => ({ ...minigame })),
}));

const DIALOGUES: Record<string, DialogueSpec> = Object.fromEntries(
	CAMPAIGN.stages.map((stage) => [
		`${stage.id}-briefing`,
		{
			id: `${stage.id}-briefing`,
			speaker: stage.briefing.speaker,
			lines: [...stage.briefing.lines],
			next: { mode: 'stage', stageId: stage.id },
		},
	])
);

const DEBRIEFS: Record<string, DebriefSpec> = Object.fromEntries(
	CAMPAIGN.stages.map((stage) => [
		`${stage.id}-debrief`,
		{
			id: `${stage.id}-debrief`,
			stageId: stage.id,
			speaker: stage.debrief.speaker,
			lines: [...stage.debrief.lines],
		},
	])
);

const BRANCH_DEBRIEF_LINES: Record<string, string> = {
	lio_exposed: 'Branch echo: Lio is exposed; every ally now knows trust can become evidence.',
	lio_protected: 'Branch echo: Lio is protected; mercy costs heat, but it keeps one channel human.',
	lio_baited: 'Branch echo: Lio became bait; the next rooms treat loyalty like a tactical asset.',
	colony_alignment_chorus: 'Branch echo: the colony hears itself as a chorus, not an army.',
	colony_alignment_army: 'Branch echo: the colony hardens into ranks, shields up before songs.',
	colony_alignment_supplier:
		'Branch echo: the colony chooses supply lines, favors, and quiet exits.',
	ledger_public_dump: 'Branch echo: the ledger went public; the city argues with receipts in hand.',
	ledger_targeted_burn: 'Branch echo: the ledger burn is targeted; fewer sparks, sharper enemies.',
	ledger_prisoner_trade: 'Branch echo: the ledger becomes ransom; the freed remember who paid.',
	cargo_safe_partial:
		'Branch echo: the cargo reversal is partial; safe crates move before perfect justice.',
	cargo_full_release:
		'Branch echo: the cargo opens fully; heat rises because everyone can see the theft.',
	cargo_decoy_reversal:
		'Branch echo: the decoy reversal buys time while the real route slips sideways.',
	broadcast_abolish_skylock: 'Ending echo: abolish Skylock; no one gets to own the route again.',
	broadcast_chorus_control:
		'Ending echo: chorus control; the system survives only while the choir watches it.',
	broadcast_publish_tools:
		'Ending echo: publish the tools; every kid gets the manual, not just the myth.',
};

function buildDebriefLines(baseLines: readonly string[], resultFlags: readonly string[]): string[] {
	const branchLines = resultFlags
		.map((flag) => BRANCH_DEBRIEF_LINES[flag])
		.filter((line): line is string => Boolean(line));
	return [...baseLines, ...Array.from(new Set(branchLines))];
}

const SKILLS: SkillNode[] = FIRST_RELEASE_SKILL_NODES.map((skill) => ({
	...skill,
	prereqs: [...skill.prereqs],
	effects: skill.effects ? { ...skill.effects } : undefined,
	unlocked: false,
}));

function createDefaultMetaState(): MetaState {
	return {
		credchips: 0,
		blueprintShards: 0,
		dubFavor: 0,
		orbitHeat: 0,
		unlockedBoons: [],
		purchasedSkills: [],
		skillRanks: {},
		buildTelemetryHistory: [],
	};
}

function createSkillMap(
	purchasedSkills: readonly string[],
	skillRanks: Readonly<Record<string, number>> = {}
): Map<string, SkillNode> {
	const nodes = new Map(
		SKILLS.map((skill) => [
			skill.id,
			{
				...skill,
				prereqs: [...skill.prereqs],
				effects: skill.effects ? { ...skill.effects } : undefined,
				rank: 0,
			},
		])
	);
	for (const skillId of purchasedSkills) {
		const node = nodes.get(skillId);
		if (node) {
			node.rank = Math.max(1, Math.min(node.maxRank ?? 1, Math.floor(skillRanks[skillId] ?? 1)));
			node.unlocked = true;
		}
	}
	return nodes;
}

function purchaseSkill(
	nodes: Map<string, SkillNode>,
	state: MetaState,
	nodeId: string
): SkillPurchaseResult {
	const node = nodes.get(nodeId);
	if (!node) return { ok: false, state, reason: 'unknown-skill' };
	const rank = Math.max(
		node.rank ?? 0,
		state.skillRanks?.[nodeId] ?? (state.purchasedSkills.includes(nodeId) ? 1 : 0)
	);
	if (rank >= (node.maxRank ?? 1)) {
		return { ok: false, state, reason: 'already-unlocked' };
	}

	const hasPrerequisites = node.prereqs.every((prereqId) =>
		Boolean(nodes.get(prereqId)?.unlocked || state.purchasedSkills.includes(prereqId))
	);
	if (!hasPrerequisites) return { ok: false, state, reason: 'missing-prerequisite' };
	if (state.blueprintShards < node.cost) return { ok: false, state, reason: 'insufficient-shards' };

	const nextRank = rank + 1;
	node.unlocked = true;
	node.rank = nextRank;
	const nextState = {
		...state,
		blueprintShards: state.blueprintShards - node.cost,
		purchasedSkills: state.purchasedSkills.includes(nodeId)
			? [...state.purchasedSkills]
			: [...state.purchasedSkills, nodeId],
		skillRanks: { ...(state.skillRanks ?? {}), [nodeId]: nextRank },
	};
	return { ok: true, state: nextState, node: { ...node } };
}

function cloneState<T>(value: T): T {
	return structuredClone(value) as T;
}

export type StageChoiceResult =
	| { ok: true; stageId: string; branch: StoryChoiceBranch; resultFlag: string }
	| { ok: false; reason: 'not-in-stage' | 'choice-unavailable' | 'choice-out-of-range' };

export class GameFlow {
	private state: GameFlowState = { mode: 'menu' };
	private meta: MetaState;
	private storyProgress: StoryProgress;
	private skills: Map<string, SkillNode>;

	constructor(meta: Partial<MetaState> = {}, storyProgress: Partial<StoryProgress> = {}) {
		this.meta = { ...createDefaultMetaState(), ...meta };
		this.meta.skillRanks = {
			...Object.fromEntries(this.meta.purchasedSkills.map((id) => [id, 1])),
			...(meta.skillRanks ?? {}),
		};
		this.meta.buildTelemetryHistory = sanitizeBuildTelemetryHistory(
			meta.buildTelemetryHistory
		);
		this.storyProgress = migrateStoryProgress({
			...createDefaultStoryProgress(),
			...storyProgress,
		}).progress;
		this.skills = createSkillMap(this.meta.purchasedSkills, this.meta.skillRanks);
	}

	getState(): GameFlowState {
		return cloneState(this.state);
	}

	getMeta(): MetaState {
		return cloneState(this.meta);
	}

	getStoryProgress(): StoryProgress {
		return cloneState(this.storyProgress);
	}

	getBuildTelemetryHistory(stageId?: string): BuildTelemetrySnapshot[] {
		const history = sanitizeBuildTelemetryHistory(this.meta.buildTelemetryHistory);
		return stageId ? history.filter((run) => run.stageId === stageId) : history;
	}

	getCampaignRuntimeSnapshot() {
		return inspectBadgerCampaignProgress(this.storyProgress);
	}

	getMenuOptions(): MenuOption[] {
		return MENU_OPTIONS.map((option) => ({ ...option }));
	}

	getSkills(): SkillNode[] {
		return SKILLS.map((skill) => ({
			...skill,
			prereqs: [...skill.prereqs],
			effects: skill.effects ? { ...skill.effects } : undefined,
			unlocked: Boolean(this.skills.get(skill.id)?.unlocked),
			rank: this.skills.get(skill.id)?.rank ?? 0,
		}));
	}

	getStages(): StageSpec[] {
		return STAGES.map((stage) => ({
			...stage,
			boss: stage.boss
				? {
						...stage.boss,
						lessons: stage.boss.lessons?.map((lesson) => ({ ...lesson })),
						phases: stage.boss.phases?.map((phase) => ({ ...phase })),
					}
				: undefined,
			tutorialBeats: stage.tutorialBeats?.map((beat) => ({ ...beat })),
			stageModifiers: stage.stageModifiers?.map((modifier) => ({ ...modifier })),
			stageTemplate: stage.stageTemplate
				? { ...stage.stageTemplate, segments: [...stage.stageTemplate.segments] }
				: undefined,
			choiceOutcomes: stage.choiceOutcomes?.map((outcome) => ({ ...outcome })),
			traversalHazards: stage.traversalHazards?.map((hazard) => ({ ...hazard })),
			sideQuests: stage.sideQuests?.map((quest) => ({ ...quest })),
			minigames: stage.minigames?.map((minigame) => ({ ...minigame })),
		}));
	}

	getCurrentStage(): StageSpec | undefined {
		const state = this.state;
		if (state.mode !== 'stage') return undefined;
		const stage = STAGES[state.stageIndex];
		return stage
			? {
					...stage,
					boss: stage.boss
						? {
								...stage.boss,
								lessons: stage.boss.lessons?.map((lesson) => ({ ...lesson })),
								phases: stage.boss.phases?.map((phase) => ({ ...phase })),
							}
						: undefined,
					tutorialBeats: stage.tutorialBeats?.map((beat) => ({ ...beat })),
					stageModifiers: stage.stageModifiers?.map((modifier) => ({ ...modifier })),
					stageTemplate: stage.stageTemplate
						? { ...stage.stageTemplate, segments: [...stage.stageTemplate.segments] }
						: undefined,
					choiceOutcomes: stage.choiceOutcomes?.map((outcome) => ({ ...outcome })),
					traversalHazards: stage.traversalHazards?.map((hazard) => ({ ...hazard })),
					sideQuests: stage.sideQuests?.map((quest) => ({ ...quest })),
					minigames: stage.minigames?.map((minigame) => ({ ...minigame })),
				}
			: undefined;
	}

	getCurrentChapterId(): string | undefined {
		const state = this.state;
		if (
			state.mode === 'menu' ||
			state.mode === 'versus' ||
			state.mode === 'training' ||
			state.mode === 'skills' ||
			state.mode === 'builds' ||
			state.mode === 'endless'
		) {
			return undefined;
		}
		const stage =
			state.mode === 'dialogue'
				? STAGES.find((candidate) => `${candidate.id}-briefing` === state.dialogueId)
				: STAGES[state.stageIndex];
		return stage?.chapterId;
	}

	getCompletedChapterIds(): string[] {
		return [...this.storyProgress.completedChapterIds];
	}

	getActiveBranchConsequences(stageId = this.getCurrentStage()?.id): BranchConsequence[] {
		if (!stageId) return [];
		const resultFlags = new Set(this.storyProgress.resultFlags);
		return BRANCH_CONSEQUENCES.filter(
			(consequence) =>
				resultFlags.has(consequence.resultFlag) && consequence.stageIds.includes(stageId)
		).map((consequence) => ({
			...consequence,
			stageIds: [...consequence.stageIds],
		}));
	}

	getCurrentDialogue(): DialogueSpec | undefined {
		if (this.state.mode !== 'dialogue') return undefined;
		const dialogue = DIALOGUES[this.state.dialogueId];
		return dialogue
			? { ...dialogue, lines: [...dialogue.lines], next: { ...dialogue.next } }
			: undefined;
	}

	getCurrentDebrief(): DebriefSpec | undefined {
		if (this.state.mode !== 'debrief') return undefined;
		const debrief = DEBRIEFS[this.state.debriefId];
		return debrief
			? { ...debrief, lines: buildDebriefLines(debrief.lines, this.storyProgress.resultFlags) }
			: undefined;
	}

	getCurrentBossContract(): BossContract | undefined {
		const state = this.state;
		if (
			state.mode === 'menu' ||
			state.mode === 'versus' ||
			state.mode === 'training' ||
			state.mode === 'skills' ||
			state.mode === 'builds' ||
			state.mode === 'endless'
		) {
			return undefined;
		}
		const stage =
			state.mode === 'dialogue'
				? STAGES.find((candidate) => `${candidate.id}-briefing` === state.dialogueId)
				: STAGES[state.stageIndex];
		return stage?.boss ? { ...stage.boss } : undefined;
	}

	selectMenu(id: MenuOptionId): void {
		switch (id) {
			case 'story': {
				const stageId = this.storyProgress.campaignComplete
					? STAGES[0]?.id
					: createBadgerCampaignStageState(this.storyProgress).currentNodeId;
				const stageIndex = STAGES.findIndex((stage) => stage.id === stageId);
				const stage = STAGES[stageIndex] ?? STAGES[0];
				if (!stage) {
					this.returnToMenu();
					break;
				}
				this.state = {
					mode: 'title-card',
					stageId: stage.id,
					stageIndex: Math.max(0, stageIndex),
					placard: stage.placard ?? stage.name,
				};
				break;
			}
			case 'versus':
				this.state = {
					mode: 'versus',
					arenaId: 'duel-yard',
					winScore: 3,
					playerScore: 0,
					rivalScore: 0,
				};
				break;
			case 'training':
				this.state = {
					mode: 'training',
					dummy: { label: 'Dummy Badger', invincible: true, hp: 'infinite' },
				};
				break;
			case 'skills':
				this.state = { mode: 'skills', selectedSkillId: 'double_swipe' };
				break;
			case 'builds':
				this.state = {
					mode: 'builds',
					selectedBuildId: 'ghost-signal',
					detailPage: 'routes',
				};
				break;
			case 'endless':
				this.state = { mode: 'endless', seed: 'endless-sprawl', floor: 1 };
				break;
		}
	}

	advanceTitleCard(): void {
		if (this.state.mode !== 'title-card') return;
		this.state = {
			mode: 'dialogue',
			dialogueId: `${this.state.stageId}-briefing`,
			lineIndex: 0,
		};
	}

	advanceDialogue(): void {
		if (this.state.mode !== 'dialogue') return;
		const dialogue = DIALOGUES[this.state.dialogueId];
		if (!dialogue) {
			this.returnToMenu();
			return;
		}

		if (this.state.lineIndex < dialogue.lines.length - 1) {
			this.state = { ...this.state, lineIndex: this.state.lineIndex + 1 };
			return;
		}

		const stageIndex = STAGES.findIndex((stage) => stage.id === dialogue.next.stageId);
		const stage = STAGES[stageIndex];
		if (!stage) {
			this.returnToMenu();
			return;
		}
		this.state = { mode: 'stage', stageId: stage.id, stageIndex };
	}

	chooseStageChoice(choiceIndex: number): StageChoiceResult {
		if (this.state.mode !== 'stage') return { ok: false, reason: 'not-in-stage' };
		const stage = STAGES[this.state.stageIndex];
		if (!stage?.choiceOutcomes?.length) return { ok: false, reason: 'choice-unavailable' };
		const outcome = stage.choiceOutcomes[choiceIndex];
		if (!outcome) return { ok: false, reason: 'choice-out-of-range' };

		const branchProgress =
			stage.id === 'mirror-palace'
				? { lioTrust: outcome.branch as LioTrustBranch }
				: stage.id === 'dub-colony'
					? { colonyAlignment: outcome.branch as ColonyAlignmentBranch }
					: stage.id === 'asteroid-redoubt'
						? { finalBroadcastDoctrine: outcome.branch as FinalBroadcastBranch }
						: {};

		const stageChoiceFlags = new Set(stage.choiceOutcomes.map((choice) => choice.resultFlag));
		const priorOutcomes = stage.choiceOutcomes.filter((choice) =>
			this.storyProgress.resultFlags.includes(choice.resultFlag)
		);
		const priorDubFavor = priorOutcomes.reduce(
			(total, choice) => total + (choice.metaDelta?.dubFavor ?? 0),
			0
		);
		const priorOrbitHeat = priorOutcomes.reduce(
			(total, choice) => total + (choice.metaDelta?.orbitHeat ?? 0),
			0
		);

		this.storyProgress = {
			...this.storyProgress,
			...branchProgress,
			resultFlags: [
				...this.storyProgress.resultFlags.filter((flag) => !stageChoiceFlags.has(flag)),
				outcome.resultFlag,
			],
		};
		this.meta = {
			...this.meta,
			dubFavor: this.meta.dubFavor - priorDubFavor + (outcome.metaDelta?.dubFavor ?? 0),
			orbitHeat: this.meta.orbitHeat - priorOrbitHeat + (outcome.metaDelta?.orbitHeat ?? 0),
		};

		return { ok: true, stageId: stage.id, branch: outcome.branch, resultFlag: outcome.resultFlag };
	}

	completeStage(): void {
		if (this.state.mode !== 'stage') return;
		const stage = STAGES[this.state.stageIndex];
		if (stage) {
			this.meta = {
				...this.meta,
				blueprintShards: this.meta.blueprintShards + stage.rewardBlueprintShards,
			};
			this.storyProgress = {
				...this.storyProgress,
				completedStageIds: Array.from(new Set([...this.storyProgress.completedStageIds, stage.id])),
				completedChapterIds: Array.from(
					new Set([...this.storyProgress.completedChapterIds, stage.chapterId])
				),
				acquiredPayloads: stage.heistPayloadId
					? Array.from(new Set([...this.storyProgress.acquiredPayloads, stage.heistPayloadId]))
					: this.storyProgress.acquiredPayloads,
				resultFlags: stage.resultFlag
					? Array.from(new Set([...this.storyProgress.resultFlags, stage.resultFlag]))
					: this.storyProgress.resultFlags,
			};
		}

		if (stage) {
			this.state = {
				mode: 'debrief',
				stageId: stage.id,
				stageIndex: this.state.stageIndex,
				debriefId: `${stage.id}-debrief`,
				lineIndex: 0,
			};
			return;
		}

		this.returnToMenu();
	}

	advanceDebrief(): void {
		if (this.state.mode !== 'debrief') return;
		const debrief = this.getCurrentDebrief();
		if (debrief && this.state.lineIndex < debrief.lines.length - 1) {
			this.state = { ...this.state, lineIndex: this.state.lineIndex + 1 };
			return;
		}

		const progression = advanceBadgerCampaignStage(this.storyProgress);
		if (progression.state.status !== 'complete' && progression.changed) {
			const nextStage = STAGES.find((stage) => stage.id === progression.state.currentNodeId);
			const nextStageIndex = nextStage ? STAGES.indexOf(nextStage) : -1;
			if (!nextStage || nextStageIndex < 0) {
				this.returnToMenu();
				return;
			}
			this.storyProgress = {
				...this.storyProgress,
				currentStageId: nextStage.id,
				completedStageIds: [...progression.state.completedNodeIds],
			};
			this.state = {
				mode: 'title-card',
				stageId: nextStage.id,
				stageIndex: nextStageIndex,
				placard: nextStage.placard ?? nextStage.name,
			};
			return;
		}

		this.storyProgress = {
			...this.storyProgress,
			completedStageIds: [...progression.state.completedNodeIds],
			campaignComplete: progression.state.status === 'complete',
		};
		this.returnToMenu();
	}

	scoreVersusTag(side: 'player' | 'rival'): {
		winner?: 'player' | 'rival';
		playerScore: number;
		rivalScore: number;
	} {
		if (this.state.mode !== 'versus') return { playerScore: 0, rivalScore: 0 };

		const playerScore = this.state.playerScore + (side === 'player' ? 1 : 0);
		const rivalScore = this.state.rivalScore + (side === 'rival' ? 1 : 0);
		this.state = { ...this.state, playerScore, rivalScore };

		return {
			winner:
				playerScore >= this.state.winScore
					? 'player'
					: rivalScore >= this.state.winScore
						? 'rival'
						: undefined,
			playerScore,
			rivalScore,
		};
	}

	purchaseSkill(skillId: string): SkillPurchaseResult {
		const result = purchaseSkill(this.skills, this.meta, skillId);
		this.meta = result.state;
		return result;
	}

	spendCredchips(amount: number): CredchipTransactionResult {
		if (!Number.isInteger(amount) || amount <= 0) {
			return { ok: false, balance: this.meta.credchips, reason: 'invalid-amount' };
		}
		if (this.meta.credchips < amount) {
			return {
				ok: false,
				balance: this.meta.credchips,
				reason: 'insufficient-credchips',
			};
		}
		this.meta = { ...this.meta, credchips: this.meta.credchips - amount };
		return { ok: true, balance: this.meta.credchips };
	}

	grantCredchips(amount: number): CredchipTransactionResult {
		if (!Number.isInteger(amount) || amount <= 0) {
			return { ok: false, balance: this.meta.credchips, reason: 'invalid-amount' };
		}
		this.meta = { ...this.meta, credchips: this.meta.credchips + amount };
		return { ok: true, balance: this.meta.credchips };
	}

	recordStageRuntimeResult(result: StageRuntimeResult): void {
		const currentStage = this.getCurrentStage();
		if (!currentStage || currentStage.id !== result.stageId) return;

		const existingFlags = new Set(this.storyProgress.resultFlags);
		let dubFavorDelta = 0;
		let credchipDelta = 0;
		const nextBoons = new Set(this.meta.unlockedBoons);
		const telemetryHistory = result.buildTelemetry
			? sanitizeBuildTelemetryHistory([
					...(this.meta.buildTelemetryHistory ?? []),
					result.buildTelemetry,
				])
			: sanitizeBuildTelemetryHistory(this.meta.buildTelemetryHistory);

		for (const questId of result.completedQuestIds) {
			const flag = `quest_${questId.replaceAll('-', '_')}`;
			if (!existingFlags.has(flag)) {
				existingFlags.add(flag);
				if (questId === 'meter-maidens-ledger') {
					dubFavorDelta += 1;
					credchipDelta += 25;
					nextBoons.add('safer_route_rumor');
				}
			}
		}

		for (const minigameId of result.completedMinigameIds) {
			const flag = `puzzle_${minigameId.replaceAll('-', '_')}`;
			if (!existingFlags.has(flag)) {
				existingFlags.add(flag);
				if (minigameId === 'toll-gate-rhythm') {
					dubFavorDelta += 1;
					nextBoons.add('lower_sprawl_route_safety');
				}
			}
		}

		for (const tutorialId of result.completedTutorialIds) {
			existingFlags.add(`tutorial_${tutorialId.replaceAll('-', '_')}`);
		}

		this.storyProgress = {
			...this.storyProgress,
			resultFlags: [...existingFlags],
		};
		this.meta = {
			...this.meta,
			credchips: this.meta.credchips + credchipDelta,
			dubFavor: this.meta.dubFavor + dubFavorDelta,
			unlockedBoons: [...nextBoons],
			buildTelemetryHistory: telemetryHistory,
		};
	}

	returnToMenu(): void {
		this.state = { mode: 'menu' };
	}
}

export function createGameFlow(
	meta?: Partial<MetaState>,
	storyProgress?: Partial<StoryProgress>
): GameFlow {
	return new GameFlow(meta, storyProgress);
}
