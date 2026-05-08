/**
 * BeatClock - BPM → downbeat time source for beat-synced mechanics
 */

export class BeatClock {
	private bpm: number;
	private startTime = 0;
	private audioCtx: AudioContext | null = null;
	private subscribers: Array<(beatNumber: number) => void> = [];

	constructor(bpm = 140) {
		this.bpm = bpm;
	}

	setAudioContext(ctx: AudioContext): void {
		this.audioCtx = ctx;
		this.startTime = ctx.currentTime;
	}

	start(): void {
		if (this.audioCtx) {
			this.startTime = this.audioCtx.currentTime;
		} else {
			this.startTime = Date.now() / 1000;
		}
	}

	getCurrentTime(): number {
		if (this.audioCtx) {
			return this.audioCtx.currentTime - this.startTime;
		}
		return Date.now() / 1000 - this.startTime;
	}

	currentBeat(): number {
		return this.getCurrentTime() * (this.bpm / 60);
	}

	nextDownbeatTime(): number {
		const beat = this.currentBeat();
		const nextBeat = Math.ceil(beat);
		return (nextBeat - beat) / (this.bpm / 60);
	}

	isInDownbeatWindow(windowMs = 80): boolean {
		const nextDownbeat = this.nextDownbeatTime();
		const nextDownbeatMs = nextDownbeat * 1000;

		// Check if we're within windowMs of next downbeat or previous downbeat
		const prevDownbeatMs = (60 / this.bpm) * 1000 - nextDownbeatMs;

		return nextDownbeatMs < windowMs || prevDownbeatMs < windowMs;
	}

	onDownbeat(callback: (beatNumber: number) => void): () => void {
		this.subscribers.push(callback);

		// Return unsubscribe function
		return () => {
			const index = this.subscribers.indexOf(callback);
			if (index !== -1) {
				this.subscribers.splice(index, 1);
			}
		};
	}

	private lastBeat = -1;
	checkDownbeat(): void {
		const beat = Math.floor(this.currentBeat());
		if (beat > this.lastBeat) {
			this.lastBeat = beat;
			// Notify subscribers
			for (const sub of this.subscribers) {
				sub(beat);
			}
		}
	}

	getBPM(): number {
		return this.bpm;
	}

	setBPM(bpm: number): void {
		this.bpm = bpm;
	}
}
