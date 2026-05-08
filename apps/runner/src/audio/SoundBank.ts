/**
 * SoundBank - loads and caches audio buffers by id
 */

export class SoundBank {
	private sounds = new Map<string, AudioBuffer>();
	private ctx: AudioContext | null = null;

	constructor(audioCtx?: AudioContext) {
		if (audioCtx) {
			this.ctx = audioCtx;
		}
	}

	setContext(ctx: AudioContext): void {
		this.ctx = ctx;
	}

	async load(id: string, url: string): Promise<void> {
		if (this.sounds.has(id)) return; // Already loaded

		if (!this.ctx) {
			console.warn('AudioContext not set');
			return;
		}

		try {
			const response = await fetch(url);
			const arrayBuffer = await response.arrayBuffer();
			const buffer = await this.ctx.decodeAudioData(arrayBuffer);
			this.sounds.set(id, buffer);
		} catch (e) {
			console.error(`Failed to load sound ${id}:`, e);
		}
	}

	get(id: string): AudioBuffer | undefined {
		return this.sounds.get(id);
	}

	has(id: string): boolean {
		return this.sounds.has(id);
	}

	play(id: string, volume = 1, destination?: AudioNode): void {
		const buffer = this.sounds.get(id);
		if (!buffer || !this.ctx) return;

		const source = this.ctx.createBufferSource();
		source.buffer = buffer;

		const gain = this.ctx.createGain();
		gain.gain.value = volume;

		source.connect(gain);
		gain.connect(destination || this.ctx.destination);
		source.start();
	}

	clear(): void {
		this.sounds.clear();
	}
}
