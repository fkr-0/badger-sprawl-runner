import type { ActionMap } from '../systems/InputSystem';
import {
	type ProgressionPuzzlePlayer,
	consumeHackMistakeShield,
	puzzleStepSeconds,
} from './ProgressionPuzzleModifiers';

export type DrainmarketTriageInput = 'parry' | 'melee' | 'shoot';
export type DrainmarketTriageStatus = 'idle' | 'active' | 'solved' | 'failed';

export interface DrainmarketInteractable {
	id: string;
	label: string;
	x: number;
	y: number;
}

export interface DrainmarketObjectiveSnapshot {
	stageId: 'drainmarket';
	invoices: Array<DrainmarketInteractable & { delivered: boolean }>;
	clinic: DrainmarketInteractable;
	questComplete: boolean;
	triageStatus: DrainmarketTriageStatus;
	triageStep: number;
	triageSequence: DrainmarketTriageInput[];
	expectedInput: DrainmarketTriageInput | null;
	inputRemaining: number;
	mistakes: number;
	parryWindowSeen: boolean;
	parryTutorialComplete: boolean;
	payloadCollected: boolean;
	bossDefeated: boolean;
	readyToComplete: boolean;
	completed: boolean;
}

export interface DrainmarketCompletionResult {
	stageId: 'drainmarket';
	completedQuestIds: string[];
	completedMinigameIds: string[];
	completedTutorialIds: string[];
}

export type DrainmarketObjectiveEvent =
	| { kind: 'invoice-delivered'; id: string }
	| { kind: 'quest-complete'; id: 'clinic-without-cameras' }
	| { kind: 'triage-started'; id: 'injury-ledger-triage' }
	| { kind: 'triage-step'; input: DrainmarketTriageInput; step: number }
	| { kind: 'triage-failed'; id: 'injury-ledger-triage' }
	| { kind: 'hack-mistake-ignored'; id: 'injury-ledger-triage' }
	| { kind: 'triage-complete'; id: 'injury-ledger-triage' }
	| { kind: 'parry-window-opened'; attack: string }
	| { kind: 'tutorial-complete'; id: 'parry-window' }
	| { kind: 'stage-ready'; id: 'drainmarket' };

const INTERACTION_RADIUS = 72;
const INPUT_WINDOW_SECONDS = 1.65;

export const DRAINMARKET_INVOICES: readonly DrainmarketInteractable[] = [
	{ id: 'invoice-sump', label: 'Sump ward invoices', x: 286, y: 448 },
	{ id: 'invoice-tunnel', label: 'Tunnel clinic invoices', x: 760, y: 448 },
	{ id: 'invoice-shutter', label: 'Shutter clinic invoices', x: 1165, y: 448 },
];

export const DRAINMARKET_CLINIC: DrainmarketInteractable = {
	id: 'injury-ledger-triage',
	label: 'Mutual-aid triage terminal',
	x: 1365,
	y: 448,
};

export const DRAINMARKET_TRIAGE_SEQUENCE: readonly DrainmarketTriageInput[] = [
	'parry',
	'melee',
	'shoot',
];

function distanceSquared(ax: number, ay: number, bx: number, by: number): number {
	const dx = ax - bx;
	const dy = ay - by;
	return dx * dx + dy * dy;
}

function triageInput(action: ActionMap): DrainmarketTriageInput | null {
	if (action.parryPressed) return 'parry';
	if (action.meleePressed) return 'melee';
	if (action.shootPressed) return 'shoot';
	return null;
}

export class DrainmarketObjectives {
	private readonly deliveredInvoiceIds = new Set<string>();
	private triageStatus: DrainmarketTriageStatus = 'idle';
	private triageStep = 0;
	private inputRemaining = 0;
	private mistakes = 0;
	private parryWindowSeen = false;
	private parryTutorialComplete = false;
	private payloadCollected = false;
	private bossDefeated = false;
	private readyEventEmitted = false;
	private completed = false;

	step(dt: number, player?: ProgressionPuzzlePlayer): DrainmarketObjectiveEvent[] {
		if (this.triageStatus !== 'active') return [];
		this.inputRemaining = Math.max(0, this.inputRemaining - puzzleStepSeconds(dt, player));
		if (this.inputRemaining > 0) return [];
		this.failTriage();
		return [{ kind: 'triage-failed', id: 'injury-ledger-triage' }];
	}

	observeAction(
		player: { x: number; y: number; w: number; h: number } & ProgressionPuzzlePlayer,
		action: ActionMap
	): DrainmarketObjectiveEvent[] {
		const events: DrainmarketObjectiveEvent[] = [];
		const centerX = player.x + player.w / 2;
		const centerY = player.y + player.h / 2;

		if (action.hackPressed) {
			const invoice = DRAINMARKET_INVOICES.find(
				(candidate) =>
					!this.deliveredInvoiceIds.has(candidate.id) &&
					distanceSquared(centerX, centerY, candidate.x, candidate.y) <= INTERACTION_RADIUS ** 2
			);
			if (invoice) {
				this.deliveredInvoiceIds.add(invoice.id);
				events.push({ kind: 'invoice-delivered', id: invoice.id });
				if (this.isQuestComplete()) {
					events.push({ kind: 'quest-complete', id: 'clinic-without-cameras' });
				}
			}

			if (
				!invoice &&
				this.triageStatus !== 'solved' &&
				distanceSquared(centerX, centerY, DRAINMARKET_CLINIC.x, DRAINMARKET_CLINIC.y) <=
					INTERACTION_RADIUS ** 2
			) {
				this.triageStatus = 'active';
				this.triageStep = 0;
				this.inputRemaining = INPUT_WINDOW_SECONDS;
				events.push({ kind: 'triage-started', id: 'injury-ledger-triage' });
			}
		}

		const input = triageInput(action);
		if (input && this.triageStatus === 'active') {
			const expected = DRAINMARKET_TRIAGE_SEQUENCE[this.triageStep];
			if (input === expected) {
				this.triageStep += 1;
				events.push({ kind: 'triage-step', input, step: this.triageStep });
				if (this.triageStep >= DRAINMARKET_TRIAGE_SEQUENCE.length) {
					this.triageStatus = 'solved';
					this.inputRemaining = 0;
					events.push({ kind: 'triage-complete', id: 'injury-ledger-triage' });
				} else {
					this.inputRemaining = INPUT_WINDOW_SECONDS;
				}
			} else {
				if (consumeHackMistakeShield(player)) {
					this.inputRemaining = INPUT_WINDOW_SECONDS;
					events.push({ kind: 'hack-mistake-ignored', id: 'injury-ledger-triage' });
					return events;
				}
				this.failTriage();
				events.push({ kind: 'triage-failed', id: 'injury-ledger-triage' });
			}
		}

		return events;
	}

	observeEnemyTelegraph(attack: string): DrainmarketObjectiveEvent[] {
		if (this.parryWindowSeen || !/knife|invoice|nest/i.test(attack)) return [];
		this.parryWindowSeen = true;
		return [{ kind: 'parry-window-opened', attack }];
	}

	observeParry(moveId = ''): DrainmarketObjectiveEvent[] {
		if (
			this.parryTutorialComplete ||
			!this.parryWindowSeen ||
			(moveId.length > 0 && !/knife|invoice|nest/i.test(moveId))
		) {
			return [];
		}
		this.parryTutorialComplete = true;
		return [{ kind: 'tutorial-complete', id: 'parry-window' }];
	}

	observeWorld(payloadCollected: boolean, bossDefeated: boolean): DrainmarketObjectiveEvent[] {
		this.payloadCollected ||= payloadCollected;
		this.bossDefeated ||= bossDefeated;
		if (this.isReadyToComplete() && !this.readyEventEmitted) {
			this.readyEventEmitted = true;
			return [{ kind: 'stage-ready', id: 'drainmarket' }];
		}
		return [];
	}

	claimCompletion(): DrainmarketCompletionResult | null {
		if (!this.isReadyToComplete() || this.completed) return null;
		this.completed = true;
		return {
			stageId: 'drainmarket',
			completedQuestIds: this.isQuestComplete() ? ['clinic-without-cameras'] : [],
			completedMinigameIds: ['injury-ledger-triage'],
			completedTutorialIds: this.parryTutorialComplete ? ['parry-window'] : [],
		};
	}

	getSnapshot(): DrainmarketObjectiveSnapshot {
		return {
			stageId: 'drainmarket',
			invoices: DRAINMARKET_INVOICES.map((invoice) => ({
				...invoice,
				delivered: this.deliveredInvoiceIds.has(invoice.id),
			})),
			clinic: { ...DRAINMARKET_CLINIC },
			questComplete: this.isQuestComplete(),
			triageStatus: this.triageStatus,
			triageStep: this.triageStep,
			triageSequence: [...DRAINMARKET_TRIAGE_SEQUENCE],
			expectedInput:
				this.triageStatus === 'active'
					? (DRAINMARKET_TRIAGE_SEQUENCE[this.triageStep] ?? null)
					: null,
			inputRemaining: this.inputRemaining,
			mistakes: this.mistakes,
			parryWindowSeen: this.parryWindowSeen,
			parryTutorialComplete: this.parryTutorialComplete,
			payloadCollected: this.payloadCollected,
			bossDefeated: this.bossDefeated,
			readyToComplete: this.isReadyToComplete(),
			completed: this.completed,
		};
	}

	private failTriage(): void {
		this.triageStatus = 'failed';
		this.triageStep = 0;
		this.inputRemaining = 0;
		this.mistakes += 1;
	}

	private isQuestComplete(): boolean {
		return this.deliveredInvoiceIds.size === DRAINMARKET_INVOICES.length;
	}

	private isReadyToComplete(): boolean {
		return this.triageStatus === 'solved' && this.payloadCollected && this.bossDefeated;
	}
}
