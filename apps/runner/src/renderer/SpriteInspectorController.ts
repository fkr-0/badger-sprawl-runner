import {
	type LoadedSheet,
	type SpriteAnimationEvent,
	type SpriteAnimationPlaybackState,
	type SpriteAnimationTimeline,
	type SpriteSheetInspection,
	advanceSpriteAnimation,
	createSpriteAnimationPlayback,
	createSpriteAnimationTimeline,
	getSpriteAnimationFrameAddress,
	getSpriteAnimationProgress,
	inspectSpriteSheet,
	pauseSpriteAnimation,
	resumeSpriteAnimation,
	seekSpriteAnimationProgress,
	setSpriteAnimationSpeed,
} from '@badger/sprite-contracts';

export type SpriteInspectorMode = SpriteAnimationPlaybackState['mode'];

export interface SpriteInspectorEventRecord extends SpriteAnimationEvent {
	sequence: number;
	animationName: string;
	localFrame: number;
}

export interface SpriteInspectorSnapshot {
	sheetId: string;
	animationName: string;
	mode: SpriteInspectorMode;
	speed: number;
	frame: number;
	direction: 1 | -1;
	playing: boolean;
	paused: boolean;
	completed: boolean;
	progress: number;
	address: ReturnType<typeof getSpriteAnimationFrameAddress>;
	timeline: SpriteAnimationTimeline;
	currentEvents: readonly SpriteAnimationEvent[];
	eventLog: readonly SpriteInspectorEventRecord[];
	sheet: SpriteSheetInspection;
}

function defaultAnimationName(sheet: LoadedSheet, preferred?: string): string {
	if (preferred && sheet.sheet.animations[preferred]) return preferred;
	if (sheet.sheet.animations.idle) return 'idle';
	const first = Object.keys(sheet.sheet.animations)[0];
	if (!first) throw new Error(`Sprite sheet has no animations: ${sheet.sheet.id}`);
	return first;
}

function modeFor(sheet: LoadedSheet, animationName: string): SpriteInspectorMode {
	return sheet.sheet.animations[animationName]?.loop === false ? 'once' : 'loop';
}

export class SpriteInspectorController {
	private loaded: LoadedSheet;
	private playback: SpriteAnimationPlaybackState;
	private sheetInspection: SpriteSheetInspection;
	private events: SpriteInspectorEventRecord[] = [];
	private eventSequence = 0;

	constructor(loaded: LoadedSheet, animationName?: string, mode?: SpriteInspectorMode) {
		this.loaded = loaded;
		const selected = defaultAnimationName(loaded, animationName);
		this.playback = createSpriteAnimationPlayback(loaded.sheet, selected, {
			mode: mode ?? modeFor(loaded, selected),
		});
		this.sheetInspection = inspectSpriteSheet(loaded.sheet, {
			width: loaded.image.naturalWidth || loaded.image.width,
			height: loaded.image.naturalHeight || loaded.image.height,
		});
	}

	getLoadedSheet(): LoadedSheet {
		return this.loaded;
	}

	setSheet(loaded: LoadedSheet, animationName?: string): void {
		this.loaded = loaded;
		const selected = defaultAnimationName(loaded, animationName);
		this.playback = createSpriteAnimationPlayback(loaded.sheet, selected, {
			mode: modeFor(loaded, selected),
			speed: this.playback.speed,
		});
		this.sheetInspection = inspectSpriteSheet(loaded.sheet, {
			width: loaded.image.naturalWidth || loaded.image.width,
			height: loaded.image.naturalHeight || loaded.image.height,
		});
		this.clearEventLog();
	}

	selectAnimation(animationName: string): void {
		if (!this.loaded.sheet.animations[animationName]) {
			throw new Error(`Unknown sprite animation: ${this.loaded.sheet.id}:${animationName}`);
		}
		this.playback = createSpriteAnimationPlayback(this.loaded.sheet, animationName, {
			mode: modeFor(this.loaded, animationName),
			speed: this.playback.speed,
			paused: this.playback.clock.paused,
			playing: this.playback.clock.playing,
		});
		this.clearEventLog();
	}

	setMode(mode: SpriteInspectorMode): void {
		const progress = getSpriteAnimationProgress(this.playback, this.loaded.sheet);
		const wasPaused = this.playback.clock.paused;
		const wasPlaying = this.playback.clock.playing;
		this.playback = createSpriteAnimationPlayback(this.loaded.sheet, this.playback.animationName, {
			mode,
			speed: this.playback.speed,
			paused: wasPaused,
			playing: wasPlaying,
		});
		this.playback = seekSpriteAnimationProgress(this.playback, this.loaded.sheet, progress, {
			keepPlaying: wasPlaying,
		});
	}

	setSpeed(speed: number): void {
		this.playback = setSpriteAnimationSpeed(this.playback, speed);
	}

	play(): void {
		this.playback = this.playback.clock.completed
			? createSpriteAnimationPlayback(this.loaded.sheet, this.playback.animationName, {
					mode: this.playback.mode,
					speed: this.playback.speed,
				})
			: resumeSpriteAnimation(this.playback);
	}

	pause(): void {
		this.playback = pauseSpriteAnimation(this.playback);
	}

	togglePlayback(): void {
		if (this.playback.clock.paused || !this.playback.clock.playing) this.play();
		else this.pause();
	}

	restart(): void {
		const paused = this.playback.clock.paused;
		this.playback = createSpriteAnimationPlayback(this.loaded.sheet, this.playback.animationName, {
			mode: this.playback.mode,
			speed: this.playback.speed,
			paused,
			playing: !paused,
		});
		this.clearEventLog();
	}

	seekProgress(progress: number): void {
		this.playback = seekSpriteAnimationProgress(this.playback, this.loaded.sheet, progress);
	}

	stepFrames(offset: number): void {
		const timeline = createSpriteAnimationTimeline(
			this.loaded.sheet,
			this.playback.animationName,
			this.playback.mode
		);
		const progress = getSpriteAnimationProgress(this.playback, this.loaded.sheet);
		const currentSlot = Math.min(
			timeline.frames.length - 1,
			Math.max(0, Math.floor(progress * timeline.frames.length))
		);
		const targetSlot = Math.min(
			timeline.frames.length - 1,
			Math.max(0, currentSlot + Math.trunc(offset))
		);
		this.pause();
		this.seekProgress((targetSlot + 0.001) / timeline.frames.length);
	}

	advance(deltaTime: number): void {
		const step = advanceSpriteAnimation(this.playback, this.loaded.sheet, deltaTime);
		this.playback = step.state;
		for (const event of step.events) {
			this.events.push(
				Object.freeze({
					...event,
					sequence: ++this.eventSequence,
					animationName: this.playback.animationName,
					localFrame: event.frame,
				})
			);
		}
		if (this.events.length > 32) this.events.splice(0, this.events.length - 32);
	}

	clearEventLog(): void {
		this.events = [];
	}

	snapshot(): SpriteInspectorSnapshot {
		const timeline = createSpriteAnimationTimeline(
			this.loaded.sheet,
			this.playback.animationName,
			this.playback.mode
		);
		const progress = getSpriteAnimationProgress(this.playback, this.loaded.sheet);
		const slot = Math.min(
			timeline.frames.length - 1,
			Math.max(0, Math.floor(Math.min(0.999999999, progress) * timeline.frames.length))
		);
		const currentEvents = timeline.frames[slot]?.events ?? [];
		return Object.freeze({
			sheetId: this.loaded.sheet.id,
			animationName: this.playback.animationName,
			mode: this.playback.mode,
			speed: this.playback.speed,
			frame: this.playback.clock.frame,
			direction: this.playback.clock.direction,
			playing: this.playback.clock.playing,
			paused: this.playback.clock.paused,
			completed: this.playback.clock.completed,
			progress,
			address: getSpriteAnimationFrameAddress(this.playback, this.loaded.sheet),
			timeline,
			currentEvents: Object.freeze([...currentEvents]),
			eventLog: Object.freeze([...this.events]),
			sheet: this.sheetInspection,
		});
	}
}
