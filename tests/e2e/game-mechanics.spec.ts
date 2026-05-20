/**
 * E2E Tests for Badger Sprawl Runner Game Mechanics
 * Tests platforming physics, combat, and core game systems
 */

import { test, expect } from '@playwright/test';

test.describe('Game Initialization', () => {
  test('should load the game canvas', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('#game');
    await expect(canvas).toBeVisible();
  });

  test('should display initial status message', async ({ page }) => {
    await page.goto('/');
    const status = page.locator('#status');
    await expect(status).toContainText('Reach the green relay');
  });

  test('should have game controls working', async ({ page }) => {
    await page.goto('/');
    // Test that canvas is focused and ready for input
    const canvas = page.locator('#game');
    await canvas.click();
    await expect(canvas).toBeFocused();
  });
});

test.describe('Platforming Physics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Give the game a moment to initialize
    await page.waitForTimeout(100);
  });

  test('player should spawn at starting position', async ({ page }) => {
    // Check that player exists in game state
    const playerExists = await page.evaluate(() => {
      return typeof window.player !== 'undefined';
    });
    expect(playerExists).toBeTruthy();
  });

  test('player should respond to movement keys', async ({ page }) => {
    const canvas = page.locator('#game');
    await canvas.click();

    // Press right movement key
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);

    // Check player moved
    const playerX = await page.evaluate(() => window.player.x);
    expect(playerX).toBeGreaterThan(60); // Started at x: 60
  });

  test('player should jump when space is pressed', async ({ page }) => {
    const canvas = page.locator('#game');
    await canvas.click();

    const initialY = await page.evaluate(() => window.player.y);

    // Press jump key
    await page.keyboard.press('Space');
    await page.waitForTimeout(50);

    // Player should be in air (moving upward or at least jumped)
    const vy = await page.evaluate(() => window.player.vy);
    expect(vy).toBeLessThan(0); // Negative Y velocity means jumping up
  });

  test('player should have gravity applied', async ({ page }) => {
    const canvas = page.locator('#game');
    await canvas.click();

    // Jump first
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);

    const initialY = await page.evaluate(() => window.player.y);

    // Wait for gravity to take effect
    await page.waitForTimeout(200);

    const finalY = await page.evaluate(() => window.player.y);
    expect(finalY).toBeGreaterThan(initialY); // Player fell down due to gravity
  });

  test('player should land on platforms', async ({ page }) => {
    const canvas = page.locator('#game');
    await canvas.click();

    // Jump and wait to land
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    const onGround = await page.evaluate(() => window.player.onGround);
    expect(onGround).toBeTruthy();
  });

  test('player should respect max run speed', async ({ page }) => {
    const canvas = page.locator('#game');
    await canvas.click();

    // Hold right key for extended period
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowRight');

    const vx = await page.evaluate(() => window.player.vx);
    const maxSpeed = await page.evaluate(() => window.P.maxRunSpeed);

    // Velocity should not exceed max speed (with small tolerance for floating point)
    expect(Math.abs(vx)).toBeLessThanOrEqual(maxSpeed + 10);
  });
});

test.describe('Combat System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(100);
  });

  test('player should be able to melee attack', async ({ page }) => {
    const canvas = page.locator('#game');
    await canvas.click();

    const hasMelee = await page.evaluate(() => 'meleeTimer' in window.player);
    expect(hasMelee).toBeTruthy();

    // Press melee key
    await page.keyboard.press('J');
    await page.waitForTimeout(50);

    // Check melee timer was triggered
    const meleeTimer = await page.evaluate(() => window.player.meleeTimer);
    expect(meleeTimer).toBeGreaterThan(0);
  });

  test('player should be able to shoot railgun after pickup', async ({ page }) => {
    const canvas = page.locator('#game');
    await canvas.click();

    // Move to railgun pickup (at x: 500, y: 326)
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(2000); // Run to pickup
    await page.keyboard.up('ArrowRight');

    // Check if railgun was acquired
    const hasRailgun = await page.evaluate(() => window.player.hasRailgun);
    expect(hasRailgun).toBeTruthy();

    // Try shooting
    await page.keyboard.press('K');
    await page.waitForTimeout(50);

    const bulletCount = await page.evaluate(() => window.world.bullets.length);
    expect(bulletCount).toBeGreaterThan(0);
  });

  test('enemies should spawn and be damageable', async ({ page }) => {
    const canvas = page.locator('#game');
    await canvas.click();

    // Check enemies exist
    const enemyCount = await page.evaluate(() => window.world.enemies.length);
    expect(enemyCount).toBeGreaterThan(0);

    // Get first enemy
    const firstEnemy = await page.evaluate(() => window.world.enemies[0]);
    expect(firstEnemy).toHaveProperty('hp');
    expect(firstEnemy.hp).toBeGreaterThan(0);
  });
});

test.describe('Code Gate System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(100);
  });

  test('should be able to open code gate with M key', async ({ page }) => {
    const canvas = page.locator('#game');
    await canvas.click();

    // Press M to open code gate
    await page.keyboard.press('M');
    await page.waitForTimeout(100);

    // Check if minigame UI is visible
    const minigameVisible = await page.locator('#minigame').isVisible();
    expect(minigameVisible).toBeTruthy();
  });

  test('code gate should accept correct input', async ({ page }) => {
    const canvas = page.locator('#game');
    await canvas.click();

    // Open code gate
    await page.keyboard.press('M');
    await page.waitForTimeout(100);

    // Type the correct command
    const targetText = await page.evaluate(() => window.gate.target);
    await page.keyboard.type(targetText);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    // Check if gate was solved
    const solved = await page.evaluate(() => window.gate.solved);
    expect(solved).toBeTruthy();
  });

  test('code gate should fail on timeout', async ({ page }) => {
    const canvas = page.locator('#game');
    await canvas.click();

    // Open code gate
    await page.keyboard.press('M');
    await page.waitForTimeout(100);

    // Wait for timeout (12 seconds)
    await page.waitForTimeout(13000);

    // Check if gate was not solved
    const solved = await page.evaluate(() => window.gate.solved);
    expect(solved).toBeFalsy();
  });
});

test.describe('Pickup System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(100);
  });

  test('player should be able to pick up rocket backpack', async ({ page }) => {
    const canvas = page.locator('#game');
    await canvas.click();

    // Move to rocket pickup (at x: 270, y: 382)
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(800);
    await page.keyboard.up('ArrowRight');

    // Check if rocket was acquired
    const hasRocket = await page.evaluate(() => window.player.hasRocket);
    expect(hasRocket).toBeTruthy();

    // Check fuel was added
    const fuel = await page.evaluate(() => window.player.fuel);
    expect(fuel).toBeGreaterThan(0);
  });

  test('player should be able to pick up stim pack', async ({ page }) => {
    const canvas = page.locator('#game');
    await canvas.click();

    // Run to stim pickup (at x: 996, y: 304)
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(3500);
    await page.keyboard.up('ArrowRight');

    // Check if stim was acquired
    const stims = await page.evaluate(() => window.player.stims);
    expect(stims).toBeGreaterThan(0);
  });

  test('pickup should be removed after collection', async ({ page }) => {
    const canvas = page.locator('#game');
    await canvas.click();

    // Get initial pickup count
    const initialPickups = await page.evaluate(() =>
      window.world.pickups.filter(p => !p.taken).length
    );

    // Move to first pickup
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(800);
    await page.keyboard.up('ArrowRight');

    // Check pickup was marked as taken
    const remainingPickups = await page.evaluate(() =>
      window.world.pickups.filter(p => !p.taken).length
    );

    expect(remainingPickups).toBeLessThan(initialPickups);
  });
});

test.describe('Game Win Condition', () => {
  test('player should be able to reach the relay', async ({ page }) => {
    const canvas = page.locator('#game');
    await canvas.click();

    // Run all the way to the end
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(8000); // Run to the end
    await page.keyboard.up('ArrowRight');

    // Check if player won
    const won = await page.evaluate(() => window.player.won);
    expect(won).toBeTruthy();
  });

  test('winning should display victory message', async ({ page }) => {
    const canvas = page.locator('#game');
    await canvas.click();

    // Run to the end
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(8000);
    await page.keyboard.up('ArrowRight');

    // Check status message
    const status = page.locator('#status');
    await expect(status).toContainText('victory', { timeout: 1000 });
  });
});