import type { ActionMap } from '../systems/InputSystem';
import type { LateStoryStageId } from './LateStageSpriteBindings';

export interface LateStageObjectiveNode {
	id: string;
	label: string;
	x: number;
	y: number;
}

export interface LateStageObjectiveConfig {
	stageId: LateStoryStageId;
	primaryLabel: string;
	supportLabel: string;
	completionLabel: string;
	minigameId: string;
	questId: string;
	tutorialId: string;
	payloadId: string;
	payloadLabel: string;
	bossId: string;
	bossLabel: string;
	primaryNodes: readonly LateStageObjectiveNode[];
	supportNodes: readonly LateStageObjectiveNode[];
}

export type LateStageInterfaceKind =
	| 'fasttype'
	| 'cargo-routing'
	| 'broadcast-composition';

export type LateStageInterfaceFailureReason = 'mismatch' | 'timeout';

export type LateStageInterfaceGrade = 'clean' | 'recovered' | 'assisted';

export type LateStageInterfaceFeedbackKind = 'none' | 'error' | 'assist';

export interface LateStageInterfaceColumnSnapshot {
	id: string;
	label: string;
	options: string[];
	selectedIndex: number;
	hint: string | null;
}

export type LateStageInterfaceSnapshot =
	| {
			status: 'idle';
			kind: null;
	  }
	| {
			status: 'active';
			kind: 'fasttype';
			nodeId: string;
			title: string;
			instructions: string;
			timeRemaining: number;
			attemptsLeft: number;
			mistakes: number;
			assistActive: boolean;
			feedback: string | null;
			feedbackKind: LateStageInterfaceFeedbackKind;
			nodeIndex: number;
			nodeCount: number;
			target: string;
			input: string;
			correctPrefixLength: number;
			expectedChar: string | null;
	  }
	| {
			status: 'active';
			kind: 'cargo-routing' | 'broadcast-composition';
			nodeId: string;
			title: string;
			instructions: string;
			timeRemaining: number;
			attemptsLeft: number;
			mistakes: number;
			assistActive: boolean;
			feedback: string | null;
			feedbackKind: LateStageInterfaceFeedbackKind;
			nodeIndex: number;
			nodeCount: number;
			focusIndex: number;
			columns: LateStageInterfaceColumnSnapshot[];
			preview: string;
			incorrectColumnIds: string[];
	  };

export interface LateStageObjectiveSnapshot {
	stageId: LateStoryStageId;
	primaryLabel: string;
	supportLabel: string;
	completionLabel: string;
	minigameId: string;
	questId: string;
	tutorialId: string;
	payloadId: string;
	payloadLabel: string;
	bossId: string;
	bossLabel: string;
	primaryNodes: Array<
		LateStageObjectiveNode & { completed: boolean; grade?: LateStageInterfaceGrade }
	>;
	supportNodes: Array<LateStageObjectiveNode & { completed: boolean }>;
	primaryComplete: boolean;
	supportComplete: boolean;
	tutorialComplete: boolean;
	payloadCollected: boolean;
	bossDefeated: boolean;
	readyToComplete: boolean;
	completed: boolean;
	interface: LateStageInterfaceSnapshot;
}

export interface LateStageCompletionResult {
	stageId: LateStoryStageId;
	completedQuestIds: string[];
	completedMinigameIds: string[];
	completedTutorialIds: string[];
}

export type LateStageObjectiveEvent =
	| { kind: 'interface-started'; id: string; interfaceKind: LateStageInterfaceKind }
	| {
			kind: 'interface-completed';
			id: string;
			interfaceKind: LateStageInterfaceKind;
			grade: LateStageInterfaceGrade;
			mistakes: number;
			timeMs: number;
	  }
	| {
			kind: 'interface-failed';
			id: string;
			interfaceKind: LateStageInterfaceKind;
			reason: LateStageInterfaceFailureReason;
			attemptsLeft: number;
	  }
	| { kind: 'interface-cancelled'; id: string; interfaceKind: LateStageInterfaceKind }
	| { kind: 'primary-node-completed'; id: string }
	| { kind: 'support-node-completed'; id: string }
	| { kind: 'tutorial-complete'; id: string }
	| { kind: 'minigame-complete'; id: string }
	| { kind: 'quest-complete'; id: string }
	| { kind: 'stage-ready'; id: LateStoryStageId };

export interface LateStageInterfaceKeyResult {
	consumed: boolean;
	events: LateStageObjectiveEvent[];
}

interface InterfaceColumnDefinition {
	id: string;
	label: string;
	options: readonly string[];
	correctIndex: number;
	hint?: string;
}

interface FastTypeChallenge {
	kind: 'fasttype';
	title: string;
	instructions: string;
	target: string;
	timeLimit: number;
	attempts: number;
}

interface SelectionChallenge {
	kind: 'cargo-routing' | 'broadcast-composition';
	title: string;
	instructions: string;
	columns: readonly InterfaceColumnDefinition[];
	timeLimit: number;
	attempts: number;
	joiner: string;
}

type LateStageChallenge = FastTypeChallenge | SelectionChallenge;

type ActiveInterfaceSession =
	| {
			kind: 'fasttype';
			nodeId: string;
			challenge: FastTypeChallenge;
			timeRemaining: number;
			attemptsLeft: number;
			mistakes: number;
			elapsed: number;
			assistActive: boolean;
			feedback: string | null;
			feedbackKind: LateStageInterfaceFeedbackKind;
			feedbackTimer: number;
			input: string;
	  }
	| {
			kind: 'cargo-routing' | 'broadcast-composition';
			nodeId: string;
			challenge: SelectionChallenge;
			timeRemaining: number;
			attemptsLeft: number;
			mistakes: number;
			elapsed: number;
			assistActive: boolean;
			feedback: string | null;
			feedbackKind: LateStageInterfaceFeedbackKind;
			feedbackTimer: number;
			focusIndex: number;
			selectedIndexes: number[];
			incorrectColumnIds: string[];
	  };

const INTERACTION_RADIUS = 84;

export const LATE_STAGE_OBJECTIVE_CONFIG: Readonly<
	Record<LateStoryStageId, LateStageObjectiveConfig>
> = {
	'antenna-barrens': {
		stageId: 'antenna-barrens',
		primaryLabel: 'Repair ledger code gates',
		supportLabel: 'Recover pirate signal caches',
		completionLabel: 'The antenna ghosts agree on a checksum',
		minigameId: 'ledger-codegate-surge',
		questId: 'pirate-signal-cache',
		tutorialId: 'rook-overlay-reading',
		payloadId: 'debt_ledger_shard',
		payloadLabel: 'Debt Ledger Shard',
		bossId: 'black-ice-fox',
		bossLabel: 'Black-Ice Fox',
		primaryNodes: [
			{ id: 'ledger-gate-west', label: 'West checksum gate', x: 220, y: 448 },
			{ id: 'ledger-gate-market', label: 'Market checksum gate', x: 500, y: 448 },
			{ id: 'ledger-gate-tower', label: 'Tower checksum gate', x: 780, y: 448 },
			{ id: 'ledger-gate-choir', label: 'Choir checksum gate', x: 1060, y: 448 },
			{ id: 'ledger-gate-root', label: 'Root checksum gate', x: 1340, y: 448 },
		],
		supportNodes: [
			{ id: 'signal-cache-rain', label: 'Suppressed rain-band messages', x: 350, y: 382 },
			{ id: 'signal-cache-roof', label: 'Suppressed roof-band messages', x: 900, y: 382 },
			{ id: 'signal-cache-horizon', label: 'Suppressed horizon messages', x: 1240, y: 382 },
		],
	},
	'orbital-lift': {
		stageId: 'orbital-lift',
		primaryLabel: 'Reverse cargo claims',
		supportLabel: 'Tag witness containers',
		completionLabel: 'The lift recognizes people instead of freight',
		minigameId: 'cargo-claim-routing',
		questId: 'cargo-reversal-witnesses',
		tutorialId: 'cargo-route-reading',
		payloadId: 'cargo_reversal_key',
		payloadLabel: 'Cargo Reversal Key',
		bossId: 'elevator-angel',
		bossLabel: 'Elevator Angel',
		primaryNodes: [
			{ id: 'cargo-lock-intake', label: 'Intake cargo lock', x: 330, y: 448 },
			{ id: 'cargo-lock-counterweight', label: 'Counterweight cargo lock', x: 830, y: 448 },
			{ id: 'cargo-lock-orbit', label: 'Orbital cargo lock', x: 1320, y: 448 },
		],
		supportNodes: [
			{ id: 'witness-container-a', label: 'Witness container A', x: 520, y: 382 },
			{ id: 'witness-container-b', label: 'Witness container B', x: 1010, y: 382 },
			{ id: 'witness-container-c', label: 'Witness container C', x: 1450, y: 382 },
		],
	},
	'asteroid-redoubt': {
		stageId: 'asteroid-redoubt',
		primaryLabel: 'Tune transmitter roots',
		supportLabel: 'Plant public toolkits',
		completionLabel: 'The broadcast teaches a method instead of naming a ruler',
		minigameId: 'public-toolkit-broadcast',
		questId: 'tools-not-heroes',
		tutorialId: 'public-broadcast-tools',
		payloadId: 'asteroid_transmitter_root',
		payloadLabel: 'Asteroid Transmitter Root',
		bossId: 'director-vane',
		bossLabel: 'Director Vane',
		primaryNodes: [
			{ id: 'transmitter-root-listen', label: 'Listening transmitter root', x: 300, y: 448 },
			{ id: 'transmitter-root-teach', label: 'Teaching transmitter root', x: 820, y: 448 },
			{ id: 'transmitter-root-release', label: 'Release transmitter root', x: 1340, y: 448 },
		],
		supportNodes: [
			{ id: 'public-toolkit-west', label: 'West public toolkit', x: 540, y: 382 },
			{ id: 'public-toolkit-center', label: 'Center public toolkit', x: 1030, y: 382 },
			{ id: 'public-toolkit-east', label: 'East public toolkit', x: 1480, y: 382 },
		],
	},
};

const FASTTYPE_CHALLENGES: Readonly<Record<string, FastTypeChallenge>> = {
	'ledger-gate-west': {
		kind: 'fasttype',
		title: 'FASTTYPE // WEST CHECKSUM',
		instructions: 'Retype the repair line exactly. Backspace edits. Enter commits.',
		target: 'verify debt != consent',
		timeLimit: 13,
		attempts: 3,
	},
	'ledger-gate-market': {
		kind: 'fasttype',
		title: 'FASTTYPE // MARKET ROUTE',
		instructions: 'Rebuild the public route without assigning an owner.',
		target: 'route ledger -> public',
		timeLimit: 12,
		attempts: 3,
	},
	'ledger-gate-tower': {
		kind: 'fasttype',
		title: 'FASTTYPE // TOWER AUDIT',
		instructions: 'Repair the checksum before the antenna drops the carrier.',
		target: 'checksum hands before locks',
		timeLimit: 14,
		attempts: 3,
	},
	'ledger-gate-choir': {
		kind: 'fasttype',
		title: 'FASTTYPE // CHOIR ECHO',
		instructions: 'Recover the receipt echo without restoring its proprietor.',
		target: 'echo receipts without owners',
		timeLimit: 14,
		attempts: 3,
	},
	'ledger-gate-root': {
		kind: 'fasttype',
		title: 'FASTTYPE // ROOT RELEASE',
		instructions: 'Issue the final root command exactly as Rook reconstructed it.',
		target: 'release root --no-throne',
		timeLimit: 13,
		attempts: 3,
	},
};

const CARGO_ROUTING_CHALLENGES: Readonly<Record<string, SelectionChallenge>> = {
	'cargo-lock-intake': {
		kind: 'cargo-routing',
		title: 'CARGO ROUTER // INTAKE CLAIM',
		instructions: '←/→ selects a manifest column. ↑/↓ changes its route. Enter dispatches.',
		timeLimit: 24,
		attempts: 3,
		joiner: '  →  ',
		columns: [
			{ id: 'subject', label: 'SUBJECT', options: ['FREIGHT', 'PERSON', 'DEBT'], correctIndex: 1 },
			{ id: 'standing', label: 'STANDING', options: ['OWNED', 'LOST', 'WITNESS'], correctIndex: 2 },
			{ id: 'destination', label: 'DESTINATION', options: ['AUCTION', 'PUBLIC LIFT', 'LOCKER'], correctIndex: 1 },
		],
	},
	'cargo-lock-counterweight': {
		kind: 'cargo-routing',
		title: 'CARGO ROUTER // COUNTERWEIGHT CLAIM',
		instructions: 'Route the worker testimony around the ownership counterweight.',
		timeLimit: 24,
		attempts: 3,
		joiner: '  →  ',
		columns: [
			{ id: 'subject', label: 'SUBJECT', options: ['CONTAINER', 'CLAIM', 'WORKER'], correctIndex: 2 },
			{ id: 'evidence', label: 'EVIDENCE', options: ['PRICE', 'TESTIMONY', 'MANIFEST'], correctIndex: 1 },
			{ id: 'destination', label: 'DESTINATION', options: ['SERVICE', 'DETENTION', 'MARKET'], correctIndex: 0 },
		],
	},
	'cargo-lock-orbit': {
		kind: 'cargo-routing',
		title: 'CARGO ROUTER // ORBITAL CLAIM',
		instructions: 'Reverse the final customs route without producing a new owner.',
		timeLimit: 24,
		attempts: 3,
		joiner: '  →  ',
		columns: [
			{ id: 'subject', label: 'SUBJECT', options: ['PAYLOAD', 'PASSENGER', 'ASSET'], correctIndex: 1 },
			{ id: 'route', label: 'ROUTE', options: ['SAFE ROUTE', 'SALE', 'IMPOUND'], correctIndex: 0 },
			{ id: 'custodian', label: 'CUSTODIAN', options: ['CUSTOMS', 'OWNER', 'COMMUNITY'], correctIndex: 2 },
		],
	},
};

const BROADCAST_CHALLENGES: Readonly<Record<string, SelectionChallenge>> = {
	'transmitter-root-listen': {
		kind: 'broadcast-composition',
		title: 'BROADCAST COMPOSER // LISTEN',
		instructions: 'Compose a public sentence. ←/→ moves between clauses; ↑/↓ rewrites.',
		timeLimit: 28,
		attempts: 3,
		joiner: ' ',
		columns: [
			{ id: 'subject', label: 'WHO', options: ['THE CITY', 'THE DIRECTOR', 'THE MARKET'], correctIndex: 0 },
			{ id: 'verb', label: 'DOES WHAT', options: ['COMMANDS BEFORE', 'PRICES BEFORE', 'LISTENS BEFORE'], correctIndex: 2 },
			{ id: 'object', label: 'THEN', options: ['IT SELLS', 'IT ROUTES', 'IT LOCKS'], correctIndex: 1 },
		],
	},
	'transmitter-root-teach': {
		kind: 'broadcast-composition',
		title: 'BROADCAST COMPOSER // TEACH',
		instructions: 'Publish a transferable method, not a heroic biography.',
		timeLimit: 28,
		attempts: 3,
		joiner: ' ',
		columns: [
			{ id: 'subject', label: 'WHO', options: ['THE HERO', 'EVERY KID', 'THE OWNER'], correctIndex: 1 },
			{ id: 'verb', label: 'RECEIVES', options: ['GETS THE MANUAL', 'GETS THE MYTH', 'GETS PERMISSION'], correctIndex: 0 },
			{ id: 'object', label: 'PURPOSE', options: ['TO OBEY', 'TO APPLAUD', 'TO REBUILD'], correctIndex: 2 },
		],
	},
	'transmitter-root-release': {
		kind: 'broadcast-composition',
		title: 'BROADCAST COMPOSER // RELEASE',
		instructions: 'Close the message with a route that remains forkable.',
		timeLimit: 28,
		attempts: 3,
		joiner: ' ',
		columns: [
			{ id: 'subject', label: 'WHAT', options: ['THE THRONE', 'THE BRAND', 'THE TOOLS'], correctIndex: 2 },
			{ id: 'verb', label: 'STATUS', options: ['STAY SECRET', 'STAY FORKABLE', 'STAY OWNED'], correctIndex: 1 },
			{ id: 'object', label: 'FOR WHOM', options: ['FOR EVERYONE', 'FOR THE BOARD', 'FOR THE WINNER'], correctIndex: 0 },
		],
	},
};

function challengeFor(stageId: LateStoryStageId, nodeId: string): LateStageChallenge | undefined {
	if (stageId === 'antenna-barrens') return FASTTYPE_CHALLENGES[nodeId];
	if (stageId === 'orbital-lift') return CARGO_ROUTING_CHALLENGES[nodeId];
	return BROADCAST_CHALLENGES[nodeId];
}

function distanceSquared(ax: number, ay: number, bx: number, by: number): number {
	const dx = ax - bx;
	const dy = ay - by;
	return dx * dx + dy * dy;
}

function commonPrefixLength(left: string, right: string): number {
	let index = 0;
	while (index < left.length && index < right.length && left[index] === right[index]) index += 1;
	return index;
}

function cycleIndex(current: number, delta: number, count: number): number {
	if (count <= 0) return 0;
	return (current + delta + count) % count;
}

export class LateStageObjectives {
	private readonly completedPrimaryIds = new Set<string>();
	private readonly completedSupportIds = new Set<string>();
	private readonly interfaceGrades = new Map<string, LateStageInterfaceGrade>();
	private tutorialComplete = false;
	private payloadCollected = false;
	private bossDefeated = false;
	private readyEventEmitted = false;
	private completed = false;
	private activeInterface: ActiveInterfaceSession | null = null;

	constructor(private readonly stageId: LateStoryStageId) {}

	step(dt: number): LateStageObjectiveEvent[] {
		const active = this.activeInterface;
		if (!active) return [];
		const delta = Math.max(0, dt);
		active.elapsed += delta;
		if (active.feedbackTimer > 0) {
			active.feedbackTimer = Math.max(0, active.feedbackTimer - delta);
			if (active.feedbackTimer === 0 && !active.assistActive) {
				active.feedback = null;
				active.feedbackKind = 'none';
				if (active.kind !== 'fasttype') active.incorrectColumnIds = [];
			}
		}
		if (active.assistActive) return [];
		active.timeRemaining = Math.max(0, active.timeRemaining - delta);
		if (active.timeRemaining > 0) return [];
		return this.failActiveInterface('timeout');
	}

	observeAction(
		player: { x: number; y: number; w: number; h: number },
		action: ActionMap
	): LateStageObjectiveEvent[] {
		if (!action.hackPressed || this.activeInterface) return [];
		const config = LATE_STAGE_OBJECTIVE_CONFIG[this.stageId];
		const centerX = player.x + player.w / 2;
		const centerY = player.y + player.h / 2;
		const events: LateStageObjectiveEvent[] = [];

		const primary = config.primaryNodes.find(
			(node) =>
				!this.completedPrimaryIds.has(node.id) &&
				distanceSquared(centerX, centerY, node.x, node.y) <= INTERACTION_RADIUS ** 2
		);
		if (primary) {
			const challenge = challengeFor(this.stageId, primary.id);
			if (!challenge) return events;
			this.activeInterface =
				challenge.kind === 'fasttype'
					? {
							kind: 'fasttype',
							nodeId: primary.id,
							challenge,
							timeRemaining: challenge.timeLimit,
							attemptsLeft: challenge.attempts,
							mistakes: 0,
							elapsed: 0,
							assistActive: false,
							feedback: null,
							feedbackKind: 'none',
							feedbackTimer: 0,
							input: '',
						}
					: {
							kind: challenge.kind,
							nodeId: primary.id,
							challenge,
							timeRemaining: challenge.timeLimit,
							attemptsLeft: challenge.attempts,
							mistakes: 0,
							elapsed: 0,
							assistActive: false,
							feedback: null,
							feedbackKind: 'none',
							feedbackTimer: 0,
							focusIndex: 0,
							selectedIndexes: challenge.columns.map(() => 0),
							incorrectColumnIds: [],
						};
			events.push({
				kind: 'interface-started',
				id: primary.id,
				interfaceKind: challenge.kind,
			});
			return events;
		}

		const support = config.supportNodes.find(
			(node) =>
				!this.completedSupportIds.has(node.id) &&
				distanceSquared(centerX, centerY, node.x, node.y) <= INTERACTION_RADIUS ** 2
		);
		if (!support) return events;
		this.completedSupportIds.add(support.id);
		events.push({ kind: 'support-node-completed', id: support.id });
		if (this.isSupportComplete()) events.push({ kind: 'quest-complete', id: config.questId });
		return events;
	}

	handleInterfaceKey(input: Pick<KeyboardEvent, 'code' | 'key'>): LateStageInterfaceKeyResult {
		const active = this.activeInterface;
		if (!active) return { consumed: false, events: [] };
		if (input.code === 'Escape') {
			this.activeInterface = null;
			return {
				consumed: true,
				events: [
					{
						kind: 'interface-cancelled',
						id: active.nodeId,
						interfaceKind: active.kind,
					},
				],
			};
		}

		if (active.kind === 'fasttype') {
			if (input.code === 'Enter') {
				return {
					consumed: true,
					events:
						active.input === active.challenge.target
							? this.completeActiveInterface()
							: this.failActiveInterface('mismatch'),
				};
			}
			if (input.code === 'Backspace') {
				active.input = active.input.slice(0, -1);
				if (!active.assistActive) {
					active.feedback = null;
					active.feedbackKind = 'none';
				}
				return { consumed: true, events: [] };
			}
			if (input.key.length === 1 && !input.key.includes('\n')) {
				active.input = `${active.input}${input.key}`.slice(0, active.challenge.target.length + 16);
				if (!active.assistActive) {
					active.feedback = null;
					active.feedbackKind = 'none';
				}
				return { consumed: true, events: [] };
			}
			return { consumed: true, events: [] };
		}

		const columns = active.challenge.columns;
		if (input.code === 'ArrowLeft') {
			active.focusIndex = cycleIndex(active.focusIndex, -1, columns.length);
			return { consumed: true, events: [] };
		}
		if (input.code === 'ArrowRight' || input.code === 'Tab') {
			active.focusIndex = cycleIndex(active.focusIndex, 1, columns.length);
			return { consumed: true, events: [] };
		}
		if (input.code === 'ArrowUp' || input.code === 'ArrowDown') {
			const column = columns[active.focusIndex];
			if (column) {
				active.selectedIndexes[active.focusIndex] = cycleIndex(
					active.selectedIndexes[active.focusIndex] ?? 0,
					input.code === 'ArrowUp' ? -1 : 1,
					column.options.length
				);
				active.incorrectColumnIds = active.incorrectColumnIds.filter((id) => id !== column.id);
				if (active.incorrectColumnIds.length === 0 && !active.assistActive) {
					active.feedback = null;
					active.feedbackKind = 'none';
				}
			}
			return { consumed: true, events: [] };
		}
		if (/^Digit[1-9]$/.test(input.code)) {
			const column = columns[active.focusIndex];
			const selectedIndex = Number(input.code.slice(-1)) - 1;
			if (column && selectedIndex < column.options.length) {
				active.selectedIndexes[active.focusIndex] = selectedIndex;
				active.incorrectColumnIds = active.incorrectColumnIds.filter((id) => id !== column.id);
				if (active.incorrectColumnIds.length === 0 && !active.assistActive) {
					active.feedback = null;
					active.feedbackKind = 'none';
				}
			}
			return { consumed: true, events: [] };
		}
		if (input.code === 'Enter') {
			const solved = columns.every(
				(column, index) => active.selectedIndexes[index] === column.correctIndex
			);
			return {
				consumed: true,
				events: solved
					? this.completeActiveInterface()
					: this.failActiveInterface('mismatch'),
			};
		}
		return { consumed: true, events: [] };
	}

	isInterfaceActive(): boolean {
		return this.activeInterface !== null;
	}

	observeWorld(payloadCollected: boolean, bossDefeated: boolean): LateStageObjectiveEvent[] {
		this.payloadCollected ||= payloadCollected;
		this.bossDefeated ||= bossDefeated;
		if (this.isReadyToComplete() && !this.readyEventEmitted) {
			this.readyEventEmitted = true;
			return [{ kind: 'stage-ready', id: this.stageId }];
		}
		return [];
	}

	claimCompletion(): LateStageCompletionResult | null {
		if (!this.isReadyToComplete() || this.completed) return null;
		const config = LATE_STAGE_OBJECTIVE_CONFIG[this.stageId];
		this.completed = true;
		return {
			stageId: this.stageId,
			completedQuestIds: this.isSupportComplete() ? [config.questId] : [],
			completedMinigameIds: [config.minigameId],
			completedTutorialIds: this.tutorialComplete ? [config.tutorialId] : [],
		};
	}

	getSnapshot(): LateStageObjectiveSnapshot {
		const config = LATE_STAGE_OBJECTIVE_CONFIG[this.stageId];
		return {
			stageId: this.stageId,
			primaryLabel: config.primaryLabel,
			supportLabel: config.supportLabel,
			completionLabel: config.completionLabel,
			minigameId: config.minigameId,
			questId: config.questId,
			tutorialId: config.tutorialId,
			payloadId: config.payloadId,
			payloadLabel: config.payloadLabel,
			bossId: config.bossId,
			bossLabel: config.bossLabel,
			primaryNodes: config.primaryNodes.map((node) => ({
				...node,
				completed: this.completedPrimaryIds.has(node.id),
				grade: this.interfaceGrades.get(node.id),
			})),
			supportNodes: config.supportNodes.map((node) => ({
				...node,
				completed: this.completedSupportIds.has(node.id),
			})),
			primaryComplete: this.isPrimaryComplete(),
			supportComplete: this.isSupportComplete(),
			tutorialComplete: this.tutorialComplete,
			payloadCollected: this.payloadCollected,
			bossDefeated: this.bossDefeated,
			readyToComplete: this.isReadyToComplete(),
			completed: this.completed,
			interface: this.getInterfaceSnapshot(),
		};
	}

	private getInterfaceSnapshot(): LateStageInterfaceSnapshot {
		const active = this.activeInterface;
		if (!active) return { status: 'idle', kind: null };
		const config = LATE_STAGE_OBJECTIVE_CONFIG[this.stageId];
		const nodeIndex = Math.max(
			1,
			config.primaryNodes.findIndex((node) => node.id === active.nodeId) + 1
		);
		const nodeCount = config.primaryNodes.length;
		if (active.kind === 'fasttype') {
			const correctPrefixLength = commonPrefixLength(active.input, active.challenge.target);
			return {
				status: 'active',
				kind: 'fasttype',
				nodeId: active.nodeId,
				title: active.challenge.title,
				instructions: active.challenge.instructions,
				timeRemaining: active.timeRemaining,
				attemptsLeft: active.attemptsLeft,
				mistakes: active.mistakes,
				assistActive: active.assistActive,
				feedback: active.feedback,
				feedbackKind: active.feedbackKind,
				nodeIndex,
				nodeCount,
				target: active.challenge.target,
				input: active.input,
				correctPrefixLength,
				expectedChar:
					active.assistActive && correctPrefixLength < active.challenge.target.length
						? active.challenge.target[correctPrefixLength] ?? null
						: null,
			};
		}
		return {
			status: 'active',
			kind: active.kind,
			nodeId: active.nodeId,
			title: active.challenge.title,
			instructions: active.challenge.instructions,
			timeRemaining: active.timeRemaining,
			attemptsLeft: active.attemptsLeft,
			mistakes: active.mistakes,
			assistActive: active.assistActive,
			feedback: active.feedback,
			feedbackKind: active.feedbackKind,
			nodeIndex,
			nodeCount,
			focusIndex: active.focusIndex,
			columns: active.challenge.columns.map((column, index) => ({
				id: column.id,
				label: column.label,
				options: [...column.options],
				selectedIndex: active.selectedIndexes[index] ?? 0,
				hint:
					active.assistActive || active.incorrectColumnIds.includes(column.id)
						? (column.hint ??
							`Verified trace favors “${column.options[column.correctIndex] ?? 'PUBLIC ROUTE'}”.`)
						: null,
			})),
			preview: active.challenge.columns
				.map((column, index) => column.options[active.selectedIndexes[index] ?? 0] ?? '')
				.join(active.challenge.joiner),
			incorrectColumnIds: [...active.incorrectColumnIds],
		};
	}

	private failActiveInterface(reason: LateStageInterfaceFailureReason): LateStageObjectiveEvent[] {
		const active = this.activeInterface;
		if (!active) return [];
		active.attemptsLeft = Math.max(0, active.attemptsLeft - 1);
		active.mistakes += 1;
		active.feedbackTimer = 2.8;
		if (active.kind === 'fasttype') {
			const correctPrefixLength = commonPrefixLength(active.input, active.challenge.target);
			active.input = active.input.slice(0, correctPrefixLength);
			active.feedback =
				reason === 'timeout'
					? `Carrier expired // verified prefix retained through byte ${correctPrefixLength}`
					: `Byte ${correctPrefixLength + 1} rejected // verified prefix retained`;
		} else {
			active.incorrectColumnIds = active.challenge.columns
				.filter((column, index) => active.selectedIndexes[index] !== column.correctIndex)
				.map((column) => column.id);
			active.feedback = `${active.incorrectColumnIds.length} manifest column${
				active.incorrectColumnIds.length === 1 ? '' : 's'
			} require revision`;
		}
		active.feedbackKind = 'error';
		const event: LateStageObjectiveEvent = {
			kind: 'interface-failed',
			id: active.nodeId,
			interfaceKind: active.kind,
			reason,
			attemptsLeft: active.attemptsLeft,
		};
		if (active.attemptsLeft === 0) {
			active.assistActive = true;
			active.feedbackKind = 'assist';
			active.feedbackTimer = 0;
			active.feedback =
				active.kind === 'fasttype'
					? 'PUBLIC ASSIST ACTIVE // timer paused // next verified byte shown'
					: 'PUBLIC ASSIST ACTIVE // timer paused // conflicting columns carry hints';
			return [event];
		}
		active.timeRemaining = active.challenge.timeLimit;
		return [event];
	}

	private completeActiveInterface(): LateStageObjectiveEvent[] {
		const active = this.activeInterface;
		if (!active) return [];
		const grade: LateStageInterfaceGrade = active.assistActive
			? 'assisted'
			: active.mistakes === 0
				? 'clean'
				: 'recovered';
		this.activeInterface = null;
		this.completedPrimaryIds.add(active.nodeId);
		this.interfaceGrades.set(active.nodeId, grade);
		const config = LATE_STAGE_OBJECTIVE_CONFIG[this.stageId];
		const events: LateStageObjectiveEvent[] = [
			{
				kind: 'interface-completed',
				id: active.nodeId,
				interfaceKind: active.kind,
				grade,
				mistakes: active.mistakes,
				timeMs: Math.round(active.elapsed * 1000),
			},
			{ kind: 'primary-node-completed', id: active.nodeId },
		];
		if (!this.tutorialComplete) {
			this.tutorialComplete = true;
			events.push({ kind: 'tutorial-complete', id: config.tutorialId });
		}
		if (this.isPrimaryComplete()) {
			events.push({ kind: 'minigame-complete', id: config.minigameId });
		}
		return events;
	}

	private isPrimaryComplete(): boolean {
		return (
			this.completedPrimaryIds.size ===
			LATE_STAGE_OBJECTIVE_CONFIG[this.stageId].primaryNodes.length
		);
	}

	private isSupportComplete(): boolean {
		return (
			this.completedSupportIds.size ===
			LATE_STAGE_OBJECTIVE_CONFIG[this.stageId].supportNodes.length
		);
	}

	private isReadyToComplete(): boolean {
		return this.isPrimaryComplete() && this.payloadCollected && this.bossDefeated;
	}
}
