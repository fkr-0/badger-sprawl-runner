import { describe, expect, it, vi } from 'vitest';
import { createGameFlow } from '../game/GameFlow';
import { createDefaultAdventureSave } from '../game/adventure/AdventureState';
import { applyStageCompletion } from '../game/adventure/AdventureProgression';
import { WorldDirector } from '../game/adventure/WorldDirector';
import { LocationScene } from './LocationScene';

describe('LocationScene', () => {
	it('projects an actual off-combat place with people and services', () => {
		const scene = new LocationScene({
			locationId: 'lower-sprawl:safehouse',
			flow: createGameFlow(),
			world: new WorldDirector(),
		});
		expect(scene.getSnapshot()).toMatchObject({
			title: "Auntie Subharmonic's Relay",
			phase: 'contested',
			violencePolicy: 'disabled',
		});
		expect(scene.getSnapshot().interactionIds).toContain('auntie-subharmonic');
		expect(scene.getSnapshot()).toMatchObject({
			undercityEntranceId: 'blue-mercy-maintenance-mouth',
			undercityEntranceLabel: 'Blue Mercy Maintenance Mouth',
		});
	});

	it('opens an attached undercity entrance without treating it as a disposable place menu', () => {
		const onOpenUndercity = vi.fn();
		const scene = new LocationScene({
			locationId: 'lower-sprawl:safehouse',
			flow: createGameFlow(),
			world: new WorldDirector(),
			onOpenUndercity,
		});

		expect(scene.openUndercity()).toBe(true);
		expect(onOpenUndercity).toHaveBeenCalledWith('blue-mercy-maintenance-mouth');
		expect(scene.getSnapshot().message).toContain('seeded manifest required');
	});

	it('fails closed when a place has no authored undercity entrance', () => {
		const scene = new LocationScene({
			locationId: 'mirror-palace:settlement',
			flow: createGameFlow(),
			world: new WorldDirector(),
		});
		expect(scene.openUndercity()).toBe(false);
		expect(scene.getSnapshot().undercityEntranceId).toBeUndefined();
	});

	it('autosaves after a durable NPC interaction', () => {
		const onAutosaveWorld = vi.fn();
		const scene = new LocationScene({
			locationId: 'lower-sprawl:safehouse',
			flow: createGameFlow(),
			world: new WorldDirector(),
			onAutosaveWorld,
		});
		scene.moveSelection(1);
		expect(scene.confirmSelection()?.changed).toBe(true);
		expect(onAutosaveWorld).toHaveBeenCalledOnce();
	});

	it('uses walking proximity and embeds canonical services in the place', () => {
		const world = new WorldDirector();
		const scene = new LocationScene({
			locationId: 'lower-sprawl:settlement',
			flow: createGameFlow({ credchips: 100 }),
			world,
		});

		expect(scene.getSnapshot().focusedInteractionId).toBe('murr-murrby');
		scene.movePlayer(250);
		expect(scene.getSnapshot().focusedInteractionId).toBe('field-shop');
		expect(scene.confirmSelection()).toMatchObject({ intent: 'open-shop' });
		expect(scene.getSnapshot()).toMatchObject({
			activeServiceId: 'field-shop',
			serviceItemIds: expect.arrayContaining(['stim_pack', 'signal_jammer']),
		});
	});

	it('keeps post-enforcement work visible before and after the colony return', () => {
		const colony = new LocationScene({
			locationId: 'dub-colony:station',
			flow: createGameFlow(undefined, {
				currentStageId: 'dub-colony',
				completedStageIds: ['lower-sprawl', 'drainmarket', 'chrome-arcology', 'mirror-palace'],
			}),
			world: new WorldDirector(),
		});
		expect(colony.getSnapshot().interactionIds).toContain('vera-counterweight');

		const homecoming = new LocationScene({
			locationId: 'lower-sprawl:station',
			flow: createGameFlow(undefined, {
				currentStageId: 'asteroid-redoubt',
				completedStageIds: [
					'lower-sprawl',
					'drainmarket',
					'chrome-arcology',
					'mirror-palace',
					'dub-colony',
					'antenna-barrens',
					'orbital-lift',
				],
			}),
			world: new WorldDirector(
				undefined,
				createDefaultAdventureSave({ districtPhases: { 'lower-sprawl': 'transformed' } })
			),
		});
		expect(homecoming.getSnapshot().interactionIds).toEqual(
			expect.arrayContaining(['marlo-turnstile', 'vera-counterweight'])
		);
	});

	it('executes clinic recovery from the walkable place and autosaves the durable result', () => {
		const onAutosaveWorld = vi.fn();
		const world = new WorldDirector(
			undefined,
			createDefaultAdventureSave({
				currentLocationId: 'drainmarket:safehouse',
				inventory: [{ itemId: 'stim_pack', quantity: 1 }],
				expedition: {
					integrity: 2,
					maxIntegrity: 6,
					injuries: 1,
					completedRuns: 0,
				},
			})
		);
		const scene = new LocationScene({
			locationId: 'drainmarket:safehouse',
			flow: createGameFlow(),
			world,
			onAutosaveWorld,
		});

		scene.movePlayer(410);
		expect(scene.getSnapshot().focusedInteractionId).toBe('clinic');
		expect(scene.confirmSelection()).toMatchObject({ ok: true });
		expect(scene.getSnapshot()).toMatchObject({
			activeServiceId: 'clinic',
			serviceItemIds: expect.arrayContaining(['clinic:stabilize']),
		});
		expect(scene.confirmSelection()).toMatchObject({ ok: true, changed: true });
		expect(world.getState().expedition).toMatchObject({ integrity: 4, injuries: 0 });
		expect(onAutosaveWorld).toHaveBeenCalledOnce();
	});

	it('projects Drainmarket as a walkable clinic rather than a mission menu', () => {
		const scene = new LocationScene({
			locationId: 'drainmarket:safehouse',
			flow: createGameFlow(),
			world: new WorldDirector(),
		});

		expect(scene.getSnapshot()).toMatchObject({
			title: 'Mutual-Aid Clinic Loft',
			interactionIds: expect.arrayContaining([
				'dr-calyx-reed',
				'silk-suture',
				'clinic',
				'loadout-locker',
			]),
		});
	});

	it('projects Chrome Arcology as an inhabited vertical district on its scheduled beat', () => {
		const scene = new LocationScene({
			locationId: 'chrome-arcology:safehouse',
			flow: createGameFlow(undefined, {
				currentStageId: 'chrome-arcology',
				completedStageIds: ['lower-sprawl', 'drainmarket'],
			}),
			world: new WorldDirector(),
		});

		expect(scene.getSnapshot()).toMatchObject({
			title: 'Labor Floor B2 Canteen',
			worldBeat: 'vertical-shift',
			interactionIds: expect.arrayContaining([
				'odessa-stack',
				'rook-null',
				'brother-pallet',
				'archive',
				'loadout-locker',
			]),
		});
	});

	it('projects Mirror Palace from the labor side of luxury', () => {
		const scene = new LocationScene({
			locationId: 'mirror-palace:settlement',
			flow: createGameFlow(undefined, {
				currentStageId: 'mirror-palace',
				completedStageIds: ['lower-sprawl', 'drainmarket', 'chrome-arcology'],
			}),
			world: new WorldDirector(),
		});

		expect(scene.getSnapshot()).toMatchObject({
			title: 'Banquet Servants’ Court',
			worldBeat: 'skybound',
			interactionIds: expect.arrayContaining([
				'orchid-debt',
				'mister-vellum',
				'reflection-judge',
				'archive',
				'field-shop',
			]),
		});
	});

	it('projects Dub Colony as a working circular transit commons', () => {
		const scene = new LocationScene({
			locationId: 'dub-colony:settlement',
			flow: createGameFlow(undefined, {
				currentStageId: 'dub-colony',
				completedStageIds: ['lower-sprawl', 'drainmarket', 'chrome-arcology', 'mirror-palace'],
			}),
			world: new WorldDirector(),
		});

		expect(scene.getSnapshot()).toMatchObject({
			title: 'Speaker Garden Assembly',
			worldBeat: 'colony-watch',
			interactionIds: expect.arrayContaining([
				'bassie-knot',
				'naya-root',
				'ames-oxygen',
				'coco-loop',
				'greenhouse',
			]),
		});
	});

	it('physically converges the colony and city cast on Blue Mercy during homecoming', () => {
		const scene = new LocationScene({
			locationId: 'lower-sprawl:station',
			flow: createGameFlow(undefined, {
				currentStageId: 'orbital-lift',
				completedStageIds: [
					'lower-sprawl',
					'drainmarket',
					'chrome-arcology',
					'mirror-palace',
					'dub-colony',
					'antenna-barrens',
					'orbital-lift',
				],
			}),
			world: new WorldDirector(
				undefined,
				createDefaultAdventureSave({
					districtPhases: { 'lower-sprawl': 'transformed' },
				})
			),
		});

		expect(scene.getSnapshot()).toMatchObject({
			title: 'Toll Line Relay',
			worldBeat: 'homecoming',
			interactionIds: expect.arrayContaining([
				'marlo-turnstile',
				'vera-counterweight',
				'rook-null',
				'naya-root',
				'juno-jar',
				'orchid-debt',
				'bassie-knot',
				'coco-loop',
			]),
		});
	});

	it.each([
		{
			locationId: 'antenna-barrens:settlement',
			currentStageId: 'orbital-lift',
			completedStageIds: ['lower-sprawl', 'drainmarket', 'chrome-arcology', 'mirror-palace', 'dub-colony', 'antenna-barrens'],
			title: 'Signal Scavenger Camp',
			beat: 'public-forecast',
			interactions: ['doctor-error-bar', 'mara-modulo', 'clinic', 'archive', 'legal-aid'],
		},
		{
			locationId: 'orbital-lift:station',
			currentStageId: 'orbital-lift',
			completedStageIds: ['lower-sprawl', 'drainmarket', 'chrome-arcology', 'mirror-palace', 'dub-colony', 'antenna-barrens'],
			title: 'Skylock Elevator',
			beat: 'public-forecast',
			interactions: ['elevator-angel', 'transit-control', 'archive', 'repair-bench'],
		},
		{
			locationId: 'asteroid-redoubt:settlement',
			currentStageId: 'asteroid-redoubt',
			completedStageIds: ['lower-sprawl', 'drainmarket', 'chrome-arcology', 'mirror-palace', 'dub-colony', 'antenna-barrens', 'orbital-lift'],
			title: 'Redoubt Commons',
			beat: 'last-route',
			interactions: ['witness-zero', 'little-ix', 'director-vane', 'archive', 'legal-aid'],
		},
	] as const)('projects $locationId as an inhabited late-act place', (fixture) => {
		const scene = new LocationScene({
			locationId: fixture.locationId,
			flow: createGameFlow(undefined, {
				currentStageId: fixture.currentStageId,
				completedStageIds: [...fixture.completedStageIds],
			}),
			world: new WorldDirector(),
		});

		expect(scene.getSnapshot()).toMatchObject({
			title: fixture.title,
			worldBeat: fixture.beat,
			interactionIds: expect.arrayContaining([...fixture.interactions]),
		});
	});

	it('projects Commons Dawn as a changed Blue Mercy platform after the final expedition', () => {
		const world = new WorldDirector();
		applyStageCompletion(world, 'lower-sprawl', undefined, false);
		applyStageCompletion(world, 'asteroid-redoubt');
		const scene = new LocationScene({
			locationId: 'lower-sprawl:station',
			flow: createGameFlow(undefined, {
				currentStageId: 'asteroid-redoubt',
				completedStageIds: [
					'lower-sprawl',
					'drainmarket',
					'chrome-arcology',
					'mirror-palace',
					'dub-colony',
					'antenna-barrens',
					'orbital-lift',
					'asteroid-redoubt',
				],
				campaignComplete: true,
			}),
			world,
		});

		expect(scene.getSnapshot()).toMatchObject({
			worldBeat: 'commons-dawn',
			interactionIds: expect.arrayContaining([
				'choir-of-static',
				'little-ix',
				'transit-control',
				'signal-lab',
			]),
		});
	});
});

