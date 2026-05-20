import { describe, expect, it, vi } from 'vitest';
import { StageRunScene } from './StageRunScene';

describe('StageRunScene story balance rules', () => {
	it('stores and emits projected story balance rules on enter', () => {
		const scene = new StageRunScene({
			balanceRules: {
				merchantPriceModifier: 1.18,
				allyAssistLevel: 'high',
				hazardIntensity: 'extreme',
				endingTone: 'mercy',
				activeReasons: ['heat:6', 'favor:3', 'lio:protected'],
			},
		});
		const events: unknown[] = [];
		window.addEventListener('badger:story-balance', (event) => events.push((event as CustomEvent).detail), {
			once: true,
		});
		scene.onEnter({
			eventBus: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
			canvas: document.createElement('canvas'),
			renderer: { loadSprites: vi.fn().mockResolvedValue(undefined) },
		});
		scene.onExit();

		expect(scene.getBalanceRules()).toMatchObject({
			merchantPriceModifier: 1.18,
			allyAssistLevel: 'high',
			hazardIntensity: 'extreme',
			endingTone: 'mercy',
		});
		expect(events[0]).toEqual(scene.getBalanceRules());
	});
});
