import type { MenuOption, MenuOptionId } from './GameFlow';

export interface ModeSceneRoute {
	sceneName: string;
	status: 'implemented' | 'flow-only' | 'planned';
}

export const MODE_OPTIONS: MenuOption[] = [
	{
		id: 'story',
		label: 'Story Adventure',
		description: 'Live in the Sprawl, open routes, and change eight persistent districts.',
	},
	{ id: 'versus', label: 'VS Mode', description: 'Local duel prototype: first to 3 tags.' },
	{
		id: 'training',
		label: 'Dummy Training',
		description: 'Practice movement and combat on an invincible target.',
	},
	{
		id: 'skills',
		label: 'Skill Tree',
		description: 'Spend blueprint shards on persistent upgrades.',
	},
	{
		id: 'builds',
		label: 'Lower Sprawl Build Lab',
		description: 'Compare three routes through pressure, public consequence, and real run evidence.',
	},
	{
		id: 'endless',
		label: 'Endless Sprawl',
		description: 'Replay procedural floors with escalating enemy budgets and side rooms.',
	},
];

export const MODE_SCENE_ROUTES: Record<MenuOptionId, ModeSceneRoute> = {
	story: { sceneName: 'SubwayMapScene', status: 'implemented' },
	versus: { sceneName: 'VersusScene', status: 'implemented' },
	training: { sceneName: 'TrainingScene', status: 'implemented' },
	skills: { sceneName: 'SkillTreeScene', status: 'implemented' },
	builds: { sceneName: 'LowerSprawlBuildComparisonScene', status: 'implemented' },
	endless: { sceneName: 'StageRunScene', status: 'implemented' },
};
