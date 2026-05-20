import { describe, expect, it, vi } from 'vitest';
import { StageRunScene } from './StageRunScene';

describe('StageRunScene tutorial overlay', () => {
	it('stores tutorial beats and emits them on enter', () => {
		const scene = new StageRunScene({
			tutorialBeats: [
				{
					id: 'parry-window',
					label: 'Parry window',
					trigger: 'first drone wind-up',
					teaches: 'tap parry just before contact',
				},
			],
		});
		const events: unknown[] = [];
		window.addEventListener('badger:tutorial-overlay', (event) => events.push((event as CustomEvent).detail), {
			once: true,
		});
		scene.onEnter({
			eventBus: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
			canvas: document.createElement('canvas'),
			renderer: { loadSprites: vi.fn().mockResolvedValue(undefined) },
		});
		scene.onExit();

		expect(scene.getTutorialOverlayBeats()).toEqual([
			{
				id: 'parry-window',
				label: 'Parry window',
				trigger: 'first drone wind-up',
				teaches: 'tap parry just before contact',
			},
		]);
		expect(events[0]).toEqual(scene.getTutorialOverlayBeats());
	});
});
