/**
 * TitleScene - main menu scene
 */

import type { Scene } from '../engine/SceneManager';
import type { SceneContext } from '../engine/SceneManager';
import type { Renderer } from '../renderer/Renderer';

export class TitleScene implements Scene {
  readonly name = 'TitleScene';

  private renderer: Renderer | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private selectedOption = 0;
  private menuOptions = [
    { id: 'start', name: 'Start Game' },
    { id: 'profile', name: 'Select Profile' },
    { id: 'training', name: 'Training Mode' },
    { id: 'horde', name: 'Horde Mode' },
  ];

  onEnter(ctx: SceneContext): void {
    console.log('TitleScene entered');
    this.renderer = ctx.renderer as Renderer;

    const handleKeyDown = (e: KeyboardEvent): void => {
      switch (e.code) {
        case 'ArrowUp':
          this.selectedOption = Math.max(0, this.selectedOption - 1);
          break;
        case 'ArrowDown':
          this.selectedOption = Math.min(this.menuOptions.length - 1, this.selectedOption + 1);
          break;
        case 'Enter':
        case 'Space':
          this.selectOption();
          break;
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
    console.log('TitleScene exited');
  }

  update(dt: number): void {
    // Title screen animation
  }

  render(renderer: unknown, alpha: number): void {
    const rend = renderer as Renderer;
    const ctx = rend.getContext();

    // Background with parallax
    rend.drawBackground();

    // Render title
    this.renderTitle(ctx);
  }

  private renderTitle(ctx: CanvasRenderingContext2D): void {
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;

    // Game title
    ctx.fillStyle = '#eaf2ff';
    ctx.font = 'bold 48px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BADGER', W / 2, H / 3);
    ctx.fillText('SPRAWL RUNNER', W / 2, H / 3 + 50);

    // Subtitle
    ctx.fillStyle = '#67f3c4';
    ctx.font = '18px ui-monospace, monospace';
    ctx.fillText('A Cyber-Platformer Adventure', W / 2, H / 3 + 100);

    // Menu
    let y = H / 2 + 50;
    for (let i = 0; i < this.menuOptions.length; i++) {
      const option = this.menuOptions[i];
      const isSelected = i === this.selectedOption;

      if (isSelected) {
        ctx.fillStyle = '#ffb35e';
        ctx.fillText(`> ${option.name}`, W / 2, y);
      } else {
        ctx.fillStyle = '#92a4be';
        ctx.fillText('  ' + option.name, W / 2, y);
      }

      y += 40;
    }

    // Footer
    ctx.fillStyle = '#4a4a4a';
    ctx.font = '14px ui-monospace, monospace';
    ctx.fillText('Arrow keys to navigate | Enter to select', W / 2, H - 50);
  }

  private selectOption(): void {
    const option = this.menuOptions[this.selectedOption];
    console.log('Selected:', option.id);
    // Would use SceneManager to navigate
  }
}
