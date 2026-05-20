import { describe, expect, it, vi } from 'vitest';
import { StageRunScene } from './StageRunScene';

describe('StageRunScene boss placeholder', () => {
	it('stores and emits the structured runtime boss placeholder', () => {
		const scene = new StageRunScene({
			bossPlaceholder: {
				id: 'tollbooth-captain-grin',
				name: 'Tollbooth Captain Grin',
				argument: 'Fees are civilization with a receipt.',
				phaseCount: 2,
			},
		});
		const events: unknown[] = [];
		window.addEventListener('badger:boss-placeholder', (event) => events.push((event as CustomEvent).detail), {
			once: true,
		});
		scene.onEnter({
			eventBus: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
			canvas: document.createElement('canvas'),
			renderer: { loadSprites: vi.fn().mockResolvedValue(undefined) },
		});
		scene.onExit();

		expect(scene.getBossPlaceholder()).toMatchObject({
			id: 'tollbooth-captain-grin',
			name: 'Tollbooth Captain Grin',
			phaseCount: 2,
		});
		expect(events[0]).toEqual(scene.getBossPlaceholder());
	});
});
