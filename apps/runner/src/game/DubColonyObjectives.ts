import type { ActionMap } from '../systems/InputSystem';
import type { ProgressionPuzzlePlayer } from './ProgressionPuzzleModifiers';

export type DubBeatAction = 'jump' | 'parry' | 'melee';
export type DubColonyAlignment = 'chorus' | 'army' | 'supplier' | 'uncommitted';
export type DubBeatGrade = 'perfect' | 'late' | 'miss' | 'jammed' | null;

export interface DubInteractable {
	id: string;
	label: string;
	x: number;
	y: number;
}

export interface DubReactorNode extends DubInteractable {
	expectedAction: DubBeatAction;
}

export interface DubColonyObjectiveSnapshot {
	stageId: 'dub-colony';
	alignment: DubColonyAlignment;
	bpm: 86;
	beatIndex: number;
	beatPhase: number;
	timeToBeat: number;
	inBeatWindow: boolean;
	windowMs: number;
	jamRemaining: number;
	beatStreak: number;
	lastGrade: DubBeatGrade;
	spareParts: Array<DubInteractable & { recovered: boolean }>;
	voteCards: Array<DubInteractable & { recovered: boolean }>;
	reactorNodes: Array<DubReactorNode & { tuned: boolean }>;
	partsComplete: boolean;
	voteCardsComplete: boolean;
	reactorSynchronized: boolean;
	nayaTutorialComplete: boolean;
	payloadCollected: boolean;
	bossDefeated: boolean;
	readyToComplete: boolean;
	completed: boolean;
}

export interface DubColonyCompletionResult {
	stageId: 'dub-colony';
	completedQuestIds: string[];
	completedMinigameIds: string[];
	completedTutorialIds: string[];
}

export type DubColonyObjectiveEvent =
	| { kind: 'spare-part-recovered'; id: string }
	| { kind: 'quest-complete'; id: 'chorus-spare-parts' | 'missing-vote-cards' }
	| { kind: 'vote-card-recovered'; id: string }
	| { kind: 'beat-hit'; id: string; action: DubBeatAction; grade: 'perfect' | 'late' }
	| { kind: 'beat-missed'; id: string; action: DubBeatAction }
	| { kind: 'rhythm-jammed'; duration: number }
	| { kind: 'reactor-node-tuned'; id: string; action: DubBeatAction }
	| { kind: 'tutorial-complete'; id: 'naya-shield-sync' }
	| { kind: 'reactor-synchronized'; id: 'bass-reactor-sync' }
	| { kind: 'stage-ready'; id: 'dub-colony' };

export const DUB_COLONY_BPM = 86;
export const DUB_ALIGNMENT_WINDOWS_MS: Readonly<Record<DubColonyAlignment, number>> = {
	chorus: 185,
	army: 115,
	supplier: 145,
	uncommitted: 145,
};

const BPM = DUB_COLONY_BPM;
const BEAT_SECONDS = 60 / BPM;
const INTERACTION_RADIUS = 78;
const REACTOR_RADIUS = 110;

export const DUB_SPARE_PARTS: readonly DubInteractable[] = [
	{ id: 'coil-a', label: 'Greenhouse speaker coil', x: 470, y: 448 },
	{ id: 'diaphragm-b', label: 'Studio bass diaphragm', x: 1180, y: 448 },
	{ id: 'copper-c', label: 'Assembly copper winding', x: 1900, y: 448 },
];

export const DUB_VOTE_CARDS: readonly DubInteractable[] = [
	{ id: 'vote-greenhouse', label: 'Greenhouse car vote card', x: 760, y: 230 },
	{ id: 'vote-repair', label: 'Repair-bay vote card', x: 1400, y: 258 },
	{ id: 'vote-kitchen', label: 'Shared-kitchen vote card', x: 2140, y: 448 },
];

export const DUB_REACTOR_NODES: readonly DubReactorNode[] = [
	{
		id: 'kick-valve',
		label: 'Kick valve',
		x: 890,
		y: 448,
		expectedAction: 'jump',
	},
	{
		id: 'snare-shield',
		label: 'Snare shield relay',
		x: 1540,
		y: 220,
		expectedAction: 'parry',
	},
	{
		id: 'echo-coil',
		label: 'Echo coil',
		x: 2210,
		y: 448,
		expectedAction: 'melee',
	},
];

function distanceSquared(ax: number, ay: number, bx: number, by: number): number {
	const dx = ax - bx;
	const dy = ay - by;
	return dx * dx + dy * dy;
}

function pressedBeatAction(action: ActionMap): DubBeatAction | null {
	if (action.jumpPressed) return 'jump';
	if (action.parryPressed) return 'parry';
	if (action.meleePressed) return 'melee';
	return null;
}

function alignmentFromFlags(flags: readonly string[]): DubColonyAlignment {
	if (flags.includes('colony_alignment_chorus')) return 'chorus';
	if (flags.includes('colony_alignment_army')) return 'army';
	if (flags.includes('colony_alignment_supplier')) return 'supplier';
	return 'uncommitted';
}

export class DubColonyObjectives {
	private elapsed = 0;
	private jamRemaining = 0;
	private readonly recoveredPartIds = new Set<string>();
	private readonly recoveredVoteCardIds = new Set<string>();
	private readonly tunedNodeIds = new Set<string>();
	private beatStreak = 0;
	private lastGrade: DubBeatGrade = null;
	private nayaTutorialComplete = false;
	private payloadCollected = false;
	private bossDefeated = false;
	private readyEventEmitted = false;
	private completed = false;
	private readonly alignment: DubColonyAlignment;

	constructor(private readonly storyResultFlags: readonly string[] = []) {
		this.alignment = alignmentFromFlags(storyResultFlags);
		if (this.alignment === 'supplier') this.recoveredPartIds.add('coil-a');
	}

	step(dt: number): DubColonyObjectiveEvent[] {
		const safeDt = Math.max(0, dt);
		this.elapsed += safeDt;
		this.jamRemaining = Math.max(0, this.jamRemaining - safeDt);
		return [];
	}

	jamRhythm(duration = 1.1): DubColonyObjectiveEvent[] {
		this.jamRemaining = Math.max(this.jamRemaining, duration);
		this.beatStreak = 0;
		this.lastGrade = 'jammed';
		return [{ kind: 'rhythm-jammed', duration }];
	}

	observeAction(
		player: {
			x: number;
			y: number;
			w: number;
			h: number;
			itemSetEffects?: Record<string, number | string | boolean>;
		} & ProgressionPuzzlePlayer,
		action: ActionMap
	): DubColonyObjectiveEvent[] {
		const events: DubColonyObjectiveEvent[] = [];
		const centerX = player.x + player.w / 2;
		const centerY = player.y + player.h / 2;

		if (action.hackPressed) {
			const sparePart = DUB_SPARE_PARTS.find(
				(candidate) =>
					!this.recoveredPartIds.has(candidate.id) &&
					distanceSquared(centerX, centerY, candidate.x, candidate.y) <= INTERACTION_RADIUS ** 2
			);
			if (sparePart) {
				this.recoveredPartIds.add(sparePart.id);
				events.push({ kind: 'spare-part-recovered', id: sparePart.id });
				if (this.partsComplete()) events.push({ kind: 'quest-complete', id: 'chorus-spare-parts' });
			}

			const voteCard = DUB_VOTE_CARDS.find(
				(candidate) =>
					!this.recoveredVoteCardIds.has(candidate.id) &&
					distanceSquared(centerX, centerY, candidate.x, candidate.y) <= INTERACTION_RADIUS ** 2
			);
			if (voteCard) {
				this.recoveredVoteCardIds.add(voteCard.id);
				events.push({ kind: 'vote-card-recovered', id: voteCard.id });
				if (this.voteCardsComplete())
					events.push({ kind: 'quest-complete', id: 'missing-vote-cards' });
			}
		}

		const beatAction = pressedBeatAction(action);
		if (!beatAction) return events;
		const node = DUB_REACTOR_NODES.find(
			(candidate) =>
				!this.tunedNodeIds.has(candidate.id) &&
				distanceSquared(centerX, centerY, candidate.x, candidate.y) <= REACTOR_RADIUS ** 2
		);
		if (!node || node.expectedAction !== beatAction) return events;
		if (this.jamRemaining > 0) {
			this.lastGrade = 'jammed';
			this.beatStreak = 0;
			events.push({ kind: 'beat-missed', id: node.id, action: beatAction });
			return events;
		}

		const distanceToBeat = this.distanceToBeat();
		const perfectSeconds = this.windowMs(player) / 1000;
		const lateSeconds = Math.min(BEAT_SECONDS / 2, perfectSeconds * 1.75);
		if (distanceToBeat <= lateSeconds) {
			const grade = distanceToBeat <= perfectSeconds ? 'perfect' : 'late';
			this.lastGrade = grade;
			this.beatStreak += 1;
			this.tunedNodeIds.add(node.id);
			events.push({ kind: 'beat-hit', id: node.id, action: beatAction, grade });
			events.push({ kind: 'reactor-node-tuned', id: node.id, action: beatAction });
			if (!this.nayaTutorialComplete && beatAction === 'parry') {
				this.nayaTutorialComplete = true;
				events.push({ kind: 'tutorial-complete', id: 'naya-shield-sync' });
			}
			if (this.reactorSynchronized()) {
				events.push({ kind: 'reactor-synchronized', id: 'bass-reactor-sync' });
			}
		} else {
			this.lastGrade = 'miss';
			this.beatStreak = 0;
			events.push({ kind: 'beat-missed', id: node.id, action: beatAction });
		}
		return events;
	}

	observeWorld(payloadCollected: boolean, bossDefeated: boolean): DubColonyObjectiveEvent[] {
		this.payloadCollected ||= payloadCollected;
		this.bossDefeated ||= bossDefeated;
		if (this.readyToComplete() && !this.readyEventEmitted) {
			this.readyEventEmitted = true;
			return [{ kind: 'stage-ready', id: 'dub-colony' }];
		}
		return [];
	}

	claimCompletion(): DubColonyCompletionResult | null {
		if (!this.readyToComplete() || this.completed) return null;
		this.completed = true;
		return {
			stageId: 'dub-colony',
			completedQuestIds: ['chorus-spare-parts', 'missing-vote-cards'],
			completedMinigameIds: ['bass-reactor-sync'],
			completedTutorialIds: this.nayaTutorialComplete ? ['naya-shield-sync'] : [],
		};
	}

	getSnapshot(player?: {
		itemSetEffects?: Record<string, number | string | boolean>;
	}): DubColonyObjectiveSnapshot {
		const phase = (this.elapsed % BEAT_SECONDS) / BEAT_SECONDS;
		return {
			stageId: 'dub-colony',
			alignment: this.alignment,
			bpm: BPM,
			beatIndex: Math.floor(this.elapsed / BEAT_SECONDS),
			beatPhase: phase,
			timeToBeat: Number(this.distanceToBeat().toFixed(4)),
			inBeatWindow: this.jamRemaining <= 0 && this.distanceToBeat() <= this.windowMs(player) / 1000,
			windowMs: this.windowMs(player),
			jamRemaining: Number(this.jamRemaining.toFixed(3)),
			beatStreak: this.beatStreak,
			lastGrade: this.lastGrade,
			spareParts: DUB_SPARE_PARTS.map((entry) => ({
				...entry,
				recovered: this.recoveredPartIds.has(entry.id),
			})),
			voteCards: DUB_VOTE_CARDS.map((entry) => ({
				...entry,
				recovered: this.recoveredVoteCardIds.has(entry.id),
			})),
			reactorNodes: DUB_REACTOR_NODES.map((entry) => ({
				...entry,
				tuned: this.tunedNodeIds.has(entry.id),
			})),
			partsComplete: this.partsComplete(),
			voteCardsComplete: this.voteCardsComplete(),
			reactorSynchronized: this.reactorSynchronized(),
			nayaTutorialComplete: this.nayaTutorialComplete,
			payloadCollected: this.payloadCollected,
			bossDefeated: this.bossDefeated,
			readyToComplete: this.readyToComplete(),
			completed: this.completed,
		};
	}

	private distanceToBeat(): number {
		const phaseSeconds = this.elapsed % BEAT_SECONDS;
		return Math.min(phaseSeconds, BEAT_SECONDS - phaseSeconds);
	}

	private windowMs(player?: {
		itemSetEffects?: Record<string, number | string | boolean>;
	}): number {
		const itemGrace = player?.itemSetEffects?.beatGrace;
		const graceMs = typeof itemGrace === 'number' ? itemGrace * 1000 : 0;
		const alignmentWindow = DUB_ALIGNMENT_WINDOWS_MS[this.alignment];
		return Math.round(alignmentWindow + graceMs);
	}

	private partsComplete(): boolean {
		return this.recoveredPartIds.size === DUB_SPARE_PARTS.length;
	}

	private voteCardsComplete(): boolean {
		return this.recoveredVoteCardIds.size === DUB_VOTE_CARDS.length;
	}

	private reactorSynchronized(): boolean {
		return this.tunedNodeIds.size === DUB_REACTOR_NODES.length;
	}

	private readyToComplete(): boolean {
		return (
			this.partsComplete() &&
			this.voteCardsComplete() &&
			this.reactorSynchronized() &&
			this.payloadCollected &&
			this.bossDefeated
		);
	}
}
