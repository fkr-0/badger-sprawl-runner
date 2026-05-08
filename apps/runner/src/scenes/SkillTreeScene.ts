/**
 * SkillTreeScene - overlay scene for purchasing skill nodes
 */

import type { Scene } from '../engine/SceneManager';
import type { SceneContext } from '../engine/SceneManager';
import { type SkillTree, createSkillTree } from '@badger/progression';
import { loadMeta, persistMeta, type MetaState } from '@badger/progression';
import type { Renderer } from '../renderer/Renderer';

// Skill tree layout data
const SKILL_TREE_LAYOUT = {
  clawline: [
    { id: 'double_swipe', x: 300, y: 200, prereqs: [] },
    { id: 'parry_tooth', x: 400, y: 280, prereqs: ['double_swipe'] },
    { id: 'claw_rush', x: 500, y: 360, prereqs: ['parry_tooth'] },
  ],
  rail: [
    { id: 'rail_mastery', x: 600, y: 200, prereqs: [] },
    { id: 'piercing_shot', x: 700, y: 280, prereqs: ['rail_mastery'] },
    { id: 'emp_blast', x: 800, y: 360, prereqs: ['piercing_shot'] },
  ],
};

const SKILL_INFO: Record<string, { name: string; cost: number; description: string }> = {
  double_swipe: { name: 'Double Swipe', cost: 1, description: 'First strike deals 50% more damage' },
  parry_tooth: { name: 'Parry Tooth', cost: 2, description: 'Successful parries grant damage buff' },
  claw_rush: { name: 'Claw Rush', cost: 2, description: '+10% movement speed' },
  rail_mastery: { name: 'Rail Mastery', cost: 2, description: '+1 Railgun damage' },
  piercing_shot: { name: 'Piercing Shot', cost: 2, description: 'Railgun shots pierce enemies' },
  emp_blast: { name: 'EMP Blast', cost: 3, description: 'Railgun creates EMP on hit' },
};

export class SkillTreeScene implements Scene {
  readonly name = 'SkillTreeScene';

  private skillTree: SkillTree;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private metaState: MetaState | null = null;
  private renderer: Renderer | null = null;
  private selectedSkill = 'double_swipe';
  private currentTab = 'clawline';
  private message = '';
  private messageTimer = 0;

  constructor() {
    this.skillTree = createSkillTree();
  }

  onEnter(ctx: SceneContext): void {
    console.log('SkillTreeScene entered');
    this.renderer = ctx.renderer as Renderer;
    this.metaState = loadMeta();

    // Load purchased skills
    if (this.metaState) {
      for (const skillId of this.metaState.purchasedSkills) {
        this.skillTree.unlockNode(skillId);
      }
    }

    // Set up keyboard input
    const handleKeyDown = (e: KeyboardEvent): void => {
      switch (e.code) {
        case 'ArrowLeft':
        case 'ArrowRight':
          this.currentTab = this.currentTab === 'clawline' ? 'rail' : 'clawline';
          break;
        case 'ArrowUp':
        case 'ArrowDown':
          this.navigateSkills(e.code === 'ArrowUp' ? -1 : 1);
          break;
        case 'Enter':
        case 'KeyE':
          this.purchaseSkill();
          break;
        case 'Tab':
          // Show skill info
          break;
        case 'Escape':
        case 'KeyQ':
          // Return to hub
          console.log('Close skill tree');
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
    console.log('SkillTree exited');
  }

  update(dt: number): void {
    if (this.messageTimer > 0) {
      this.messageTimer -= dt;
      if (this.messageTimer <= 0) {
        this.message = '';
      }
    }
  }

  render(renderer: unknown, alpha: number): void {
    const rend = renderer as Renderer;
    const ctx = rend.getContext();

    // Semi-transparent background
    ctx.fillStyle = 'rgba(4, 6, 12, 0.85)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Skill tree panel
    this.renderSkillTree(ctx);
  }

  private renderSkillTree(ctx: CanvasRenderingContext2D): void {
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;

    const panelW = 800;
    const panelH = 500;
    const panelX = W / 2 - panelW / 2;
    const panelY = H / 2 - panelH / 2;

    // Background
    ctx.fillStyle = '#1a1d26';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#364457';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    // Title
    ctx.fillStyle = '#67f3c4';
    ctx.font = 'bold 24px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SKILL TREE', W / 2, panelY + 40);

    // Tabs
    this.renderTabs(ctx, panelX, panelY + 60, panelW);

    // Current skill tree
    const layout = SKILL_TREE_LAYOUT[this.currentTab as keyof typeof SKILL_TREE_LAYOUT];
    this.renderTree(ctx, layout, panelX, panelY);

    // Skill info panel
    this.renderSkillInfo(ctx, panelX + panelW - 250, panelY + 350);

    // Currency display
    if (this.metaState) {
      ctx.fillStyle = '#ffb35e';
      ctx.font = '16px ui-monospace, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Blueprint Shards: ${this.metaState.blueprintShards}`, panelX + 20, panelY + panelH - 20);
    }
  }

  private renderTabs(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
    const tabW = w / 2 - 20;

    // Clawline tab
    ctx.fillStyle = this.currentTab === 'clawline' ? '#272b32' : '#12141a';
    ctx.fillRect(x + 10, y, tabW, 30);
    ctx.strokeStyle = this.currentTab === 'clawline' ? '#67f3c4' : '#364457';
    ctx.strokeRect(x + 10, y, tabW, 30);
    ctx.fillStyle = '#eaf2ff';
    ctx.font = '14px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CLAWLINE', x + 10 + tabW / 2, y + 20);

    // Rail tab
    ctx.fillStyle = this.currentTab === 'rail' ? '#272b32' : '#12141a';
    ctx.fillRect(x + w / 2 + 10, y, tabW, 30);
    ctx.strokeStyle = this.currentTab === 'rail' ? '#67f3c4' : '#364457';
    ctx.strokeRect(x + w / 2 + 10, y, tabW, 30);
    ctx.fillStyle = '#eaf2ff';
    ctx.fillText('RAILGUN', x + w / 2 + 10 + tabW / 2, y + 20);
  }

  private renderTree(
    ctx: CanvasRenderingContext2D,
    layout: Array<{ id: string; x: number; y: number; prereqs: string[] }>,
    panelX: number,
    panelY: number
  ): void {
    // Draw connections first
    ctx.strokeStyle = '#364457';
    ctx.lineWidth = 2;
    for (const skill of layout) {
      for (const prereq of skill.prereqs) {
        const prereqSkill = layout.find(s => s.id === prereq);
        if (prereqSkill) {
          ctx.beginPath();
          ctx.moveTo(panelX + prereqSkill.x, panelY + prereqSkill.y);
          ctx.lineTo(panelX + skill.x, panelY + skill.y);
          ctx.stroke();
        }
      }
    }

    // Draw skill nodes
    for (const skill of layout) {
      const node = this.skillTree.getNode(skill.id);
      const isSelected = this.selectedSkill === skill.id;
      const canUnlock = this.skillTree.canUnlock(skill.id);
      const isUnlocked = node?.unlocked ?? false;

      // Node circle
      ctx.beginPath();
      ctx.arc(panelX + skill.x, panelY + skill.y, 25, 0, Math.PI * 2);

      if (isUnlocked) {
        ctx.fillStyle = '#67f3c4';
      } else if (canUnlock) {
        ctx.fillStyle = '#ffb35e';
      } else {
        ctx.fillStyle = '#272b32';
      }
      ctx.fill();

      // Selection highlight
      if (isSelected) {
        ctx.strokeStyle = '#eaf2ff';
        ctx.lineWidth = 3;
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#364457';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Skill icon (letter)
      ctx.fillStyle = isUnlocked ? '#1a1d26' : '#eaf2ff';
      ctx.font = 'bold 16px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(skill.id[0].toUpperCase(), panelX + skill.x, panelY + skill.y);
      ctx.textBaseline = 'alphabetic';
    }
  }

  private renderSkillInfo(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const info = SKILL_INFO[this.selectedSkill];
    if (!info) return;

    const node = this.skillTree.getNode(this.selectedSkill);
    const isUnlocked = node?.unlocked ?? false;
    const canUnlock = this.skillTree.canUnlock(this.selectedSkill);

    // Background
    ctx.fillStyle = '#12141a';
    ctx.fillRect(x, y, 240, 120);
    ctx.strokeStyle = '#364457';
    ctx.strokeRect(x, y, 240, 120);

    // Name
    ctx.fillStyle = '#67f3c4';
    ctx.font = 'bold 16px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(info.name, x + 15, y + 25);

    // Cost
    ctx.fillStyle = isUnlocked ? '#4a4a4a' : '#ffb35e';
    ctx.font = '14px ui-monospace, monospace';
    ctx.fillText(isUnlocked ? 'UNLOCKED' : `Cost: ${info.cost} BP`, x + 15, y + 50);

    // Description
    ctx.fillStyle = '#92a4be';
    ctx.font = '12px ui-monospace, monospace';
    ctx.fillText(info.description, x + 15, y + 80);

    // Status
    if (isUnlocked) {
      ctx.fillStyle = '#67f3c4';
      ctx.fillText('✓ Learned', x + 15, y + 105);
    } else if (canUnlock) {
      ctx.fillStyle = '#ffb35e';
      ctx.fillText('Press ENTER to unlock', x + 15, y + 105);
    } else {
      ctx.fillStyle = '#4a4a4a';
      ctx.fillText('Locked (requires prerequisites)', x + 15, y + 105);
    }
  }

  private navigateSkills(direction: number): void {
    const layout = SKILL_TREE_LAYOUT[this.currentTab as keyof typeof SKILL_TREE_LAYOUT];
    const currentIndex = layout.findIndex(s => s.id === this.selectedSkill);
    let newIndex = currentIndex + direction;

    // Wrap around
    if (newIndex < 0) newIndex = layout.length - 1;
    if (newIndex >= layout.length) newIndex = 0;

    this.selectedSkill = layout[newIndex].id;
  }

  private purchaseSkill(): void {
    if (this.skillTree.unlockNode(this.selectedSkill)) {
      // Save to meta state
      if (this.metaState) {
        this.metaState.purchasedSkills.push(this.selectedSkill);
        persistMeta(this.metaState);
      }
      this.showMessage(`Unlocked ${SKILL_INFO[this.selectedSkill].name}!`);
    } else {
      this.showMessage('Cannot unlock this skill');
    }
  }

  private showMessage(text: string): void {
    this.message = text;
    this.messageTimer = 2;
  }
}
