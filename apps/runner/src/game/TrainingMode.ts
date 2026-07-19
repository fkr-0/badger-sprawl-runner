export type TrainingLessonId =
	| 'movement'
	| 'melee'
	| 'parry'
	| 'railgun'
	| 'rocket'
	| 'codegate'
	| 'boss-pattern';

export type DummyPresetId = 'idle' | 'walking' | 'jumping' | 'attacking' | 'armored' | 'flying';
export type TrainingKitId = 'base' | 'railgun' | 'rocket' | 'full';
export type TrainingAction =
	| 'none'
	| 'movement'
	| 'melee'
	| 'parry'
	| 'railgun'
	| 'rocket'
	| 'codegate';

export interface TrainingLesson {
	id: TrainingLessonId;
	label: string;
	goal: string;
}

export interface DummyPreset {
	id: DummyPresetId;
	label: string;
	invincible: true;
	behavior: string;
}

export interface TrainingKit {
	id: TrainingKitId;
	label: string;
	unlocks: string[];
}

export interface TrainingMetrics {
	hitCount: number;
	damageTotal: number;
	lastAction: TrainingAction;
	lastHitDamage: number;
	comboDamage: number;
	hitsPerSecond: number;
	railReloadDeltaMs: number;
	parryWindowDeltaMs: number;
	meleeActiveFrames: number;
	recoveryFrames: number;
	hackCastTimeMs: number;
}

export interface TrainingOverlayState {
	showHitboxes: boolean;
	showHurtboxes: boolean;
	showFrameData: boolean;
	showDamageNumbers: boolean;
}

export interface TrainingState {
	lessonId: TrainingLessonId;
	dummyPresetId: DummyPresetId;
	kitId: TrainingKitId;
	metrics: TrainingMetrics;
	overlays: TrainingOverlayState;
}

const DEFAULT_TRAINING_LESSON: TrainingLesson = {
	id: 'movement',
	label: 'Movement',
	goal: 'Practice run, jump, landing, and reset timing.',
};
const DEFAULT_DUMMY_PRESET: DummyPreset = {
	id: 'idle',
	label: 'Idle Dummy',
	invincible: true,
	behavior: 'stands still for free practice',
};
const DEFAULT_TRAINING_KIT: TrainingKit = { id: 'base', label: 'Base Kit', unlocks: [] };

export const TRAINING_LESSONS: TrainingLesson[] = [
	DEFAULT_TRAINING_LESSON,
	{ id: 'melee', label: 'Melee', goal: 'Practice claw range, hit confirms, and combo rhythm.' },
	{ id: 'parry', label: 'Parry', goal: 'Practice readable danger windows and counter timing.' },
	{ id: 'railgun', label: 'Railgun', goal: 'Practice charge, aim lanes, and piercing shots.' },
	{ id: 'rocket', label: 'Rocket Pack', goal: 'Practice boost, fuel recovery, and aerial safety.' },
	{ id: 'codegate', label: 'Code Gate', goal: 'Practice hacking prompts without story pressure.' },
	{
		id: 'boss-pattern',
		label: 'Boss Pattern',
		goal: 'Practice tells, phase resets, and dodge discipline.',
	},
];

export const DUMMY_PRESETS: DummyPreset[] = [
	DEFAULT_DUMMY_PRESET,
	{ id: 'walking', label: 'Walking Dummy', invincible: true, behavior: 'paces horizontally' },
	{ id: 'jumping', label: 'Jumping Dummy', invincible: true, behavior: 'hops on a fixed rhythm' },
	{
		id: 'attacking',
		label: 'Attacking Dummy',
		invincible: true,
		behavior: 'telegraphs simple strikes',
	},
	{
		id: 'armored',
		label: 'Armored Dummy',
		invincible: true,
		behavior: 'requires parry or heavy hits',
	},
	{ id: 'flying', label: 'Flying Dummy', invincible: true, behavior: 'hovers above melee range' },
];

export const TRAINING_KITS: TrainingKit[] = [
	DEFAULT_TRAINING_KIT,
	{ id: 'railgun', label: 'Railgun Kit', unlocks: ['railgun'] },
	{ id: 'rocket', label: 'Rocket Kit', unlocks: ['rocket_pack'] },
	{ id: 'full', label: 'Full Kit', unlocks: ['railgun', 'rocket_pack', 'codegate'] },
];

function zeroMetrics(): TrainingMetrics {
	return {
		hitCount: 0,
		damageTotal: 0,
		lastAction: 'none',
		lastHitDamage: 0,
		comboDamage: 0,
		hitsPerSecond: 0,
		railReloadDeltaMs: 0,
		parryWindowDeltaMs: 0,
		meleeActiveFrames: 0,
		recoveryFrames: 0,
		hackCastTimeMs: 0,
	};
}

const DEFAULT_OVERLAYS: TrainingOverlayState = {
	showHitboxes: true,
	showHurtboxes: true,
	showFrameData: true,
	showDamageNumbers: true,
};

function clone<T>(value: T): T {
	return structuredClone(value) as T;
}

export class TrainingMode {
	private recentHitTimes: number[] = [];
	private state: TrainingState = {
		lessonId: 'movement',
		dummyPresetId: 'idle',
		kitId: 'base',
		metrics: zeroMetrics(),
		overlays: { ...DEFAULT_OVERLAYS },
	};

	getState(): TrainingState {
		return clone(this.state);
	}

	getLesson(): TrainingLesson {
		return clone(
			TRAINING_LESSONS.find((lesson) => lesson.id === this.state.lessonId) ??
				DEFAULT_TRAINING_LESSON
		);
	}

	getDummyPreset(): DummyPreset {
		return clone(
			DUMMY_PRESETS.find((preset) => preset.id === this.state.dummyPresetId) ?? DEFAULT_DUMMY_PRESET
		);
	}

	getPlayerKit(): TrainingKit {
		return clone(TRAINING_KITS.find((kit) => kit.id === this.state.kitId) ?? DEFAULT_TRAINING_KIT);
	}

	selectLesson(lessonId: TrainingLessonId): void {
		if (TRAINING_LESSONS.some((lesson) => lesson.id === lessonId)) {
			this.state = { ...this.state, lessonId };
		}
	}

	selectDummyPreset(dummyPresetId: DummyPresetId): void {
		if (DUMMY_PRESETS.some((preset) => preset.id === dummyPresetId)) {
			this.state = { ...this.state, dummyPresetId };
		}
	}

	selectKit(kitId: TrainingKitId): void {
		if (TRAINING_KITS.some((kit) => kit.id === kitId)) {
			this.state = { ...this.state, kitId };
		}
	}

	recordHit(hit: { damage: number; action: TrainingAction; timeMs?: number }): void {
		const timeMs = hit.timeMs ?? performance.now();
		this.recentHitTimes = this.recentHitTimes.filter((time) => timeMs - time <= 1000);
		this.recentHitTimes.push(timeMs);
		this.state = {
			...this.state,
			metrics: {
				...this.state.metrics,
				hitCount: this.state.metrics.hitCount + 1,
				damageTotal: this.state.metrics.damageTotal + hit.damage,
				lastAction: hit.action,
				lastHitDamage: hit.damage,
				comboDamage: this.state.metrics.comboDamage + hit.damage,
				hitsPerSecond: this.recentHitTimes.length,
			},
		};
	}

	recordMeasurements(measurements: Partial<Omit<TrainingMetrics, 'hitCount' | 'damageTotal' | 'lastAction'>>): void {
		this.state = {
			...this.state,
			metrics: { ...this.state.metrics, ...measurements },
		};
	}

	toggleOverlay(overlay: keyof TrainingOverlayState): void {
		this.state = {
			...this.state,
			overlays: { ...this.state.overlays, [overlay]: !this.state.overlays[overlay] },
		};
	}

	toggleAllOverlays(): void {
		const enabled = !Object.values(this.state.overlays).every(Boolean);
		this.state = {
			...this.state,
			overlays: {
				showHitboxes: enabled,
				showHurtboxes: enabled,
				showFrameData: enabled,
				showDamageNumbers: enabled,
			},
		};
	}

	resetPractice(): void {
		this.recentHitTimes = [];
		this.state = { ...this.state, metrics: zeroMetrics() };
	}
}

export function createTrainingMode(): TrainingMode {
	return new TrainingMode();
}
