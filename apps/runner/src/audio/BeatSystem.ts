/**
 * BeatSystem - fires downbeat events and syncs mechanics to the beat
 */

import { BeatClock } from './BeatClock';
import type { EventBus } from '../engine/EventBus';

export class BeatSystem {
  private lastBeat = 0;

  constructor(private beatClock: BeatClock, private eventBus: EventBus) {}

  step(dt: number): void {
    const currentBeat = this.beatClock.currentBeat();
    const beat = Math.floor(currentBeat);

    if (beat > this.lastBeat) {
      this.lastBeat = beat;
      this.eventBus.emit('downbeat' as never, { beat });
    }
  }
}
