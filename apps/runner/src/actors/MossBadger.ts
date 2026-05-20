/**
 * Moss Badger - player actor
 * Composes all player capabilities into a single entity
 */

import type { Entity } from '../systems/PhysicsSystem';
import type { CombatEntity, CombatSystem } from '../systems/CombatSystem';
import type { ActionMap } from '../systems/InputSystem';
import type { AnimationState } from '../renderer/AnimationState';

export interface Player extends Entity, CombatEntity {
	fuel: number;
	maxFuel: number;
	stims: number;
	hasRailgun: boolean;
	hasRocket: boolean;
	hasKatana: boolean;
	meleeTimer: number;
	shootCd: number;
	boostCd: number;
	focus: number;
	combo: string;
	parryWindow?: number;
	parryCooldown?: number;
	dodgeCooldown?: number;
	dodgeActive?: number;
	isDodging?: boolean;
	comboCount?: number;
	comboTimer?: number;
	animState?: AnimationState;
}

export function createPlayer(): Player {
	return {
		x: 60,
		y: 420,
		w: 34,
		h: 46,
		vx: 0,
		vy: 0,
		dir: 1,
		onGround: false,
		coyoteLeft: 0,
		jumpBuffered: 0,
		hp: 5,
		maxHp: 5,
		invuln: 0,
		stun: 0,
		fuel: 0,
		maxFuel: 0,
		stims: 0,
		hasRailgun: false,
		hasRocket: false,
		hasKatana: false,
		meleeTimer: 0,
		shootCd: 0,
		boostCd: 0,
		focus: 0,
		combo: 'claws',
		parryWindow: 0,
		parryCooldown: 0,
		dodgeCooldown: 0,
		dodgeActive: 0,
		isDodging: false,
		comboCount: 0,
		comboTimer: 0,
	};
}

export function processMossInput(
	player: Player,
	actionMap: ActionMap,
	dt: number,
	combatSystem: Pick<CombatSystem, 'melee'>
): void {
	// Melee
	if (actionMap.meleePressed && player.meleeTimer <= 0) {
		player.meleeTimer = player.hasKatana ? 0.28 : 0.18;
		player.combo = player.hasKatana ? 'katana' : 'claws';
		combatSystem.melee(player, [], player.combo);
	}

	// Shoot
	if (actionMap.shootPressed && player.hasRailgun && player.shootCd <= 0) {
		player.shootCd = 0.72;
		// Create projectile
		console.log('Railgun fired');
	}

	// Item use
	if (actionMap.itemPressed) {
		if (player.hasRocket && player.fuel > 0 && player.boostCd <= 0) {
			player.fuel--;
			player.boostCd = 0.35;
			// Rocket boost
			player.vy = -400;
			player.onGround = false;
		} else if (player.stims > 0 && player.hp < player.maxHp) {
			player.stims--;
			player.hp = Math.min(player.maxHp, player.hp + 2);
			player.focus = 1.5;
		}
	}

	// Decay timers
	player.meleeTimer = Math.max(0, player.meleeTimer - dt);
	player.shootCd = Math.max(0, player.shootCd - dt);
	player.boostCd = Math.max(0, player.boostCd - dt);
	player.focus = Math.max(0, player.focus - dt);

	// Recharge fuel on ground
	if (player.onGround && player.hasRocket) {
		player.fuel = Math.min(player.maxFuel, player.fuel + dt * 1.75);
	}
}
