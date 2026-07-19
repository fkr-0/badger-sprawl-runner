import type { ActionMap } from '../systems/InputSystem';
import {
	type ProgressionPuzzlePlayer,
	consumeHackMistakeShield,
	puzzleStepSeconds,
} from './ProgressionPuzzleModifiers';

export type MirrorEtiquetteInput = 'parry' | 'melee' | 'dodge';
export type MirrorEtiquetteStatus = 'idle' | 'active' | 'solved' | 'failed';

export interface MirrorInteractable {
	id: string;
	label: string;
	x: number;
	y: number;
}

export interface MirrorTraversalSeal extends MirrorInteractable {
	kind: 'rocket-door' | 'reflection-loop' | 'switchback';
}

export interface MirrorPalaceObjectiveSnapshot {
	stageId: 'mirror-palace';
	guests: Array<MirrorInteractable & { heard: boolean }>;
	traversalSeals: Array<MirrorTraversalSeal & { broken: boolean }>;
	etiquetteTerminal: MirrorInteractable;
	etiquetteStatus: MirrorEtiquetteStatus;
	etiquetteStep: number;
	etiquetteSequence: MirrorEtiquetteInput[];
	expectedInput: MirrorEtiquetteInput | null;
	inputRemaining: number;
	mistakes: number;
	rocketTutorialComplete: boolean;
	questComplete: boolean;
	traversalComplete: boolean;
	payloadCollected: boolean;
	bossDefeated: boolean;
	readyToComplete: boolean;
	completed: boolean;
}

export interface MirrorPalaceCompletionResult {
	stageId: 'mirror-palace';
	completedQuestIds: string[];
	completedMinigameIds: string[];
	completedTutorialIds: string[];
}

export type MirrorPalaceObjectiveEvent =
	| { kind: 'refusal-heard'; id: string }
	| { kind: 'quest-complete'; id: 'table-of-refusals' }
	| { kind: 'traversal-seal-broken'; id: string; sealKind: MirrorTraversalSeal['kind'] }
	| { kind: 'tutorial-complete'; id: 'rocket-switchback' }
	| { kind: 'etiquette-started'; id: 'banquet-etiquette-loop' }
	| { kind: 'etiquette-step'; input: MirrorEtiquetteInput; step: number }
	| { kind: 'etiquette-failed'; id: 'banquet-etiquette-loop' }
	| { kind: 'hack-mistake-ignored'; id: 'banquet-etiquette-loop' }
	| { kind: 'etiquette-complete'; id: 'banquet-etiquette-loop' }
	| { kind: 'stage-ready'; id: 'mirror-palace' };

const INTERACTION_RADIUS = 78;
const TRAVERSAL_RADIUS = 112;
const INPUT_WINDOW_SECONDS = 1.75;

export const MIRROR_REFUSAL_GUESTS: readonly MirrorInteractable[] = [
	{ id: 'guest-cook', label: 'Banquet cook who refused a debt extension', x: 845, y: 448 },
	{ id: 'guest-porter', label: 'Porter who refused biometric collateral', x: 1280, y: 448 },
	{ id: 'guest-musician', label: 'Musician who refused applause wages', x: 1650, y: 448 },
];

export const MIRROR_TRAVERSAL_SEALS: readonly MirrorTraversalSeal[] = [
	{
		id: 'debt-contract-door',
		label: 'Debt-contract Door',
		x: 510,
		y: 420,
		kind: 'rocket-door',
	},
	{
		id: 'reflection-loop',
		label: 'Reflection Loop',
		x: 1110,
		y: 448,
		kind: 'reflection-loop',
	},
	{
		id: 'banquet-switchback',
		label: 'Banquet Switchback',
		x: 1510,
		y: 230,
		kind: 'switchback',
	},
];

export const MIRROR_ETIQUETTE_TERMINAL: MirrorInteractable = {
	id: 'banquet-etiquette-loop',
	label: 'Banquet refusal table',
	x: 1880,
	y: 448,
};

export const MIRROR_ETIQUETTE_SEQUENCE: readonly MirrorEtiquetteInput[] = [
	'parry',
	'melee',
	'dodge',
	'parry',
];

function distanceSquared(ax: number, ay: number, bx: number, by: number): number {
	const dx = ax - bx;
	const dy = ay - by;
	return dx * dx + dy * dy;
}

function etiquetteInput(action: ActionMap): MirrorEtiquetteInput | null {
	if (action.parryPressed) return 'parry';
	if (action.meleePressed) return 'melee';
	if (action.dodgePressed) return 'dodge';
	return null;
}

export class MirrorPalaceObjectives {
	private readonly heardGuestIds = new Set<string>();
	private readonly brokenSealIds = new Set<string>();
	private etiquetteStatus: MirrorEtiquetteStatus = 'idle';
	private etiquetteStep = 0;
	private inputRemaining = 0;
	private mistakes = 0;
	private rocketTutorialComplete = false;
	private reflectionForwardSeen = false;
	private payloadCollected = false;
	private bossDefeated = false;
	private readyEventEmitted = false;
	private completed = false;

	step(dt: number, player?: ProgressionPuzzlePlayer): MirrorPalaceObjectiveEvent[] {
		if (this.etiquetteStatus !== 'active') return [];
		this.inputRemaining = Math.max(0, this.inputRemaining - puzzleStepSeconds(dt, player));
		if (this.inputRemaining > 0) return [];
		this.failEtiquette();
		return [{ kind: 'etiquette-failed', id: 'banquet-etiquette-loop' }];
	}

	observeAction(
		player: {
			x: number;
			y: number;
			w: number;
			h: number;
			dir: number;
			hasRocket?: boolean;
			fuel?: number;
		} & ProgressionPuzzlePlayer,
		action: ActionMap
	): MirrorPalaceObjectiveEvent[] {
		const events: MirrorPalaceObjectiveEvent[] = [];
		const centerX = player.x + player.w / 2;
		const centerY = player.y + player.h / 2;

		if (action.hackPressed) {
			const guest = MIRROR_REFUSAL_GUESTS.find(
				(candidate) =>
					!this.heardGuestIds.has(candidate.id) &&
					distanceSquared(centerX, centerY, candidate.x, candidate.y) <= INTERACTION_RADIUS ** 2
			);
			if (guest) {
				this.heardGuestIds.add(guest.id);
				events.push({ kind: 'refusal-heard', id: guest.id });
				if (this.isQuestComplete())
					events.push({ kind: 'quest-complete', id: 'table-of-refusals' });
			}

			if (
				!guest &&
				this.etiquetteStatus !== 'solved' &&
				this.isQuestComplete() &&
				this.isTraversalComplete() &&
				distanceSquared(
					centerX,
					centerY,
					MIRROR_ETIQUETTE_TERMINAL.x,
					MIRROR_ETIQUETTE_TERMINAL.y
				) <=
					INTERACTION_RADIUS ** 2
			) {
				this.etiquetteStatus = 'active';
				this.etiquetteStep = 0;
				this.inputRemaining = INPUT_WINDOW_SECONDS;
				events.push({ kind: 'etiquette-started', id: 'banquet-etiquette-loop' });
			}
		}

		const debtDoor = MIRROR_TRAVERSAL_SEALS[0];
		if (
			debtDoor &&
			!this.brokenSealIds.has(debtDoor.id) &&
			action.itemPressed &&
			player.hasRocket &&
			(player.fuel ?? 0) > 0 &&
			distanceSquared(centerX, centerY, debtDoor.x, debtDoor.y) <= TRAVERSAL_RADIUS ** 2
		) {
			this.breakSeal(debtDoor, events);
		}

		const reflectionLoop = MIRROR_TRAVERSAL_SEALS[1];
		if (
			reflectionLoop &&
			!this.brokenSealIds.has(reflectionLoop.id) &&
			distanceSquared(centerX, centerY, reflectionLoop.x, reflectionLoop.y) <= TRAVERSAL_RADIUS ** 2
		) {
			if (action.moveRight) this.reflectionForwardSeen = true;
			if (this.reflectionForwardSeen && action.moveLeft) this.breakSeal(reflectionLoop, events);
		}

		const switchback = MIRROR_TRAVERSAL_SEALS[2];
		if (
			switchback &&
			!this.brokenSealIds.has(switchback.id) &&
			action.itemPressed &&
			player.hasRocket &&
			(player.fuel ?? 0) > 0 &&
			distanceSquared(centerX, centerY, switchback.x, switchback.y) <= TRAVERSAL_RADIUS ** 2
		) {
			this.breakSeal(switchback, events);
		}

		const input = etiquetteInput(action);
		if (input && this.etiquetteStatus === 'active') {
			const expected = MIRROR_ETIQUETTE_SEQUENCE[this.etiquetteStep];
			if (input === expected) {
				this.etiquetteStep += 1;
				events.push({ kind: 'etiquette-step', input, step: this.etiquetteStep });
				if (this.etiquetteStep >= MIRROR_ETIQUETTE_SEQUENCE.length) {
					this.etiquetteStatus = 'solved';
					this.inputRemaining = 0;
					events.push({ kind: 'etiquette-complete', id: 'banquet-etiquette-loop' });
				} else {
					this.inputRemaining = INPUT_WINDOW_SECONDS;
				}
			} else if (consumeHackMistakeShield(player)) {
				this.inputRemaining = INPUT_WINDOW_SECONDS;
				events.push({ kind: 'hack-mistake-ignored', id: 'banquet-etiquette-loop' });
			} else {
				this.failEtiquette();
				events.push({ kind: 'etiquette-failed', id: 'banquet-etiquette-loop' });
			}
		}

		return events;
	}

	observeWorld(payloadCollected: boolean, bossDefeated: boolean): MirrorPalaceObjectiveEvent[] {
		this.payloadCollected ||= payloadCollected;
		this.bossDefeated ||= bossDefeated;
		if (this.isReadyToComplete() && !this.readyEventEmitted) {
			this.readyEventEmitted = true;
			return [{ kind: 'stage-ready', id: 'mirror-palace' }];
		}
		return [];
	}

	claimCompletion(): MirrorPalaceCompletionResult | null {
		if (!this.isReadyToComplete() || this.completed) return null;
		this.completed = true;
		return {
			stageId: 'mirror-palace',
			completedQuestIds: this.isQuestComplete() ? ['table-of-refusals'] : [],
			completedMinigameIds: ['banquet-etiquette-loop'],
			completedTutorialIds: this.rocketTutorialComplete ? ['rocket-switchback'] : [],
		};
	}

	getSnapshot(): MirrorPalaceObjectiveSnapshot {
		return {
			stageId: 'mirror-palace',
			guests: MIRROR_REFUSAL_GUESTS.map((guest) => ({
				...guest,
				heard: this.heardGuestIds.has(guest.id),
			})),
			traversalSeals: MIRROR_TRAVERSAL_SEALS.map((seal) => ({
				...seal,
				broken: this.brokenSealIds.has(seal.id),
			})),
			etiquetteTerminal: { ...MIRROR_ETIQUETTE_TERMINAL },
			etiquetteStatus: this.etiquetteStatus,
			etiquetteStep: this.etiquetteStep,
			etiquetteSequence: [...MIRROR_ETIQUETTE_SEQUENCE],
			expectedInput:
				this.etiquetteStatus === 'active'
					? (MIRROR_ETIQUETTE_SEQUENCE[this.etiquetteStep] ?? null)
					: null,
			inputRemaining: this.inputRemaining,
			mistakes: this.mistakes,
			rocketTutorialComplete: this.rocketTutorialComplete,
			questComplete: this.isQuestComplete(),
			traversalComplete: this.isTraversalComplete(),
			payloadCollected: this.payloadCollected,
			bossDefeated: this.bossDefeated,
			readyToComplete: this.isReadyToComplete(),
			completed: this.completed,
		};
	}

	private breakSeal(seal: MirrorTraversalSeal, events: MirrorPalaceObjectiveEvent[]): void {
		this.brokenSealIds.add(seal.id);
		events.push({ kind: 'traversal-seal-broken', id: seal.id, sealKind: seal.kind });
		if (!this.rocketTutorialComplete && seal.kind !== 'reflection-loop') {
			this.rocketTutorialComplete = true;
			events.push({ kind: 'tutorial-complete', id: 'rocket-switchback' });
		}
	}

	private failEtiquette(): void {
		this.etiquetteStatus = 'failed';
		this.etiquetteStep = 0;
		this.inputRemaining = 0;
		this.mistakes += 1;
	}

	private isQuestComplete(): boolean {
		return this.heardGuestIds.size === MIRROR_REFUSAL_GUESTS.length;
	}

	private isTraversalComplete(): boolean {
		return this.brokenSealIds.size === MIRROR_TRAVERSAL_SEALS.length;
	}

	private isReadyToComplete(): boolean {
		return (
			this.isQuestComplete() &&
			this.isTraversalComplete() &&
			this.etiquetteStatus === 'solved' &&
			this.payloadCollected &&
			this.bossDefeated
		);
	}
}
