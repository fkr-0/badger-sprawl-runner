import { describe, expect, it } from 'vitest';
import {
	advanceSpriteAnimation,
	createSpriteAnimationPlayback,
	getSpriteAnimationFrameAddress,
	getSpriteAnimationProgress,
	pauseSpriteAnimation,
	playSpriteAnimation,
	resumeSpriteAnimation,
	seekSpriteAnimationProgress,
	setSpriteAnimationSpeed,
} from '../playback';
import type { SpriteSheet } from '../types';

const sheet: SpriteSheet = {
	id: 'actor',
	file: 'actor.png',
	frameSize: [32, 48],
	animations: {
		idle: {
			frames: 4,
			fps: 10,
			events: [{ frame: 2, kind: 'sound', name: 'cloth' }],
		},
		attack: {
			frames: 3,
			fps: 10,
			loop: false,
			events: [{ frame: 1, kind: 'hit', name: 'active' }],
		},
		blink: { frames: 1, fps: 5 },
	},
};

describe('sprite animation playback', () => {
	it('advances looping animations and collects crossed frame events', () => {
		const state = createSpriteAnimationPlayback(sheet);
		const step = advanceSpriteAnimation(state, sheet, 0.25);

		expect(step.advancedFrames).toEqual([1, 2]);
		expect(step.events).toEqual([{ frame: 2, kind: 'sound', name: 'cloth' }]);
		expect(step.state.clock.frame).toBe(2);
		expect(step.state.clock.elapsed).toBeCloseTo(0.05);
		expect(step.progress).toBeCloseTo(0.625);
		expect(step.address).toMatchObject({ sourceX: 64, sourceY: 0 });
	});

	it('changes speed without resuming and seeks through ping-pong progress', () => {
		const paused = pauseSpriteAnimation(
			createSpriteAnimationPlayback(sheet, 'idle', { mode: 'pingpong' })
		);
		const faster = setSpriteAnimationSpeed(paused, 2.5);
		const sought = seekSpriteAnimationProgress(faster, sheet, 0.75);

		expect(faster).toMatchObject({ speed: 2.5, clock: { paused: true, frame: 0 } });
		expect(sought).toMatchObject({
			speed: 2.5,
			clock: { paused: true, frame: 2, direction: -1, completed: false },
		});
		expect(getSpriteAnimationProgress(sought, sheet)).toBeCloseTo(0.75);
	});

	it('completes one-shot animations and reports final progress exactly', () => {
		const idle = createSpriteAnimationPlayback(sheet);
		const attack = playSpriteAnimation(idle, sheet, 'attack');
		const step = advanceSpriteAnimation(attack, sheet, 0.35);

		expect(step.advancedFrames).toEqual([1, 2]);
		expect(step.events).toEqual([{ frame: 1, kind: 'hit', name: 'active' }]);
		expect(step.completedThisStep).toBe(true);
		expect(step.state.clock).toMatchObject({ frame: 2, playing: false, completed: true });
		expect(step.progress).toBe(1);
	});

	it('pauses, resumes, and restarts without mutable clock leakage', () => {
		const started = advanceSpriteAnimation(
			createSpriteAnimationPlayback(sheet),
			sheet,
			0.15
		).state;
		const paused = pauseSpriteAnimation(started);
		const held = advanceSpriteAnimation(paused, sheet, 1);

		expect(held.state.clock.frame).toBe(started.clock.frame);
		expect(held.advancedFrames).toEqual([]);

		const resumed = resumeSpriteAnimation(paused);
		const advanced = advanceSpriteAnimation(resumed, sheet, 0.06);
		expect(advanced.state.clock.frame).toBe(2);

		const restarted = playSpriteAnimation(advanced.state, sheet, 'idle', { restart: true });
		expect(restarted.clock).toMatchObject({ frame: 0, elapsed: 0, playing: true });
		expect(restarted.clock).not.toBe(advanced.state.clock);
	});

	it('supports ping-pong direction and cycle progress', () => {
		const state = createSpriteAnimationPlayback(sheet, 'idle', { mode: 'pingpong' });
		const step = advanceSpriteAnimation(state, sheet, 0.45);

		expect(step.advancedFrames).toEqual([1, 2, 3, 2]);
		expect(step.state.clock).toMatchObject({ frame: 2, direction: -1 });
		expect(step.progress).toBeCloseTo(4.5 / 6);
	});

	it('resolves ordered addresses and rejects unknown animations', () => {
		const state = createSpriteAnimationPlayback(sheet, 'attack', { frame: 2 });
		expect(getSpriteAnimationFrameAddress(state, sheet)).toMatchObject({
			animationName: 'attack',
			sourceX: 64,
			sourceY: 48,
		});
		expect(getSpriteAnimationProgress(state, sheet)).toBeCloseTo(2 / 3);
		expect(() => createSpriteAnimationPlayback(sheet, 'missing')).toThrow(
			'Unknown sprite animation: actor:missing'
		);
	});
});
