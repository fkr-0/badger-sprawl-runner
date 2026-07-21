import { describe, expect, it } from 'vitest';
import type { LoadedSheet, SpriteSheet } from '@badger/sprite-contracts';
import { SpriteInspectorController } from './SpriteInspectorController';

const sheet: SpriteSheet = {
	id: 'controller',
	file: 'controller.png',
	frameSize: [16, 16],
	animations: {
		idle: {
			frames: 4,
			fps: 10,
			events: [{ frame: 2, kind: 'sound', name: 'step' }],
		},
		attack: { frames: 3, fps: 10, loop: false },
	},
};

function loaded(spriteSheet = sheet): LoadedSheet {
	return {
		sheet: spriteSheet,
		image: {
			naturalWidth: 64,
			naturalHeight: 32,
			width: 64,
			height: 32,
		} as HTMLImageElement,
		drawFrame() {},
	};
}

describe('SpriteInspectorController', () => {
	it('advances shared playback and keeps a bounded event log', () => {
		const controller = new SpriteInspectorController(loaded());

		controller.advance(0.25);
		const snapshot = controller.snapshot();

		expect(snapshot).toMatchObject({
			sheetId: 'controller',
			animationName: 'idle',
			frame: 2,
			progress: 0.625,
			address: { sourceX: 32, sourceY: 0 },
			sheet: { dimensionAudit: { ok: true } },
		});
		expect(snapshot.eventLog).toEqual([
			expect.objectContaining({ kind: 'sound', name: 'step', localFrame: 2 }),
		]);
	});

	it('preserves progress across mode switches and supports paused frame stepping', () => {
		const controller = new SpriteInspectorController(loaded());
		controller.advance(0.2);
		controller.setMode('pingpong');
		controller.stepFrames(1);

		const snapshot = controller.snapshot();
		expect(snapshot.mode).toBe('pingpong');
		expect(snapshot.paused).toBe(true);
		expect(snapshot.frame).toBe(2);
		expect(snapshot.direction).toBe(-1);
	});

	it('switches animations and restarts completed one-shots on play', () => {
		const controller = new SpriteInspectorController(loaded());
		controller.selectAnimation('attack');
		controller.advance(0.4);
		expect(controller.snapshot()).toMatchObject({ completed: true, frame: 2 });

		controller.play();
		expect(controller.snapshot()).toMatchObject({ completed: false, frame: 0, playing: true });
	});
});
