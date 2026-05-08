/**
 * AudioManager - Web Audio API context and sound management
 */

type WindowWithWebkitAudio = Window & { webkitAudioContext?: typeof AudioContext };

export class AudioManager {
	private ctx: AudioContext | null = null;
	private masterGain: GainNode | null = null;
	private musicGain: GainNode | null = null;
	private sfxGain: GainNode | null = null;
	private musicBuffer: AudioBuffer | null = null;
	private musicSource: AudioBufferSourceNode | null = null;
	private isPlaying = false;

	async init(): Promise<void> {
		if (this.ctx) return;

		const AudioContextCtor =
			window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;
		if (!AudioContextCtor) {
			throw new Error('Web Audio API is not available in this browser.');
		}

		this.ctx = new AudioContextCtor();
		this.masterGain = this.ctx.createGain();
		this.masterGain.gain.value = 0.8;
		this.masterGain.connect(this.ctx.destination);

		this.musicGain = this.ctx.createGain();
		this.musicGain.gain.value = 0.6;
		this.musicGain.connect(this.masterGain);

		this.sfxGain = this.ctx.createGain();
		this.sfxGain.gain.value = 0.8;
		this.sfxGain.connect(this.masterGain);
	}

	getContext(): AudioContext | null {
		return this.ctx;
	}

	setMasterVolume(volume: number): void {
		if (this.masterGain) {
			this.masterGain.gain.value = volume;
		}
	}

	setMusicVolume(volume: number): void {
		if (this.musicGain) {
			this.musicGain.gain.value = volume;
		}
	}

	setSFXVolume(volume: number): void {
		if (this.sfxGain) {
			this.sfxGain.gain.value = volume;
		}
	}

	async playMusic(url: string, loop = true): Promise<void> {
		if (!this.ctx) await this.init();
		const ctx = this.ctx;
		const musicGain = this.musicGain;
		if (!ctx || !musicGain) return;

		try {
			const response = await fetch(url);
			const arrayBuffer = await response.arrayBuffer();
			this.musicBuffer = await ctx.decodeAudioData(arrayBuffer);

			if (this.musicSource) {
				this.musicSource.stop();
			}

			this.musicSource = ctx.createBufferSource();
			this.musicSource.buffer = this.musicBuffer;
			this.musicSource.loop = loop;
			this.musicSource.connect(musicGain);
			this.musicSource.start();
			this.isPlaying = true;
		} catch (e) {
			console.error('Failed to load music:', e);
		}
	}

	stopMusic(): void {
		if (this.musicSource) {
			this.musicSource.stop();
			this.musicSource = null;
			this.isPlaying = false;
		}
	}

	playSFX(url: string): void {
		const ctx = this.ctx;
		const sfxGain = this.sfxGain;
		if (!ctx || !sfxGain) return;

		fetch(url)
			.then((response) => response.arrayBuffer())
			.then((arrayBuffer) => ctx.decodeAudioData(arrayBuffer))
			.then((audioBuffer) => {
				const source = ctx.createBufferSource();
				source.buffer = audioBuffer;
				source.connect(sfxGain);
				source.start();
			})
			.catch((e) => console.error('Failed to play SFX:', e));
	}

	pause(): void {
		if (this.ctx) {
			this.ctx.suspend();
		}
	}

	resume(): void {
		if (this.ctx) {
			this.ctx.resume();
		}
	}

	isMusicPlaying(): boolean {
		return this.isPlaying;
	}
}
