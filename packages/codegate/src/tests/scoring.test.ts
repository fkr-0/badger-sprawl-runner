import { describe, it, expect } from 'vitest';
import { createCodeGate } from '../core';
import { createMicroCodeGate } from '../gates/MicroCodeGate';

describe('CodeGate scoring', () => {
	it('perfect window produces clean result tag', () => {
		const spec = {
			id: 'test-gate',
			kind: 'fasttype' as const,
			prompt: 'Type: test',
			timeLimitMs: 10000,
			attempts: 3,
			rewardTags: ['clean'],
			failureHeat: 1,
		};
		const gate = createCodeGate(spec);

		// Use 90% of time (in perfect window - last 15% = last 1.5s)
		gate.update(9);
		const result = gate.submitInput('test');

		expect(result?.outcome).toBe('clean');
		expect(result?.heatDelta).toBe(-1);
	});

	it('normal time produces normal result', () => {
		const spec = {
			id: 'test-gate',
			kind: 'fasttype' as const,
			prompt: 'Type: test',
			timeLimitMs: 10000,
			attempts: 3,
			rewardTags: ['normal'],
			failureHeat: 1,
		};
		const gate = createCodeGate(spec);

		// Use 50% of time (outside perfect window)
		gate.update(5);
		const result = gate.submitInput('test');

		expect(result?.outcome).toBe('normal');
		expect(result?.heatDelta).toBe(0);
	});

	it('all six gate kinds construct without error', () => {
		const kinds = [
			'fasttype',
			'commandrepair',
			'regex',
			'routing',
			'bytecode',
			'microcode',
		] as const;

		for (const kind of kinds) {
			const spec = {
				id: `test-${kind}`,
				kind,
				prompt: 'Test prompt',
				timeLimitMs: 10000,
				attempts: 3,
				rewardTags: [],
				failureHeat: 1,
			};

			expect(() => createCodeGate(spec)).not.toThrow();
		}
	});
});

describe('MicroCodeGate safe evaluation', () => {
	const spec = {
		id: 'safe-arithmetic',
		kind: 'microcode' as const,
		prompt: 'produce 4',
		rewardTags: ['logic'],
		heatDelta: -1,
	};

	it('accepts arithmetic expressions without evaluating arbitrary JavaScript', () => {
		const gate = createMicroCodeGate(spec, { expectedExpression: '2 + 2', input: 2, output: 4 });

		expect(gate.validate('2 + 2')?.outcome).toBe('clean');
		expect(gate.validate('globalThis.process.exit()')).toBeNull();
	});
});
