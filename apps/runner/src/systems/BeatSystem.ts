/**
 * BeatSystem - emits beat events and manages beat-synced mechanics
 */

import { BeatClock } from '../audio/BeatClock';
import type { EventBus } from '../engine/EventBus';

export interface BeatEvent {
  kind: 'downbeat' | 'upbeat' | 'beat';
  beatNumber: number;
  time: number;
}

export class BeatSystem {
  private beatClock: BeatClock;
  private lastBeat = -1;
  private bassPlatforms: Array<{ x: number; y: number; baseY: number; pulseAmp: number; activated: boolean }> = [];

  constructor(private eventBus?: EventBus) {
    this.beatClock = new BeatClock(140); // Default 140 BPM dub
  }

  init(audioCtx: AudioContext): void {
    this.beatClock.setAudioContext(audioCtx);
    this.beatClock.start();
  }

  step(dt: number): void {
    this.beatClock.checkDownbeat();

    const currentBeat = Math.floor(this.beatClock.currentBeat());
    if (currentBeat > this.lastBeat) {
      this.lastBeat = currentBeat;

      // Emit downbeat event
      const event: BeatEvent = {
        kind: 'downbeat',
        beatNumber: currentBeat,
        time: this.beatClock.getCurrentTime(),
      };

      if (this.eventBus) {
        this.eventBus.emit('downbeat', event);
      }

      // Activate bass platforms briefly
      this.activateBassPlatforms();
    }

    // Update bass platforms
    this.updateBassPlatforms(dt);
  }

  private activateBassPlatforms(): void {
    for (const platform of this.bassPlatforms) {
      platform.activated = true;
    }
  }

  private updateBassPlatforms(dt: number): void {
    for (const platform of this.bassPlatforms) {
      if (platform.activated) {
        // Pulse effect
        setTimeout(() => {
          platform.activated = false;
        }, 120);
      }
    }
  }

  registerBassPlatform(
    x: number,
    y: number,
    baseY: number,
    pulseAmp: number
  ): void {
    this.bassPlatforms.push({ x, y, baseY, pulseAmp, activated: false });
  }

  isInDownbeatWindow(windowMs: number = 80): boolean {
    return this.beatClock.isInDownbeatWindow(windowMs);
  }

  getBeatClock(): BeatClock {
    return this.beatClock;
  }

  getBassPlatforms(): Array<{ x: number; y: number; baseY: number; pulseAmp: number; activated: boolean }> {
    return this.bassPlatforms;
  }

  setBPM(bpm: number): void {
    this.beatClock.setBPM(bpm);
  }

  getBPM(): number {
    return this.beatClock.getBPM();
  }
}
