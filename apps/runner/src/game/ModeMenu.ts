import type { MenuOption, MenuOptionId } from './GameFlow';

export interface ModeSceneRoute {
	sceneName: string;
	status: 'implemented' | 'flow-only' | 'planned';
}

export const MODE_OPTIONS: MenuOption[] = [
	{
		id: 'story',
		label: 'Story Run',
		description: 'Play the complete eight-stage Brechtian campaign skeleton.',
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
		id: 'endless',
		label: 'Endless Sprawl',
		description: 'Replay procedural floors with escalating enemy budgets and side rooms.',
	},
];

export const MODE_SCENE_ROUTES: Record<MenuOptionId, ModeSceneRoute> = {
	story: { sceneName: 'DialogueScene', status: 'implemented' },
	versus: { sceneName: 'VersusScene', status: 'implemented' },
	training: { sceneName: 'TrainingScene', status: 'implemented' },
	skills: { sceneName: 'SkillTreeScene', status: 'implemented' },
	endless: { sceneName: 'StageRunScene', status: 'implemented' },
};
