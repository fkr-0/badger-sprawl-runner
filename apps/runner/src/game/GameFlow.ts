import { CAMPAIGN, type CampaignStage, type SideQuest, type StageMinigame } from './Campaign';
import { MODE_OPTIONS } from './ModeMenu';
export type MenuOptionId = 'story' | 'versus' | 'training' | 'skills';

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

export interface BossContract {
	id: string;
	name: string;
	phaseCount: number;
	argument: string;
	lessons?: BossLesson[];
}

export interface MetaState {
	credchips: number;
	blueprintShards: number;
	dubFavor: number;
	orbitHeat: number;
	unlockedBoons: string[];
	purchasedSkills: string[];
}

export interface StoryProgress {
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
}

export type SkillPurchaseFailure =
	| 'unknown-skill'
	| 'already-unlocked'
	| 'missing-prerequisite'
	| 'insufficient-shards';

export type SkillPurchaseResult =
	| { ok: true; state: MetaState; node: SkillNode }
	| { ok: false; state: MetaState; reason: SkillPurchaseFailure };

export type GameFlowState =
	| { mode: 'menu' }
	| { mode: 'title-card'; stageId: string; stageIndex: number; placard: string }
	| { mode: 'dialogue'; dialogueId: string; lineIndex: number }
	| { mode: 'stage'; stageId: string; stageIndex: number }
	| { mode: 'debrief'; stageId: string; stageIndex: number; debriefId: string; lineIndex: number }
	| { mode: 'versus'; arenaId: string; winScore: number; playerScore: number; rivalScore: number }
	| { mode: 'training'; dummy: { label: string; invincible: true; hp: 'infinite' } }
	| { mode: 'skills'; selectedSkillId: string };

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
	rewardBlueprintShards: stageRewardShards(stage),
	actId: stage.actId,
	chapter: stage.chapter,
	chapterId: toChapterId(stage.chapter),
	place: stage.place,
	heistPayloadId: stage.heistPayload.id,
	placard: stage.placard,
	boss: { ...stage.boss, lessons: stage.boss.lessons?.map((lesson) => ({ ...lesson })) },
	resultFlag: stage.resultFlag,
	tutorialBeats: stage.tutorialBeats?.map((beat) => ({ ...beat })),
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

const SKILLS: SkillNode[] = [
	{ id: 'double_swipe', name: 'Double Swipe', cost: 1, prereqs: [], unlocked: false },
	{ id: 'parry_tooth', name: 'Parry Tooth', cost: 2, prereqs: ['double_swipe'], unlocked: false },
	{ id: 'claw_rush', name: 'Claw Rush', cost: 2, prereqs: ['parry_tooth'], unlocked: false },
	{ id: 'rail_mastery', name: 'Rail Mastery', cost: 2, prereqs: [], unlocked: false },
	{
		id: 'piercing_shot',
		name: 'Piercing Shot',
		cost: 2,
		prereqs: ['rail_mastery'],
		unlocked: false,
	},
	{ id: 'emp_blast', name: 'EMP Blast', cost: 3, prereqs: ['piercing_shot'], unlocked: false },
];

function createDefaultMetaState(): MetaState {
	return {
		credchips: 0,
		blueprintShards: 0,
		dubFavor: 0,
		orbitHeat: 0,
		unlockedBoons: [],
		purchasedSkills: [],
	};
}

function createDefaultStoryProgress(): StoryProgress {
	return {
		currentStageId: STAGES[0]?.id ?? '',
		completedStageIds: [],
		completedChapterIds: [],
		acquiredPayloads: [],
		resultFlags: [],
		campaignComplete: false,
	};
}

function createSkillMap(purchasedSkills: readonly string[]): Map<string, SkillNode> {
	const nodes = new Map(SKILLS.map((skill) => [skill.id, { ...skill }]));
	for (const skillId of purchasedSkills) {
		const node = nodes.get(skillId);
		if (node) node.unlocked = true;
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
	if (node.unlocked || state.purchasedSkills.includes(nodeId)) {
		return { ok: false, state, reason: 'already-unlocked' };
	}

	const hasPrerequisites = node.prereqs.every((prereqId) =>
		Boolean(nodes.get(prereqId)?.unlocked || state.purchasedSkills.includes(prereqId))
	);
	if (!hasPrerequisites) return { ok: false, state, reason: 'missing-prerequisite' };
	if (state.blueprintShards < node.cost) return { ok: false, state, reason: 'insufficient-shards' };

	node.unlocked = true;
	const nextState = {
		...state,
		blueprintShards: state.blueprintShards - node.cost,
		purchasedSkills: [...state.purchasedSkills, nodeId],
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
		this.storyProgress = { ...createDefaultStoryProgress(), ...storyProgress };
		this.skills = createSkillMap(this.meta.purchasedSkills);
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

	getMenuOptions(): MenuOption[] {
		return MENU_OPTIONS.map((option) => ({ ...option }));
	}

	getStages(): StageSpec[] {
		return STAGES.map((stage) => ({
			...stage,
			boss: stage.boss
				? { ...stage.boss, lessons: stage.boss.lessons?.map((lesson) => ({ ...lesson })) }
				: undefined,
			tutorialBeats: stage.tutorialBeats?.map((beat) => ({ ...beat })),
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
						? { ...stage.boss, lessons: stage.boss.lessons?.map((lesson) => ({ ...lesson })) }
						: undefined,
					tutorialBeats: stage.tutorialBeats?.map((beat) => ({ ...beat })),
					choiceOutcomes: stage.choiceOutcomes?.map((outcome) => ({ ...outcome })),
					traversalHazards: stage.traversalHazards?.map((hazard) => ({ ...hazard })),
					sideQuests: stage.sideQuests?.map((quest) => ({ ...quest })),
					minigames: stage.minigames?.map((minigame) => ({ ...minigame })),
				}
			: undefined;
	}

	getCurrentChapterId(): string | undefined {
		const state = this.state;
		if (state.mode === 'menu' || state.mode === 'versus' || state.mode === 'training' || state.mode === 'skills') {
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
		return debrief ? { ...debrief, lines: [...debrief.lines] } : undefined;
	}

	getCurrentBossContract(): BossContract | undefined {
		const state = this.state;
		if (
			state.mode === 'menu' ||
			state.mode === 'versus' ||
			state.mode === 'training' ||
			state.mode === 'skills'
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
					: this.storyProgress.currentStageId;
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

		this.storyProgress = {
			...this.storyProgress,
			...branchProgress,
			resultFlags: Array.from(new Set([...this.storyProgress.resultFlags, outcome.resultFlag])),
		};
		if (outcome.metaDelta) {
			this.meta = {
				...this.meta,
				dubFavor: this.meta.dubFavor + (outcome.metaDelta.dubFavor ?? 0),
				orbitHeat: this.meta.orbitHeat + (outcome.metaDelta.orbitHeat ?? 0),
			};
		}

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
		const debrief = DEBRIEFS[this.state.debriefId];
		if (debrief && this.state.lineIndex < debrief.lines.length - 1) {
			this.state = { ...this.state, lineIndex: this.state.lineIndex + 1 };
			return;
		}

		const nextStage = STAGES[this.state.stageIndex + 1];
		if (nextStage) {
			this.storyProgress = { ...this.storyProgress, currentStageId: nextStage.id };
			this.state = {
				mode: 'title-card',
				stageId: nextStage.id,
				stageIndex: this.state.stageIndex + 1,
				placard: nextStage.placard ?? nextStage.name,
			};
			return;
		}

		this.storyProgress = { ...this.storyProgress, campaignComplete: true };
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
