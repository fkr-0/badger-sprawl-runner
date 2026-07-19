import { describe, expect, it, vi } from 'vitest';
import { StageRunScene } from './StageRunScene';

describe('StageRunScene runtime config', () => {
	it('stores and emits projected runtime stage config on enter', () => {
		const scene = new StageRunScene({
			runtimeConfig: {
				stageId: 'dub-colony',
				templateId: 'dub-colony',
				templateKind: 'standard-platforming',
				hazardIds: [],
				hazardCount: 0,
				enemyMixTags: ['beat-timing'],
				cameraPressure: 'rhythm',
				payloadRewardId: 'bass_reactor_core',
				bossPlaceholderId: 'king-feedback',
				modifierRules: [
					{
						id: 'bass-reactor-sync',
						label: 'Bass Reactor Sync',
						kind: 'beat-timing',
						effect: 'rhythm window 145ms at 86bpm',
					},
				],
			},
		});
		const events: unknown[] = [];
		window.addEventListener('badger:stage-runtime-config', (event) => events.push((event as CustomEvent).detail), {
			once: true,
		});
		scene.onEnter({
			eventBus: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
			canvas: document.createElement('canvas'),
			renderer: { loadSprites: vi.fn().mockResolvedValue(undefined) },
		});
		scene.onExit();

		expect(scene.getRuntimeConfig()).toMatchObject({
			stageId: 'dub-colony',
			cameraPressure: 'rhythm',
			payloadRewardId: 'bass_reactor_core',
		});
		expect(events[0]).toEqual(scene.getRuntimeConfig());
	});
});
