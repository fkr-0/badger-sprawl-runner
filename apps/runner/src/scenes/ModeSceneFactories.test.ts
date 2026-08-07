import { describe, expect, it, vi } from 'vitest';
import { createGameFlow } from '../game/GameFlow';
import { createDefaultModeSceneFactories } from './ModeSceneFactories';
import { LocationScene } from './LocationScene';
import { LowerSprawlBuildComparisonScene } from './LowerSprawlBuildComparisonScene';
import { StageRunScene } from './StageRunScene';
import { StoryFlowScene } from './StoryFlowScene';
import { SubwayMapScene } from './SubwayMapScene';
import { TrainingScene } from './TrainingScene';
import {
	buildUndercityExpedition,
	createActiveUndercityExpeditionSave,
} from '../procgen/UndercityExpedition';

describe('createDefaultModeSceneFactories', () => {
	it('creates the persistent subway map as the canonical story entry', () => {
		const factories = createDefaultModeSceneFactories();
		const scene = factories.story();
		expect(scene).toBeInstanceOf(SubwayMapScene);
	});

	it('resumes an exact undercity manifest with saved room and pressure state', () => {
		const built = buildUndercityExpedition({
			seed: 'factory-resume',
			entranceId: 'drainmarket-sump-archive',
			depth: 6,
		});
		const active = {
			...createActiveUndercityExpeditionSave(built.manifest),
			currentRoomIndex: 1,
			bankedSalvage: 9,
			unbankedSalvage: 4,
			updatedSequence: 3,
		};
		const scene = createDefaultModeSceneFactories().resumeUndercity(active) as StageRunScene;

		expect(scene.getResumedUndercityRoomIndex()).toBe(1);
		expect(scene.getExpeditionPressureSnapshot()).toMatchObject({
			bankedSalvage: 9,
			unbankedSalvage: 4,
		});
	});

	it('launches Build Lab cards into deterministic Lower Sprawl training presets', () => {
		const onOpenTraining = vi.fn();
		const scene = createDefaultModeSceneFactories({ onOpenTraining }).builds() as LowerSprawlBuildComparisonScene;
		scene.moveSelection(2);
		scene.launchSelectedTraining();

		expect(onOpenTraining).toHaveBeenCalledWith(expect.any(TrainingScene));
		const training = onOpenTraining.mock.calls[0]?.[0] as TrainingScene;
		expect(training.getSelectedStage()).toMatchObject({
			stageId: 'lower-sprawl',
			seed: 'build-lab:rail-breach',
		});
		expect(training.getBuildPreset()).toEqual({
			id: 'rail-breach',
			unlockedSkills: ['rail_mastery', 'quickdraw_bus', 'breach_math'],
			skillRanks: { rail_mastery: 1, quickdraw_bus: 2, breach_math: 2 },
			lessonId: 'railgun',
			dummyPresetId: 'armored',
			kitId: 'railgun',
		});
	});

	it('launches an undercity entrance as a seeded StageRunScene with a separate active save', () => {
		const onOpenUndercity = vi.fn();
		const onOpenLocation = vi.fn();
		const routedFactories = createDefaultModeSceneFactories({
			onOpenLocation,
			onOpenUndercity,
		});
		const map = routedFactories.story() as SubwayMapScene;
		map.confirmSelection();
		expect(onOpenLocation).toHaveBeenCalledWith(expect.any(LocationScene));
		const routedLocation = onOpenLocation.mock.calls[0]?.[0] as LocationScene;
		routedLocation.openUndercity();
		expect(onOpenUndercity).toHaveBeenCalledWith(expect.any(StageRunScene), expect.objectContaining({
			status: 'active',
			manifest: expect.objectContaining({ entranceId: 'blue-mercy-maintenance-mouth' }),
		}));
	});

	it('hydrates the build lab from canonical observed run history', () => {
		const storyFlow = createGameFlow({
			buildTelemetryHistory: [
				{
					runId: 'run:factory:ghost',
					stageId: 'lower-sprawl',
					durationSeconds: 101,
					loadoutItemIds: ['signal_jammer', 'phase_pick'],
					skillRanks: { hacking: 2 },
					approaches: ['hacking'],
					damageDealt: 4,
					damageTaken: 1,
					kills: 0,
					alarmsTriggered: 0,
					alarmsSpoofed: 2,
					alarmsDisabled: 0,
					civiliansDocumenting: 0,
					civiliansEvacuated: 0,
					civiliansSheltered: 0,
					standDownAppeals: 0,
					salvageBanked: 3,
					salvageLost: 0,
					deaths: 0,
				},
			],
		});
		const scene = createDefaultModeSceneFactories({ storyFlow }).builds();
		expect(scene).toBeInstanceOf(LowerSprawlBuildComparisonScene);
		expect((scene as LowerSprawlBuildComparisonScene).getSnapshot().cards[0]).toMatchObject({
			evidenceKind: 'observed-run',
			observed: { runId: 'run:factory:ghost' },
		});
	});

	it('creates the Lower Sprawl build lab as a dedicated comparison scene', () => {
		const factories = createDefaultModeSceneFactories();
		expect(factories.builds()).toBeInstanceOf(LowerSprawlBuildComparisonScene);
	});

	it('opens discovered non-combat nodes as persistent location scenes', () => {
		const onOpenLocation = vi.fn();
		const factories = createDefaultModeSceneFactories({ onOpenLocation });
		const map = factories.story() as SubwayMapScene;
		map.selectLocation('lower-sprawl:settlement');
		map.confirmSelection();

		expect(onOpenLocation).toHaveBeenCalledWith(expect.any(LocationScene));
	});

	it('creates Endless Sprawl as a generated StageRunScene', () => {
		const factories = createDefaultModeSceneFactories();
		expect(factories.endless()).toBeInstanceOf(StageRunScene);
	});

	it('opens StoryFlow from the active expedition node', () => {
		const onOpenStoryFlow = vi.fn();
		const factories = createDefaultModeSceneFactories({ onOpenStoryFlow });
		const map = factories.story() as SubwayMapScene;
		map.selectLocation('lower-sprawl:settlement');
		map.confirmSelection();
		map.selectLocation('lower-sprawl:route');
		map.confirmSelection();
		expect(onOpenStoryFlow).toHaveBeenCalledWith(expect.any(StoryFlowScene));
	});

	it('routes StoryFlow stage launch callback to a StageRunScene', () => {
		const onStartStoryStage = vi.fn();
		let story: StoryFlowScene | null = null;
		const factories = createDefaultModeSceneFactories({
			onStartStoryStage,
			onOpenStoryFlow: (scene) => {
				story = scene as StoryFlowScene;
			},
		});
		const map = factories.story() as SubwayMapScene;
		map.selectLocation('lower-sprawl:settlement');
		map.confirmSelection();
		map.selectLocation('lower-sprawl:route');
		map.confirmSelection();
		expect(story).not.toBeNull();
		const activeStory = story as StoryFlowScene;
		const flow = activeStory.getFlow();
		flow.selectMenu('story');
		if (flow.getState().mode === 'title-card') flow.advanceTitleCard();
		for (let safety = 0; safety < 16 && flow.getState().mode === 'dialogue'; safety += 1) {
			flow.advanceDialogue();
		}
		activeStory.onEnter({ eventBus: { on: vi.fn(), off: vi.fn(), emit: vi.fn() }, canvas: document.createElement('canvas') });
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
		activeStory.onExit();
		expect(onStartStoryStage).toHaveBeenCalledWith(expect.any(StageRunScene));
	});
});
