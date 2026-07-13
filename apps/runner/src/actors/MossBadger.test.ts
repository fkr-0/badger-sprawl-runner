import { describe, expect, it, vi } from 'vitest';
import type { CombatEntity } from '../systems/CombatSystem';
import type { ActionMap } from '../systems/InputSystem';
import { createPlayer, processMossInput } from './MossBadger';

const IDLE_ACTIONS: ActionMap = {
	moveLeft: false,
	moveRight: false,
	jump: false,
	jumpPressed: false,
	fastFall: false,
	melee: false,
	meleePressed: false,
	shoot: false,
	shootPressed: false,
	item: false,
	itemPressed: false,
	parry: false,
	parryPressed: false,
	dodge: false,
	dodgePressed: false,
	hack: false,
	hackPressed: false,
	hackHeld: false,
	pause: false,
	pausePressed: false,
	debugToggle: false,
};

describe('processMossInput', () => {
	it('passes live enemy targets to melee resolution', () => {
		const player = createPlayer();
		const enemies = [{ hp: 3 }] as CombatEntity[];
		const melee = vi.fn();

		processMossInput(
			player,
			{ ...IDLE_ACTIONS, melee: true, meleePressed: true },
			1 / 60,
			{ melee },
			enemies
		);

		expect(melee).toHaveBeenCalledWith(player, enemies, 'claws');
	});
});
