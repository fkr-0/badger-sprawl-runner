/**
 * ResultsScene - shows run results and rewards
 */

import type { Scene } from '../engine/SceneManager';
import type { SceneContext } from '../engine/SceneManager';
import type { Renderer } from '../renderer/Renderer';
import type { RunResult } from '@badger/progression';

export class ResultsScene implements Scene {
  readonly name = 'ResultsScene';

  private results: RunResult | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private renderer: Renderer | null = null;

  onEnter(ctx: SceneContext): void {
    console.log('ResultsScene entered');
    this.renderer = ctx.renderer as Renderer;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.code === 'Enter' || e.code === 'Space' || e.code === 'Escape') {
        this.returnToHub();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    this.keyHandler = handleKeyDown;
  }

  onExit(): void {
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
    console.log('ResultsScene exited');
  }

  update(dt: number): void {
    // Results logic
  }

  render(renderer: unknown, alpha: number): void {
    const rend = renderer as Renderer;
    const ctx = rend.getContext();

    // Darken background
    ctx.fillStyle = 'rgba(4, 6, 12, 0.9)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (!this.results) return;

    this.renderResults(ctx);
  }

  private renderResults(ctx: CanvasRenderingContext2D): void {
    if (!this.results) return;

    const W = ctx.canvas.width;
    const H = ctx.canvas.height;

    // Title
    const victory = this.results.damageDealt > 100;
    ctx.fillStyle = victory ? '#67f3c4' : '#ff5e7a';
    ctx.font = 'bold 36px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(victory ? 'MISSION COMPLETE' : 'DEFEATED', W / 2, H / 4);

    // Stats
    const stats = [
      { label: 'Damage Dealt', value: this.results.damageDealt.toString() },
      { label: 'Damage Taken', value: this.results.damageTaken.toString() },
      { label: 'Heat Gained', value: this.results.heatGained.toString() },
      { label: 'Time Alive', value: this.formatTime(this.results.timeAlive) },
      { label: 'Loot Found', value: this.results.lootCollected.length.toString() },
    ];

    let y = H / 3 + 30;
    ctx.font = '16px ui-monospace, monospace';
    ctx.textAlign = 'left';

    for (const stat of stats) {
      ctx.fillStyle = '#92a4be';
      ctx.fillText(stat.label + ':', W / 2 - 100, y);
      ctx.fillStyle = '#eaf2ff';
      ctx.textAlign = 'right';
      ctx.fillText(stat.value, W / 2 + 100, y);
      ctx.textAlign = 'left';
      y += 30;
    }

    // Rewards
    y += 20;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffb35e';
    ctx.font = 'bold 18px ui-monospace, monospace';
    ctx.fillText('REWARDS', W / 2, y);
    y += 30;

    ctx.fillStyle = '#eaf2ff';
    ctx.font = '16px ui-monospace, monospace';
    ctx.fillText(`${this.results.rewards.credchips} Credchips`, W / 2, y);
    y += 25;
    ctx.fillText(`${this.results.rewards.blueprintShards} Blueprint Shards`, W / 2, y);
    y += 25;
    ctx.fillText(`${this.results.rewards.dubFavor} Dub Favor`, W / 2, y);

    // Instructions
    ctx.fillStyle = '#4a4a4a';
    ctx.font = '14px ui-monospace, monospace';
    ctx.fillText('Press ENTER to return to Colony Hub', W / 2, H - 50);
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  setResults(results: RunResult): void {
    this.results = results;
  }

  returnToHub(): void {
    console.log('Returning to hub with rewards:', this.results?.rewards);
    // Would use SceneManager to transition to ColonyHubScene
  }
}
