/**
 * Fixed timestep game loop with RAF accumulator
 * Ensures deterministic physics regardless of frame rate
 */

export type UpdateFn = (dt: number) => void;
export type RenderFn = (alpha: number) => void;

const FIXED_STEP = 1 / 60; // 16.67ms

export class GameLoop {
  private last = 0;
  private accumulator = 0;
  private running = false;
  private rafId: number | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private update: UpdateFn,
    private render: RenderFn
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.rafId = requestAnimationFrame(this.tick.bind(this));
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private tick(now: number): void {
    if (!this.running) return;

    const rawDt = Math.min(0.1, (now - this.last) / 1000); // Cap at 100ms
    this.last = now;
    this.accumulator += rawDt;

    while (this.accumulator >= FIXED_STEP) {
      this.update(FIXED_STEP);
      this.accumulator -= FIXED_STEP;
    }

    const alpha = this.accumulator / FIXED_STEP;
    this.render(alpha);

    this.rafId = requestAnimationFrame(this.tick.bind(this));
  }
}
