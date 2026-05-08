/**
 * ShopScene - overlay scene for purchasing items
 */

import type { Scene } from '../engine/SceneManager';
import type { SceneContext } from '../engine/SceneManager';
import { ShopEngine } from '@badger/progression';
import { loadMeta, persistMeta, type MetaState } from '@badger/progression';
import type { Renderer } from '../renderer/Renderer';

// Sample items for the shop
const SHOP_ITEMS = [
  { id: 'stim_pack', name: 'Stim Pack', price: 50, rarity: 'common', tags: ['consumable'] },
  { id: 'bandages', name: 'Bandages', price: 30, rarity: 'common', tags: ['consumable'] },
  { id: 'rocket_ammo', name: 'Rocket Fuel', price: 75, rarity: 'common', tags: ['ammo'] },
  { id: 'rail_upgrade', name: 'Rail Mod: Damage', price: 200, rarity: 'rare', tags: ['upgrade'] },
  { id: 'health_boost', name: 'Vigor Boost', price: 150, rarity: 'rare', tags: ['permanent'] },
];

export class ShopScene implements Scene {
  readonly name = 'ShopScene';

  private shopEngine: ShopEngine;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private metaState: MetaState | null = null;
  private renderer: Renderer | null = null;
  private selectedItem = 0;
  private message = '';
  private messageTimer = 0;

  constructor() {
    this.shopEngine = new ShopEngine();
  }

  onEnter(ctx: SceneContext): void {
    console.log('ShopScene entered');
    this.renderer = ctx.renderer as Renderer;
    this.metaState = loadMeta();

    // Set up keyboard input
    const handleKeyDown = (e: KeyboardEvent): void => {
      switch (e.code) {
        case 'ArrowUp':
          this.selectedItem = Math.max(0, this.selectedItem - 1);
          break;
        case 'ArrowDown':
          this.selectedItem = Math.min(SHOP_ITEMS.length - 1, this.selectedItem + 1);
          break;
        case 'Enter':
        case 'KeyE':
          this.purchaseItem();
          break;
        case 'Escape':
        case 'KeyQ':
          // Return to hub - would use SceneManager
          console.log('Close shop');
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
    console.log('ShopScene exited');
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

    // Shop panel
    this.renderShop(ctx);
  }

  private renderShop(ctx: CanvasRenderingContext2D): void {
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;

    const panelW = 500;
    const panelH = 400;
    const panelX = W / 2 - panelW / 2;
    const panelY = H / 2 - panelH / 2;

    // Shop background
    ctx.fillStyle = '#1a1d26';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#364457';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    // Title
    ctx.fillStyle = '#67f3c4';
    ctx.font = 'bold 24px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MURR MURRBY SHOP', W / 2, panelY + 40);

    // Currency display
    if (this.metaState) {
      ctx.fillStyle = '#ffb35e';
      ctx.font = '16px ui-monospace, monospace';
      ctx.fillText(`Credchips: ${this.metaState.credchips}`, W / 2, panelY + 70);
    }

    // Item list
    let y = panelY + 110;
    for (let i = 0; i < SHOP_ITEMS.length; i++) {
      const item = SHOP_ITEMS[i];
      const isSelected = i === this.selectedItem;
      const canAfford = this.metaState && this.metaState.credchips >= item.price;

      // Highlight selected item
      if (isSelected) {
        ctx.fillStyle = 'rgba(103, 243, 196, 0.1)';
        ctx.fillRect(panelX + 20, y - 20, panelW - 40, 45);
      }

      // Item name
      ctx.fillStyle = isSelected ? '#67f3c4' : canAfford ? '#eaf2ff' : '#4a4a4a';
      ctx.font = '16px ui-monospace, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(item.name, panelX + 40, y);

      // Price
      ctx.textAlign = 'right';
      ctx.fillStyle = canAfford ? '#ffb35e' : '#4a4a4a';
      ctx.fillText(`${item.price} CC`, panelX + panelW - 40, y);

      // Rarity indicator
      ctx.textAlign = 'left';
      ctx.fillStyle = item.rarity === 'rare' ? '#ff5e7a' : '#92a4be';
      ctx.font = '12px ui-monospace, monospace';
      ctx.fillText(item.rarity.toUpperCase(), panelX + 40, y + 18);

      y += 50;
    }

    // Instructions
    ctx.textAlign = 'center';
    ctx.fillStyle = '#92a4be';
    ctx.font = '14px ui-monospace, monospace';
    ctx.fillText('Arrow keys to select | Enter to purchase | ESC to close', W / 2, panelY + panelH - 20);

    // Message display
    if (this.message) {
      ctx.fillStyle = 'rgba(4, 6, 12, 0.9)';
      ctx.fillRect(W / 2 - 150, H / 2 + 30, 300, 40);
      ctx.fillStyle = '#ffb35e';
      ctx.font = '16px ui-monospace, monospace';
      ctx.fillText(this.message, W / 2, H / 2 + 55);
    }
  }

  private purchaseItem(): void {
    const item = SHOP_ITEMS[this.selectedItem];
    if (!this.metaState) {
      this.showMessage('No save data!');
      return;
    }

    if (this.metaState.credchips >= item.price) {
      this.metaState.credchips -= item.price;
      persistMeta(this.metaState);
      this.showMessage(`Purchased ${item.name}!`);
    } else {
      this.showMessage('Not enough credchips!');
    }
  }

  private showMessage(text: string): void {
    this.message = text;
    this.messageTimer = 2;
  }
}
