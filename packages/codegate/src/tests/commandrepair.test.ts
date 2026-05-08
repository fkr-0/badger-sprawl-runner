import { describe, it, expect } from 'vitest';
import { createCommandRepairGate } from '../gates/CommandRepairGate';

describe('CommandRepairGate', () => {
	it('identifies correct fix location in malformed command', () => {
		const spec = {
			id: 'repair-gate',
			kind: 'commandrepair' as const,
			prompt: 'Fix the broken command',
			timeLimitMs: 10000,
			attempts: 2,
			rewardTags: ['fixed'],
			failureHeat: 1,
		};

		const config = {
			brokenCommand: 'unlock --gate drain-7',
			expectedFix: 'unlock --gate drain-7 --silent',
			errorLocation: 18,
		};

		const gate = createCommandRepairGate(spec, config);
		const result = gate.validate('unlock --gate drain-7 --silent');

		expect(result).not.toBeNull();
		expect(result?.outcome).toBe('clean');
	});

	it('rejects incorrect fix', () => {
		const spec = {
			id: 'repair-gate',
			kind: 'commandrepair' as const,
			prompt: 'Fix the broken command',
			timeLimitMs: 10000,
			attempts: 2,
			rewardTags: ['fixed'],
			failureHeat: 1,
		};

		const config = {
			brokenCommand: 'unlock --gate drain-7',
			expectedFix: 'unlock --gate drain-7 --silent',
			errorLocation: 18,
		};

		const gate = createCommandRepairGate(spec, config);
		const result = gate.validate('unlock --gate drain-7');

		expect(result).toBeNull();
	});
});
