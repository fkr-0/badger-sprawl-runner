import { describe, expect, it, vi } from 'vitest';
import { createGameFlow } from '../game/GameFlow';
import { autosaveGameFlow } from './AutosaveFeedback';
import { SAVE_KEY, createMemorySaveDriver } from './SaveStore';

describe('autosaveGameFlow', () => {
	it('saves the flow and emits visible autosave feedback', () => {
		const driver = createMemorySaveDriver();
		const flow = createGameFlow(undefined, { currentStageId: 'mirror-palace' });
		const events: unknown[] = [];
		window.addEventListener('badger:autosave-feedback', (event) => events.push((event as CustomEvent).detail), {
			once: true,
		});
		vi.setSystemTime(new Date('2026-01-02T03:04:05Z'));

		const feedback = autosaveGameFlow(driver, flow, 'branch-choice');

		expect(driver.getItem(SAVE_KEY)).toContain('mirror-palace');
		expect(feedback).toMatchObject({
			reason: 'branch-choice',
			label: 'Autosaved branch choice',
			timestamp: new Date('2026-01-02T03:04:05Z').getTime(),
		});
		expect(events[0]).toEqual(feedback);
		vi.useRealTimers();
	});
});
