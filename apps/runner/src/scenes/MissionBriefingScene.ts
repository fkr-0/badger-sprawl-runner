/**
 * MissionBriefingScene - shows mission objectives before stage
 */

import type { Scene } from '../engine/SceneManager';
import type { SceneContext } from '../engine/SceneManager';
import type { Renderer } from '../renderer/Renderer';

export interface MissionBriefing {
  world: number;
  stage: number;
  title: string;
  objectives: string[];
  rewards: string[];
}

export class MissionBriefingScene implements Scene {
  readonly name = 'MissionBriefingScene';

  private briefing: MissionBriefing | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private renderer: Renderer | null = null;

  onEnter(ctx: SceneContext): void {
    console.log('MissionBriefingScene entered');
    this.renderer = ctx.renderer as Renderer;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.code === 'Enter' || e.code === 'Space' || e.code === 'Escape') {
        this.startMission();
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
    console.log('MissionBriefingScene exited');
  }

  update(dt: number): void {
    // Briefing is static
  }

  render(renderer: unknown, alpha: number): void {
    const rend = renderer as Renderer;
    const ctx = rend.getContext();

    // Dim background
    ctx.fillStyle = 'rgba(4, 6, 12, 0.9)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (!this.briefing) return;

    this.renderBriefing(ctx);
  }

  private renderBriefing(ctx: CanvasRenderingContext2D): void {
    if (!this.briefing) return;

    const W = ctx.canvas.width;
    const H = ctx.canvas.height;

    // Title card
    ctx.fillStyle = '#67f3c4';
    ctx.font = 'bold 36px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`WORLD ${this.briefing.world} - ${this.briefing.stage}`, W / 2, H / 3);
    ctx.fillText(this.briefing.title, W / 2, H / 3 + 50);

    // Objectives
    ctx.fillStyle = '#ffb35e';
    ctx.font = '20px ui-monospace, monospace';
    ctx.fillText('OBJECTIVES', W / 2, H / 2 + 20);

    ctx.fillStyle = '#eaf2ff';
    ctx.font = '16px ui-monospace, monospace';
    let y = H / 2 + 60;
    for (const obj of this.briefing.objectives) {
      ctx.fillText(`• ${obj}`, W / 2, y);
      y += 30;
    }

    // Rewards
    y += 20;
    ctx.fillStyle = '#67f3c4';
    ctx.font = '18px ui-monospace, monospace';
    ctx.fillText('REWARDS', W / 2, y);
    y += 30;

    ctx.fillStyle = '#92a4be';
    ctx.font = '14px ui-monospace, monospace';
    for (const reward of this.briefing.rewards) {
      ctx.fillText(`• ${reward}`, W / 2, y);
      y += 25;
    }

    // Instructions
    ctx.fillStyle = '#4a4a4a';
    ctx.font = '14px ui-monospace, monospace';
    ctx.fillText('Press ENTER to start mission', W / 2, H - 50);
  }

  setBriefing(briefing: MissionBriefing): void {
    this.briefing = briefing;
  }

  startMission(): void {
    console.log('Starting mission:', this.briefing);
    // Would use SceneManager to transition to StageRunScene
  }
}
