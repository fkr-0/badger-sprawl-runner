import type { ActionMap } from '../systems/InputSystem';
import {
	type ProgressionPuzzlePlayer,
	consumeHackMistakeShield,
	puzzleStepSeconds,
} from './ProgressionPuzzleModifiers';

export type LowerSprawlRhythmInput = 'melee' | 'shoot' | 'parry';
export type LowerSprawlPuzzleStatus = 'idle' | 'active' | 'solved' | 'failed';

export interface LowerSprawlInteractable {
	id: string;
	label: string;
	x: number;
	y: number;
}

export interface LowerSprawlObjectiveSnapshot {
	stageId: 'lower-sprawl';
	meters: Array<LowerSprawlInteractable & { scanned: boolean }>;
	gate: LowerSprawlInteractable;
	questComplete: boolean;
	puzzleStatus: LowerSprawlPuzzleStatus;
	puzzleStep: number;
	puzzleSequence: LowerSprawlRhythmInput[];
	expectedInput: LowerSprawlRhythmInput | null;
	beatRemaining: number;
	mistakes: number;
	payloadCollected: boolean;
	bossDefeated: boolean;
	tutorials: {
		jumpCoyote: boolean;
		publicRouteReading: boolean;
	};
	readyToComplete: boolean;
	completed: boolean;
}

export interface LowerSprawlCompletionResult {
	stageId: 'lower-sprawl';
	completedQuestIds: string[];
	completedMinigameIds: string[];
	completedTutorialIds: string[];
}

export type LowerSprawlObjectiveEvent =
	| { kind: 'meter-scanned'; id: string }
	| { kind: 'quest-complete'; id: 'meter-maidens-ledger' }
	| { kind: 'puzzle-started'; id: 'toll-gate-rhythm' }
	| { kind: 'puzzle-step'; input: LowerSprawlRhythmInput; step: number }
	| { kind: 'puzzle-failed'; id: 'toll-gate-rhythm' }
	| { kind: 'hack-mistake-ignored'; id: 'toll-gate-rhythm' }
	| { kind: 'puzzle-complete'; id: 'toll-gate-rhythm' }
	| { kind: 'tutorial-complete'; id: 'jump-coyote' | 'public-route-reading' }
	| { kind: 'stage-ready'; id: 'lower-sprawl' };

const INTERACTION_RADIUS = 68;
const BEAT_WINDOW_SECONDS = 1.35;

export const LOWER_SPRAWL_METERS: readonly LowerSprawlInteractable[] = [
	{ id: 'meter-west', label: 'West toll meter', x: 185, y: 448 },
	{ id: 'meter-market', label: 'Market toll meter', x: 790, y: 448 },
	{ id: 'meter-east', label: 'East toll meter', x: 1260, y: 448 },
];

export const LOWER_SPRAWL_TOLL_GATE: LowerSprawlInteractable = {
	id: 'toll-gate-rhythm',
	label: 'Rent-sensor toll gate',
	x: 1395,
	y: 448,
};

export const LOWER_SPRAWL_RHYTHM_SEQUENCE: readonly LowerSprawlRhythmInput[] = [
	'melee',
	'parry',
	'shoot',
];

function distanceSquared(ax: number, ay: number, bx: number, by: number): number {
	const dx = ax - bx;
	const dy = ay - by;
	return dx * dx + dy * dy;
}

function rhythmInput(action: ActionMap): LowerSprawlRhythmInput | null {
	if (action.meleePressed) return 'melee';
	if (action.parryPressed) return 'parry';
	if (action.shootPressed) return 'shoot';
	return null;
}

export class LowerSprawlObjectives {
	private readonly scannedMeterIds = new Set<string>();
	private puzzleStatus: LowerSprawlPuzzleStatus = 'idle';
	private puzzleStep = 0;
	private beatRemaining = 0;
	private mistakes = 0;
	private payloadCollected = false;
	private bossDefeated = false;
	private jumpCoyote = false;
	private publicRouteReading = false;
	private readyEventEmitted = false;
	private completed = false;

	step(dt: number, player?: ProgressionPuzzlePlayer): LowerSprawlObjectiveEvent[] {
		if (this.puzzleStatus !== 'active') return [];
		this.beatRemaining = Math.max(0, this.beatRemaining - puzzleStepSeconds(dt, player));
		if (this.beatRemaining > 0) return [];
		this.puzzleStatus = 'failed';
		this.puzzleStep = 0;
		this.mistakes += 1;
		return [{ kind: 'puzzle-failed', id: 'toll-gate-rhythm' }];
	}

	observeAction(
		player: { x: number; y: number; w: number; h: number } & ProgressionPuzzlePlayer,
		action: ActionMap
	): LowerSprawlObjectiveEvent[] {
		const events: LowerSprawlObjectiveEvent[] = [];
		const centerX = player.x + player.w / 2;
		const centerY = player.y + player.h / 2;

		if (action.jumpPressed && !this.jumpCoyote) {
			this.jumpCoyote = true;
			events.push({ kind: 'tutorial-complete', id: 'jump-coyote' });
		}

		if (action.hackPressed) {
			const meter = LOWER_SPRAWL_METERS.find(
				(candidate) =>
					!this.scannedMeterIds.has(candidate.id) &&
					distanceSquared(centerX, centerY, candidate.x, candidate.y) <= INTERACTION_RADIUS ** 2
			);
			if (meter) {
				this.scannedMeterIds.add(meter.id);
				events.push({ kind: 'meter-scanned', id: meter.id });
				if (!this.publicRouteReading) {
					this.publicRouteReading = true;
					events.push({ kind: 'tutorial-complete', id: 'public-route-reading' });
				}
				if (this.scannedMeterIds.size === LOWER_SPRAWL_METERS.length) {
					events.push({ kind: 'quest-complete', id: 'meter-maidens-ledger' });
				}
			}

			if (
				!meter &&
				this.puzzleStatus !== 'solved' &&
				distanceSquared(centerX, centerY, LOWER_SPRAWL_TOLL_GATE.x, LOWER_SPRAWL_TOLL_GATE.y) <=
					INTERACTION_RADIUS ** 2
			) {
				this.puzzleStatus = 'active';
				this.puzzleStep = 0;
				this.beatRemaining = BEAT_WINDOW_SECONDS;
				events.push({ kind: 'puzzle-started', id: 'toll-gate-rhythm' });
			}
		}

		const input = rhythmInput(action);
		if (input && this.puzzleStatus === 'active') {
			const expected = LOWER_SPRAWL_RHYTHM_SEQUENCE[this.puzzleStep];
			if (input === expected) {
				this.puzzleStep += 1;
				events.push({ kind: 'puzzle-step', input, step: this.puzzleStep });
				if (this.puzzleStep >= LOWER_SPRAWL_RHYTHM_SEQUENCE.length) {
					this.puzzleStatus = 'solved';
					this.beatRemaining = 0;
					events.push({ kind: 'puzzle-complete', id: 'toll-gate-rhythm' });
				} else {
					this.beatRemaining = BEAT_WINDOW_SECONDS;
				}
			} else {
				if (consumeHackMistakeShield(player)) {
					this.beatRemaining = BEAT_WINDOW_SECONDS;
					events.push({ kind: 'hack-mistake-ignored', id: 'toll-gate-rhythm' });
					return events;
				}
				this.puzzleStatus = 'failed';
				this.puzzleStep = 0;
				this.beatRemaining = 0;
				this.mistakes += 1;
				events.push({ kind: 'puzzle-failed', id: 'toll-gate-rhythm' });
			}
		}

		return events;
	}

	observeWorld(payloadCollected: boolean, bossDefeated: boolean): LowerSprawlObjectiveEvent[] {
		this.payloadCollected ||= payloadCollected;
		this.bossDefeated ||= bossDefeated;
		if (this.isReadyToComplete() && !this.readyEventEmitted) {
			this.readyEventEmitted = true;
			return [{ kind: 'stage-ready', id: 'lower-sprawl' }];
		}
		return [];
	}

	claimCompletion(): LowerSprawlCompletionResult | null {
		if (!this.isReadyToComplete() || this.completed) return null;
		this.completed = true;
		return {
			stageId: 'lower-sprawl',
			completedQuestIds: this.isQuestComplete() ? ['meter-maidens-ledger'] : [],
			completedMinigameIds: ['toll-gate-rhythm'],
			completedTutorialIds: [
				...(this.jumpCoyote ? ['jump-coyote'] : []),
				...(this.publicRouteReading ? ['public-route-reading'] : []),
			],
		};
	}

	getSnapshot(): LowerSprawlObjectiveSnapshot {
		return {
			stageId: 'lower-sprawl',
			meters: LOWER_SPRAWL_METERS.map((meter) => ({
				...meter,
				scanned: this.scannedMeterIds.has(meter.id),
			})),
			gate: { ...LOWER_SPRAWL_TOLL_GATE },
			questComplete: this.isQuestComplete(),
			puzzleStatus: this.puzzleStatus,
			puzzleStep: this.puzzleStep,
			puzzleSequence: [...LOWER_SPRAWL_RHYTHM_SEQUENCE],
			expectedInput:
				this.puzzleStatus === 'active'
					? (LOWER_SPRAWL_RHYTHM_SEQUENCE[this.puzzleStep] ?? null)
					: null,
			beatRemaining: this.beatRemaining,
			mistakes: this.mistakes,
			payloadCollected: this.payloadCollected,
			bossDefeated: this.bossDefeated,
			tutorials: {
				jumpCoyote: this.jumpCoyote,
				publicRouteReading: this.publicRouteReading,
			},
			readyToComplete: this.isReadyToComplete(),
			completed: this.completed,
		};
	}

	private isQuestComplete(): boolean {
		return this.scannedMeterIds.size === LOWER_SPRAWL_METERS.length;
	}

	private isReadyToComplete(): boolean {
		return this.puzzleStatus === 'solved' && this.payloadCollected && this.bossDefeated;
	}
}
