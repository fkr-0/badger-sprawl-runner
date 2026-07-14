import type { ActionMap } from '../systems/InputSystem';
import {
	type ProgressionPuzzlePlayer,
	consumeHackMistakeShield,
	puzzleStepSeconds,
} from './ProgressionPuzzleModifiers';

export type ArcologyRouterInput = 'shoot' | 'parry';
export type ArcologyRouterStatus = 'idle' | 'active' | 'solved' | 'failed';

export interface ArcologyInteractable {
	id: string;
	label: string;
	x: number;
	y: number;
}

export interface ArcologySightline extends ArcologyInteractable {
	targetX: number;
	roomId: string;
}

export interface ChromeArcologyObjectiveSnapshot {
	stageId: 'chrome-arcology';
	sightlines: Array<ArcologySightline & { pierced: boolean }>;
	cargoTags: Array<ArcologyInteractable & { scanned: boolean }>;
	router: ArcologyInteractable;
	routerStatus: ArcologyRouterStatus;
	routerStep: number;
	routerSequence: ArcologyRouterInput[];
	expectedInput: ArcologyRouterInput | null;
	inputRemaining: number;
	mistakes: number;
	railgunTutorialComplete: boolean;
	questComplete: boolean;
	payloadCollected: boolean;
	bossDefeated: boolean;
	readyToComplete: boolean;
	completed: boolean;
}

export interface ChromeArcologyCompletionResult {
	stageId: 'chrome-arcology';
	completedQuestIds: string[];
	completedMinigameIds: string[];
	completedTutorialIds: string[];
}

export type ChromeArcologyObjectiveEvent =
	| { kind: 'sightline-pierced'; id: string; roomId: string }
	| { kind: 'tutorial-complete'; id: 'railgun-sightline' }
	| { kind: 'cargo-tag-scanned'; id: string }
	| { kind: 'quest-complete'; id: 'cargo-name-tags' }
	| { kind: 'router-started'; id: 'elevator-seed-router' }
	| { kind: 'router-step'; input: ArcologyRouterInput; step: number }
	| { kind: 'router-failed'; id: 'elevator-seed-router' }
	| { kind: 'hack-mistake-ignored'; id: 'elevator-seed-router' }
	| { kind: 'router-complete'; id: 'elevator-seed-router' }
	| { kind: 'stage-ready'; id: 'chrome-arcology' };

const INTERACTION_RADIUS = 76;
const SIGHTLINE_RADIUS = 94;
const ROUTER_INPUT_WINDOW_SECONDS = 1.8;

export const ARCOLOGY_SIGHTLINES: readonly ArcologySightline[] = [
	{
		id: 'atrium-rail-lock',
		label: 'Glass Atrium Sightline',
		roomId: 'glass-atrium-sightline',
		x: 420,
		y: 448,
		targetX: 660,
	},
	{
		id: 'cargo-crossfire-lock',
		label: 'Cargo Shaft Crossfire',
		roomId: 'cargo-shaft-crossfire',
		x: 930,
		y: 448,
		targetX: 1210,
	},
	{
		id: 'gallery-pierce-lock',
		label: 'Vitrine Gallery Pierce',
		roomId: 'vitrine-gallery-pierce',
		x: 1440,
		y: 448,
		targetX: 1700,
	},
];

export const ARCOLOGY_CARGO_TAGS: readonly ArcologyInteractable[] = [
	{ id: 'labor-floor-b2', label: 'Hidden labor floor B2', x: 760, y: 448 },
	{ id: 'labor-floor-b7', label: 'Hidden labor floor B7', x: 1270, y: 448 },
];

export const ARCOLOGY_ROUTER: ArcologyInteractable = {
	id: 'elevator-seed-router',
	label: 'Elevator Seed Router',
	x: 1780,
	y: 448,
};

export const ARCOLOGY_ROUTER_SEQUENCE: readonly ArcologyRouterInput[] = ['shoot', 'parry', 'shoot'];

function distanceSquared(ax: number, ay: number, bx: number, by: number): number {
	const dx = ax - bx;
	const dy = ay - by;
	return dx * dx + dy * dy;
}

function routerInput(action: ActionMap): ArcologyRouterInput | null {
	if (action.shootPressed) return 'shoot';
	if (action.parryPressed) return 'parry';
	return null;
}

export class ChromeArcologyObjectives {
	private readonly piercedSightlineIds = new Set<string>();
	private readonly scannedCargoTagIds = new Set<string>();
	private routerStatus: ArcologyRouterStatus = 'idle';
	private routerStep = 0;
	private inputRemaining = 0;
	private mistakes = 0;
	private railgunTutorialComplete = false;
	private payloadCollected = false;
	private bossDefeated = false;
	private readyEventEmitted = false;
	private completed = false;

	step(dt: number, player?: ProgressionPuzzlePlayer): ChromeArcologyObjectiveEvent[] {
		if (this.routerStatus !== 'active') return [];
		this.inputRemaining = Math.max(0, this.inputRemaining - puzzleStepSeconds(dt, player));
		if (this.inputRemaining > 0) return [];
		this.failRouter();
		return [{ kind: 'router-failed', id: 'elevator-seed-router' }];
	}

	observeAction(
		player: {
			x: number;
			y: number;
			w: number;
			h: number;
			dir: number;
			hasRailgun?: boolean;
			shootCd?: number;
		} & ProgressionPuzzlePlayer,
		action: ActionMap
	): ChromeArcologyObjectiveEvent[] {
		const events: ChromeArcologyObjectiveEvent[] = [];
		const centerX = player.x + player.w / 2;
		const centerY = player.y + player.h / 2;

		if (action.hackPressed) {
			const cargoTag = ARCOLOGY_CARGO_TAGS.find(
				(candidate) =>
					!this.scannedCargoTagIds.has(candidate.id) &&
					distanceSquared(centerX, centerY, candidate.x, candidate.y) <= INTERACTION_RADIUS ** 2
			);
			if (cargoTag) {
				this.scannedCargoTagIds.add(cargoTag.id);
				events.push({ kind: 'cargo-tag-scanned', id: cargoTag.id });
				if (this.isQuestComplete()) {
					events.push({ kind: 'quest-complete', id: 'cargo-name-tags' });
				}
			}

			if (
				!cargoTag &&
				this.routerStatus !== 'solved' &&
				this.allSightlinesPierced() &&
				this.isQuestComplete() &&
				distanceSquared(centerX, centerY, ARCOLOGY_ROUTER.x, ARCOLOGY_ROUTER.y) <=
					INTERACTION_RADIUS ** 2
			) {
				this.routerStatus = 'active';
				this.routerStep = 0;
				this.inputRemaining = ROUTER_INPUT_WINDOW_SECONDS;
				events.push({ kind: 'router-started', id: 'elevator-seed-router' });
			}
		}

		if (action.shootPressed && player.hasRailgun && (player.shootCd ?? 0) <= 0) {
			const sightline = ARCOLOGY_SIGHTLINES.find(
				(candidate) =>
					!this.piercedSightlineIds.has(candidate.id) &&
					distanceSquared(centerX, centerY, candidate.x, candidate.y) <= SIGHTLINE_RADIUS ** 2 &&
					Math.sign(candidate.targetX - centerX) === Math.sign(player.dir)
			);
			if (sightline) {
				this.piercedSightlineIds.add(sightline.id);
				events.push({
					kind: 'sightline-pierced',
					id: sightline.id,
					roomId: sightline.roomId,
				});
				if (!this.railgunTutorialComplete) {
					this.railgunTutorialComplete = true;
					events.push({ kind: 'tutorial-complete', id: 'railgun-sightline' });
				}
			}
		}

		const input = routerInput(action);
		if (input && this.routerStatus === 'active') {
			const expected = ARCOLOGY_ROUTER_SEQUENCE[this.routerStep];
			if (input === expected) {
				this.routerStep += 1;
				events.push({ kind: 'router-step', input, step: this.routerStep });
				if (this.routerStep >= ARCOLOGY_ROUTER_SEQUENCE.length) {
					this.routerStatus = 'solved';
					this.inputRemaining = 0;
					events.push({ kind: 'router-complete', id: 'elevator-seed-router' });
				} else {
					this.inputRemaining = ROUTER_INPUT_WINDOW_SECONDS;
				}
			} else {
				if (consumeHackMistakeShield(player)) {
					this.inputRemaining = ROUTER_INPUT_WINDOW_SECONDS;
					events.push({ kind: 'hack-mistake-ignored', id: 'elevator-seed-router' });
					return events;
				}
				this.failRouter();
				events.push({ kind: 'router-failed', id: 'elevator-seed-router' });
			}
		}

		return events;
	}

	observeWorld(payloadCollected: boolean, bossDefeated: boolean): ChromeArcologyObjectiveEvent[] {
		this.payloadCollected ||= payloadCollected;
		this.bossDefeated ||= bossDefeated;
		if (this.isReadyToComplete() && !this.readyEventEmitted) {
			this.readyEventEmitted = true;
			return [{ kind: 'stage-ready', id: 'chrome-arcology' }];
		}
		return [];
	}

	claimCompletion(): ChromeArcologyCompletionResult | null {
		if (!this.isReadyToComplete() || this.completed) return null;
		this.completed = true;
		return {
			stageId: 'chrome-arcology',
			completedQuestIds: this.isQuestComplete() ? ['cargo-name-tags'] : [],
			completedMinigameIds: ['elevator-seed-router'],
			completedTutorialIds: this.railgunTutorialComplete ? ['railgun-sightline'] : [],
		};
	}

	getSnapshot(): ChromeArcologyObjectiveSnapshot {
		return {
			stageId: 'chrome-arcology',
			sightlines: ARCOLOGY_SIGHTLINES.map((sightline) => ({
				...sightline,
				pierced: this.piercedSightlineIds.has(sightline.id),
			})),
			cargoTags: ARCOLOGY_CARGO_TAGS.map((tag) => ({
				...tag,
				scanned: this.scannedCargoTagIds.has(tag.id),
			})),
			router: { ...ARCOLOGY_ROUTER },
			routerStatus: this.routerStatus,
			routerStep: this.routerStep,
			routerSequence: [...ARCOLOGY_ROUTER_SEQUENCE],
			expectedInput:
				this.routerStatus === 'active' ? (ARCOLOGY_ROUTER_SEQUENCE[this.routerStep] ?? null) : null,
			inputRemaining: this.inputRemaining,
			mistakes: this.mistakes,
			railgunTutorialComplete: this.railgunTutorialComplete,
			questComplete: this.isQuestComplete(),
			payloadCollected: this.payloadCollected,
			bossDefeated: this.bossDefeated,
			readyToComplete: this.isReadyToComplete(),
			completed: this.completed,
		};
	}

	private failRouter(): void {
		this.routerStatus = 'failed';
		this.routerStep = 0;
		this.inputRemaining = 0;
		this.mistakes += 1;
	}

	private allSightlinesPierced(): boolean {
		return this.piercedSightlineIds.size === ARCOLOGY_SIGHTLINES.length;
	}

	private isQuestComplete(): boolean {
		return this.scannedCargoTagIds.size === ARCOLOGY_CARGO_TAGS.length;
	}

	private isReadyToComplete(): boolean {
		return this.routerStatus === 'solved' && this.payloadCollected && this.bossDefeated;
	}
}
