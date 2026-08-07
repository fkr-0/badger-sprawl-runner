// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { LowerSprawlBuildComparisonScene } from './LowerSprawlBuildComparisonScene';

describe('LowerSprawlBuildComparisonScene', () => {
	it('navigates three build cards and toggles route/evidence lenses', () => {
		const scene = new LowerSprawlBuildComparisonScene();
		expect(scene.getSnapshot()).toMatchObject({
			selectedIndex: 0,
			selectedBuildId: 'ghost-signal',
			detailPage: 'routes',
		});

		scene.moveSelection(1);
		expect(scene.getSnapshot().selectedBuildId).toBe('commons-claw');
		scene.moveSelection(2);
		expect(scene.getSnapshot().selectedBuildId).toBe('ghost-signal');
		scene.moveSelection(-1);
		expect(scene.getSnapshot().selectedBuildId).toBe('rail-breach');

		scene.toggleDetailPage();
		expect(scene.getSnapshot().detailPage).toBe('evidence');
	});

	it('launches the selected authored build as a training preset', () => {
		const onLaunchTraining = vi.fn();
		const scene = new LowerSprawlBuildComparisonScene({ onLaunchTraining });
		scene.moveSelection(2);

		expect(scene.launchSelectedTraining()).toBe(true);
		expect(onLaunchTraining).toHaveBeenCalledWith(
			expect.objectContaining({
				id: 'rail-breach',
				loadoutItemIds: ['railgun', 'rail_heat_sink', 'capacitor_coil'],
				skillRanks: { rail_mastery: 1, quickdraw_bus: 2, breach_math: 2 },
			})
		);
	});

	it('supports keyboard-first selection and a clean escape route', () => {
		const onReturnToTitle = vi.fn();
		const scene = new LowerSprawlBuildComparisonScene({ onReturnToTitle });
		scene.onEnter({
			eventBus: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
			canvas: document.createElement('canvas'),
		});

		window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' }));
		window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Tab' }));
		expect(scene.getSnapshot()).toMatchObject({
			selectedBuildId: 'commons-claw',
			detailPage: 'evidence',
		});

		window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));
		expect(onReturnToTitle).toHaveBeenCalledOnce();
		scene.onExit();
	});

	it('clones snapshot arrays so UI consumers cannot mutate the authored model', () => {
		const scene = new LowerSprawlBuildComparisonScene();
		const snapshot = scene.getSnapshot();
		snapshot.cards[0]?.loadoutItemIds.push('forged-item');
		snapshot.cards[0]?.preferredPlans.splice(0);
		expect(scene.getSnapshot().cards[0]).toMatchObject({
			loadoutItemIds: ['signal_jammer', 'phase_pick', 'ledger_lens'],
		});
		expect(scene.getSnapshot().cards[0]?.preferredPlans).toHaveLength(2);
	});
});
