/**
 * TrainingScene - practice mode with invincible dummy and debug overlays
 */

import type { Scene } from '../engine/SceneManager';
import type { SceneContext } from '../engine/SceneManager';
import { InputSystem } from '../systems/InputSystem';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { CameraSystem } from '../systems/CameraSystem';
import { DebugOverlaySystem } from '../systems/DebugOverlaySystem';
import { createPlayer, processMossInput, type Player } from '../actors/MossBadger';
import { createTrainingDummy, processTrainingDummy, hitTrainingDummy, type TrainingDummy } from '../actors/TrainingDummy';
import { debugFlags, debugKeyBindings, toggleDebugFlag } from '../engine/DebugFlags';
import type { Renderer } from '../renderer/Renderer';

const TRAINING_ARENA_WIDTH = 1400;

export class TrainingScene implements Scene {
  readonly name = 'TrainingScene';

  private input = new InputSystem();
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private physics = new PhysicsSystem();
  private combat = new CombatSystem();
  private camera = new CameraSystem();
  private debugOverlay = new DebugOverlaySystem();

  private player: Player;
  private dummy: TrainingDummy;
  private platforms: Array<{ x: number; y: number; w: number; h: number }> = [];
  private renderer: Renderer | null = null;

  private lastResetTime = 0;

  constructor() {
    this.player = createPlayer();
    this.dummy = createTrainingDummy(600, 420);
    this.initArena();
  }

  onEnter(ctx: SceneContext): void {
    console.log('TrainingScene entered');
    this.renderer = ctx.renderer as Renderer;

    // Set up debug key listener
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.code in debugKeyBindings) {
        toggleDebugFlag(debugKeyBindings[e.code]);
        e.preventDefault();
      }

      // Reset positions with R
      if (e.code === 'KeyR') {
        this.resetPositions();
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Store cleanup function
    this.keyHandler = handleKeyDown;
  }

  onExit(): void {
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
    console.log('TrainingScene exited');
  }

  update(dt: number): void {
    const action = this.input.snapshot();

    // Apply debug flags
    if (debugFlags.invinciblePlayer) {
      this.player.hp = this.player.maxHp;
    }
    if (debugFlags.infiniteFuel && this.player.hasRocket) {
      this.player.fuel = this.player.maxFuel;
    }

    // Physics
    this.physics.step(this.player, this.platforms, action, dt);

    // Combat with special dummy handling
    const combatResult = this.combat.getLastAction();
    if (combatResult?.kind === 'melee') {
      const now = Date.now();
      if (now - combatResult.time < 100) {
        // Check if melee hits dummy
        const dx = Math.abs(this.player.x - this.dummy.x);
        const dy = Math.abs(this.player.y - this.dummy.y);
        if (dx < 80 && dy < 60) {
          hitTrainingDummy(this.dummy);
          this.debugOverlay.recordDamage(this.player.combo === 'katana' ? 2 : 1);
          this.debugOverlay.recordMeleeActive();
        }
      }
    }

    // Process dummy
    processTrainingDummy(this.dummy, dt);

    // Player input
    processMossInput(this.player, action, dt, this.combat);

    // Camera
    this.camera.step(this.player.x, 0, TRAINING_ARENA_WIDTH, dt);

    // Update VFX
    if (this.renderer) {
      this.renderer.updateVFX(dt);
    }

    this.input.clearPressed();
  }

  render(renderer: unknown, alpha: number): void {
    const rend = renderer as Renderer;
    const cam = this.camera.getState();

    // Render scene
    rend.clear();
    rend.drawBackground();

    // Draw training arena floor
    const ctx = rend.getContext();
    ctx.fillStyle = '#1a1d26';
    ctx.fillRect(0 - cam.x, 480, TRAINING_ARENA_WIDTH, 120);

    // Draw training grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < TRAINING_ARENA_WIDTH; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x - cam.x, 480);
      ctx.lineTo(x - cam.x, 600);
      ctx.stroke();
    }

    // Draw platforms
    for (const p of this.platforms) {
      ctx.fillStyle = '#272b32';
      ctx.fillRect(p.x - cam.x, p.y, p.w, p.h);
    }

    // Draw dummy
    this.renderDummy(ctx, cam.x);

    // Draw player
    rend.renderPlayer(this.player, cam.x);

    // Draw VFX
    rend.renderVFX(cam.x);

    // Draw debug overlays
    this.debugOverlay.render(
      ctx,
      [this.player, this.dummy],
      cam,
      [this.player, this.dummy],
      [this.dummy]
    );

    // Draw training mode info
    this.renderTrainingInfo(ctx);
  }

  private renderDummy(ctx: CanvasRenderingContext2D, cameraX: number): void {
    const x = this.dummy.x - cameraX;
    const y = this.dummy.y;

    ctx.save();

    // Flash effect when hit
    if (this.dummy.flashtimer > 0) {
      ctx.fillStyle = '#ffb35e';
    } else {
      ctx.fillStyle = '#4a4a4a';
    }

    // Body
    ctx.fillRect(x, y, this.dummy.w, this.dummy.h);

    // Dummy indicator
    ctx.fillStyle = '#67f3c4';
    ctx.font = 'bold 20px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TARGET', x + this.dummy.w / 2, y - 15);
    ctx.font = '14px ui-monospace, monospace';
    ctx.fillStyle = '#92a4be';
    ctx.fillText('∞ HP', x + this.dummy.w / 2, y + this.dummy.h + 20);

    // Stun indicator
    if (this.dummy.stun > 0) {
      ctx.fillStyle = '#ffb35e';
      ctx.fillText('STUN', x + this.dummy.w / 2, y + this.dummy.h / 2);
    }

    ctx.restore();
  }

  private renderTrainingInfo(ctx: CanvasRenderingContext2D): void {
    const padding = 16;
    let y = 140;

    // Help panel
    ctx.fillStyle = 'rgba(4, 6, 12, 0.85)';
    ctx.fillRect(padding, padding, 320, 120);

    ctx.fillStyle = '#67f3c4';
    ctx.font = 'bold 14px ui-monospace, monospace';
    ctx.fillText('TRAINING MODE', padding + 16, y);
    y += 24;

    ctx.fillStyle = '#eaf2ff';
    ctx.font = '12px ui-monospace, monospace';
    ctx.fillText('WASD/Arrows - Move | Space - Jump', padding + 16, y);
    y += 18;
    ctx.fillText('J - Melee | K - Shoot | L - Parry', padding + 16, y);
    y += 18;
    ctx.fillText('Shift - Dodge | R - Reset Positions', padding + 16, y);
    y += 18;
    ctx.fillText('H/U/F - Toggle Hitbox/Hurtbox/Frame Data', padding + 16, y);
    y += 18;
    ctx.fillText('I - Invincible | F2 - Infinite Fuel', padding + 16, y);
  }

  private initArena(): void {
    this.platforms = [
      { x: 200, y: 380, w: 120, h: 18 },
      { x: 400, y: 320, w: 100, h: 18 },
      { x: 800, y: 350, w: 150, h: 18 },
      { x: 1000, y: 400, w: 120, h: 18 },
    ];
  }

  private resetPositions(): void {
    this.player.x = 100;
    this.player.y = 400;
    this.player.vx = 0;
    this.player.vy = 0;
    this.dummy.x = 600;
    this.dummy.y = 420;
    this.dummy.vx = 0;
    this.dummy.stun = 0;
    this.lastResetTime = Date.now();
  }
}
