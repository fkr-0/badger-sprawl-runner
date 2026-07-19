export type ActId = 'prologue' | 'act-i' | 'act-ii' | 'act-iii' | 'act-iv' | 'act-v';

export interface CampaignAct {
	id: ActId;
	title: string;
	brechtDevice: string;
	dramaticContradiction: string;
	stages: string[];
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
	metaDelta?: MetaDelta;
}

export interface CampaignChoice {
	id: string;
	question: string;
	prompts: [string, string, string];
	trackedFlag: 'lioTrust' | 'colonyAlignment' | 'dubFavor' | 'orbitHeat' | 'broadcastDoctrine';
	outcomes?: ChoiceOutcome[];
}

export interface TutorialBeat {
	id: string;
	label: string;
	trigger: string;
	teaches: string;
}

export interface BossLesson {
	id: string;
	cue: string;
	response: string;
}

export interface StageRoom {
	id: string;
	label: string;
	teaches: string;
}

export interface BackgroundTag {
	id: string;
	label: string;
	reveal: string;
}

export interface BossPhase {
	id: string;
	label: string;
	mechanic: string;
}

export interface TraversalHazard {
	id: string;
	label: string;
	teaches: string;
}

export interface StageModifier {
	id: string;
	label: string;
	kind: 'beat-timing' | 'code-gate-pressure';
	bpm?: number;
	perfectWindowMs?: number;
	gatesPerMinute?: number;
	minGatesPerRun?: number;
	teaches: string;
}

export interface SideQuest {
	id: string;
	title: string;
	giver: string;
	objective: string;
	reward: string;
	stageHook: string;
}

export interface StageMinigame {
	id: string;
	title: string;
	kind: 'timing' | 'codegate' | 'routing' | 'memory' | 'signal';
	objective: string;
	teaches: string;
	reward: string;
}

export interface BranchConsequence {
	resultFlag: string;
	label: string;
	stageIds: string[];
	gameplayHook: string;
	uiHint: string;
}

export interface MetaDelta {
	dubFavor?: number;
	orbitHeat?: number;
}

export interface HackDuelPlaceholder {
	id: string;
	label: string;
	placeholder: true;
	rounds: number;
	mechanics: string[];
}

export interface CompanionPlaceholder {
	id: string;
	name: string;
	role: string;
	placeholder: boolean;
	abilities: string[];
}

export interface StageTemplate {
	id: string;
	label: string;
	kind: 'escape-chase';
	segments: string[];
	escalation: string;
}

export interface BossBehaviorPhase {
	id: string;
	mechanic: string;
}

export interface BossBehaviorPlaceholder {
	id: string;
	label: string;
	placeholder: true;
	phases: BossBehaviorPhase[];
}

export interface CampaignStage {
	id: string;
	actId: ActId;
	chapter: number;
	place: string;
	name: string;
	primaryVerb: string;
	dramaticQuestion: string;
	placard: string;
	briefing: { speaker: string; lines: string[] };
	machinery: string[];
	rooms?: StageRoom[];
	backgroundTags?: BackgroundTag[];
	traversalHazards?: TraversalHazard[];
	stageModifiers?: StageModifier[];
	sideQuests?: SideQuest[];
	minigames?: StageMinigame[];
	companion?: CompanionPlaceholder;
	stageTemplate?: StageTemplate;
	heistPayload: { id: string; label: string; function: string };
	choice: CampaignChoice;
	boss: {
		id: string;
		name: string;
		phaseCount: number;
		argument: string;
		lessons?: BossLesson[];
		phases?: BossPhase[];
		hackDuel?: HackDuelPlaceholder;
		behavior?: BossBehaviorPlaceholder;
	};
	debrief: { speaker: string; lines: string[] };
	rewards: string[];
	resultFlag?: string;
	tutorialBeats?: TutorialBeat[];
	todo: string[];
	skeleton: { playable: true; placeholderBoss: true; stageTemplate: string };
}

export interface CampaignDefinition {
	title: string;
	dramaticForm: string;
	acts: CampaignAct[];
	stages: CampaignStage[];
}
