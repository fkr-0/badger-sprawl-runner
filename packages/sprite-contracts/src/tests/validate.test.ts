import { describe, expect, it } from 'vitest';
import { __spriteLoaderInternals } from '../loader';
import { normalizeSpriteManifest, validateSpriteManifest } from '../validate';
import type { SpriteManifest, SpriteSheet } from '../types';

describe('validateSpriteManifest', () => {
	it('validates normalized sprite manifest structure', () => {
		const validManifest: SpriteManifest = {
			version: '1.0',
			sheets: [
				{
					id: 'player-sprite',
					file: 'sprites/player.png',
					frameSize: [32, 32],
					animations: {
						idle: { frames: 4, fps: 10 },
						run: { frames: 6, fps: 12 },
					},
				},
			],
		};
		expect(validateSpriteManifest(validManifest)).toBe(true);
	});

	it('validates project data/sprites.json shape with spriteSheets', () => {
		const projectManifest = {
			schemaVersion: 1,
			baseGrid: 16,
			spriteSheets: [
				{
					id: 'items_core',
					file: 'assets/sprites/items_core.png',
					frameSize: [32, 32],
					animations: { rocket_backpack_pickup: { frames: 4, fps: 8 } },
				},
			],
		};

		expect(validateSpriteManifest(projectManifest)).toBe(true);
		expect(normalizeSpriteManifest(projectManifest)).toEqual({
			version: '1',
			sheets: projectManifest.spriteSheets,
		});
	});

	it('validates grid, order, anchors, boxes, events, and tags', () => {
		const manifest: SpriteManifest = {
			version: '1.0',
			sheets: [
				{
					id: 'grid-sheet',
					file: 'sprites/grid.png',
					frameSize: [64, 64],
					grid: { columns: 4, rows: 2 },
					animations: {
						run: {
							frames: 8,
							fps: 12,
							order: [0, 1, 2, 3, 4, 5, 6, 7],
							loop: true,
							anchor: [32, 56],
							hitboxes: [{ x: 40, y: 20, w: 16, h: 12, label: 'shoulder' }],
							hurtboxes: [{ x: 18, y: 10, w: 30, h: 46 }],
							events: [{ frame: 3, kind: 'footstep', name: 'right' }],
							tags: ['locomotion'],
						},
					},
				},
			],
		};
		expect(validateSpriteManifest(manifest)).toBe(true);
	});

	it('rejects missing sheets array', () => {
		expect(validateSpriteManifest({ version: '1.0' })).toBe(false);
	});

	it('rejects invalid frame size', () => {
		expect(
			validateSpriteManifest({
				version: '1.0',
				sheets: [
					{
						id: 'player',
						file: 'player.png',
						frameSize: [0, 32],
						animations: { idle: { frames: 1, fps: 10 } },
					},
				],
			})
		).toBe(false);
	});

	it('rejects zero animation frames and negative fps', () => {
		expect(
			validateSpriteManifest({
				version: '1.0',
				sheets: [
					{
						id: 'enemy',
						file: 'enemy.png',
						frameSize: [24, 24],
						animations: { idle: { frames: 0, fps: -5 } },
					},
				],
			})
		).toBe(false);
	});

	it('rejects duplicate sheet ids', () => {
		expect(
			validateSpriteManifest({
				version: '1.0',
				sheets: [
					{
						id: 'player',
						file: 'player.png',
						frameSize: [32, 32],
						animations: { idle: { frames: 1, fps: 10 } },
					},
					{
						id: 'player',
						file: 'player-alt.png',
						frameSize: [32, 32],
						animations: { idle: { frames: 1, fps: 10 } },
					},
				],
			})
		).toBe(false);
	});

	it('rejects invalid grid order references', () => {
		expect(
			validateSpriteManifest({
				version: '1.0',
				sheets: [
					{
						id: 'grid-sheet',
						file: 'sprites/grid.png',
						frameSize: [64, 64],
						grid: { columns: 2, rows: 2 },
						animations: { run: { frames: 4, fps: 12, order: [0, 1, 2, 4] } },
					},
				],
			})
		).toBe(false);
	});

	it('rejects invalid animation events', () => {
		expect(
			validateSpriteManifest({
				version: '1.0',
				sheets: [
					{
						id: 'events',
						file: 'sprites/events.png',
						frameSize: [32, 32],
						animations: { fire: { frames: 3, fps: 10, events: [{ frame: 3, kind: 'shoot' }] } },
					},
				],
			})
		).toBe(false);
	});
});

describe('sprite frame source selection', () => {
	it('maps row-per-animation sheets by animation row', () => {
		const sheet: SpriteSheet = {
			id: 'row-sheet',
			file: 'sprites/row.png',
			frameSize: [32, 16],
			animations: {
				idle: { frames: 2, fps: 8 },
				run: { frames: 3, fps: 12 },
			},
		};
		expect(__spriteLoaderInternals.getFrameSource(sheet, 'run', 2)).toEqual([64, 16]);
	});

	it('maps explicit grid/order sheets by absolute frame index', () => {
		const sheet: SpriteSheet = {
			id: 'grid-sheet',
			file: 'sprites/grid.png',
			frameSize: [256, 256],
			grid: { columns: 4, rows: 2 },
			animations: {
				run: { frames: 8, fps: 12, order: [0, 1, 2, 3, 4, 5, 6, 7] },
			},
		};
		expect(__spriteLoaderInternals.getFrameSource(sheet, 'run', 5)).toEqual([256, 256]);
	});
});
