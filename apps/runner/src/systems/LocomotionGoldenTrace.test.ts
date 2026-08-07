import { describe, expect, it } from 'vitest';
import { CameraSystem } from './CameraSystem';
import {
	buildLocomotionGoldenCorpus,
	runLocomotionGoldenTrace,
} from './LocomotionGoldenTrace';

function summary() {
	return Object.fromEntries(
		Object.entries(buildLocomotionGoldenCorpus()).map(([scenario, trace]) => [
			scenario,
			{
				minimumY: trace.minimumY,
				maximumX: trace.maximumX,
				apexFrame: trace.apexFrame,
				landingFrame: trace.landingFrame,
				end: trace.end,
			},
		])
	);
}

describe('locomotion golden traces', () => {
	it('locks the five canonical fixed-step movement signatures', () => {
		expect(summary()).toEqual({
			'run-brake': {
				minimumY: 420,
				maximumX: 366.75,
				apexFrame: null,
				landingFrame: null,
				end: {
					x: 366.75,
					y: 420,
					vx: 0,
					vy: 0,
					onGround: true,
					nearApex: false,
					isDodging: false,
				},
			},
			'held-jump': {
				minimumY: 302.144,
				maximumX: 80,
				apexFrame: 22,
				landingFrame: 45,
				end: {
					x: 80,
					y: 420,
					vx: 0,
					vy: 0,
					onGround: true,
					nearApex: false,
					isDodging: false,
				},
			},
			'coyote-jump': {
				minimumY: 293.051,
				maximumX: 647.025,
				apexFrame: 24,
				landingFrame: 48,
				end: {
					x: 647.025,
					y: 420,
					vx: 285,
					vy: 0,
					onGround: true,
					nearApex: false,
					isDodging: false,
				},
			},
			'fast-fall': {
				minimumY: 302.144,
				maximumX: 80,
				apexFrame: 22,
				landingFrame: 42,
				end: {
					x: 80,
					y: 420,
					vx: 0,
					vy: 0,
					onGround: true,
					nearApex: false,
					isDodging: false,
				},
			},
			'ground-dodge': {
				minimumY: 419.417,
				maximumX: 253.472,
				apexFrame: null,
				landingFrame: 20,
				end: {
					x: 253.472,
					y: 420,
					vx: 0,
					vy: 0,
					onGround: true,
					nearApex: false,
					isDodging: false,
				},
			},
		});
	});

	it('remains independent from camera profile and follow-state evolution', () => {
		const baseline = runLocomotionGoldenTrace('coyote-jump');
		const camera = new CameraSystem();
		for (const sample of baseline.samples) {
			camera.step(sample.x, 0, 1900, baseline.fixedDt, sample.vx);
		}
		expect(camera.getCamera().x).toBeGreaterThanOrEqual(0);
		expect(runLocomotionGoldenTrace('coyote-jump')).toEqual(baseline);
	});

	it('proves fast-fall changes descent without changing jump launch or apex', () => {
		const held = runLocomotionGoldenTrace('held-jump');
		const fast = runLocomotionGoldenTrace('fast-fall');
		expect(fast.samples[0]).toEqual(held.samples[0]);
		expect(fast.apexFrame).toBe(held.apexFrame);
		expect(fast.landingFrame).toBeLessThan(held.landingFrame as number);
	});
});
