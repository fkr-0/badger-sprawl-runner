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
	rewardBlueprintShards: number;
}

export interface DialogueSpec {
	id: string;
	speaker: string;
	lines: string[];
	next: { mode: 'stage'; stageIndex: number };
}

export interface MetaState {
	credchips: number;
	blueprintShards: number;
	dubFavor: number;
	orbitHeat: number;
	unlockedBoons: string[];
	purchasedSkills: string[];
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
	| { mode: 'dialogue'; dialogueId: string; lineIndex: number }
	| { mode: 'stage'; stageId: string; stageIndex: number }
	| { mode: 'versus'; arenaId: string; winScore: number; playerScore: number; rivalScore: number }
	| { mode: 'training'; dummy: { label: string; invincible: true; hp: 'infinite' } }
	| { mode: 'skills'; selectedSkillId: string };

const MENU_OPTIONS: MenuOption[] = [
	{ id: 'story', label: 'Story Run', description: 'Play the first two sprawl stages.' },
	{ id: 'versus', label: 'VS Mode', description: 'Local duel prototype: first to 3 tags.' },
	{
		id: 'training',
		label: 'Dummy Training',
		description: 'Practice movement and combat on an invincible target.',
	},
	{
		id: 'skills',
		label: 'Skill Tree',
		description: 'Spend blueprint shards on persistent upgrades.',
	},
];

const STAGES: StageSpec[] = [
	{
		id: 'rootway-market',
		name: 'Rootway Market Sprint',
		objective: 'Cross the neon market and recover the railgun cache.',
		rewardBlueprintShards: 1,
	},
	{
		id: 'antenna-rooftops',
		name: 'Antenna Rooftops',
		objective: 'Climb the broadcast stacks and shut down the drone repeater.',
		rewardBlueprintShards: 2,
	},
];

const DIALOGUES: Record<string, DialogueSpec> = {
	prologue: {
		id: 'prologue',
		speaker: 'Moss',
		lines: [
			'Sprawl lights are flickering. That means drones are awake.',
			'Two clean runs, no hero speeches. Snatch the cache, then cut the repeater.',
		],
		next: { mode: 'stage', stageIndex: 0 },
	},
	'antenna-briefing': {
		id: 'antenna-briefing',
		speaker: 'Patch',
		lines: [
			'Market cache is live. Rooftop repeater is next; keep your claws low and your rail hot.',
		],
		next: { mode: 'stage', stageIndex: 1 },
	},
};

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

export class GameFlow {
	private state: GameFlowState = { mode: 'menu' };
	private meta: MetaState;
	private skills: Map<string, SkillNode>;

	constructor(meta: Partial<MetaState> = {}) {
		this.meta = { ...createDefaultMetaState(), ...meta };
		this.skills = createSkillMap(this.meta.purchasedSkills);
	}

	getState(): GameFlowState {
		return cloneState(this.state);
	}

	getMeta(): MetaState {
		return cloneState(this.meta);
	}

	getMenuOptions(): MenuOption[] {
		return MENU_OPTIONS.map((option) => ({ ...option }));
	}

	getStages(): StageSpec[] {
		return STAGES.map((stage) => ({ ...stage }));
	}

	getCurrentDialogue(): DialogueSpec | undefined {
		if (this.state.mode !== 'dialogue') return undefined;
		const dialogue = DIALOGUES[this.state.dialogueId];
		return dialogue
			? { ...dialogue, lines: [...dialogue.lines], next: { ...dialogue.next } }
			: undefined;
	}

	selectMenu(id: MenuOptionId): void {
		switch (id) {
			case 'story':
				this.state = { mode: 'dialogue', dialogueId: 'prologue', lineIndex: 0 };
				break;
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

		const stage = STAGES[dialogue.next.stageIndex];
		if (!stage) {
			this.returnToMenu();
			return;
		}
		this.state = { mode: 'stage', stageId: stage.id, stageIndex: dialogue.next.stageIndex };
	}

	completeStage(): void {
		if (this.state.mode !== 'stage') return;
		const stage = STAGES[this.state.stageIndex];
		if (stage) {
			this.meta = {
				...this.meta,
				blueprintShards: this.meta.blueprintShards + stage.rewardBlueprintShards,
			};
		}

		if (this.state.stageIndex === 0) {
			this.state = { mode: 'dialogue', dialogueId: 'antenna-briefing', lineIndex: 0 };
			return;
		}

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

export function createGameFlow(meta?: Partial<MetaState>): GameFlow {
	return new GameFlow(meta);
}
