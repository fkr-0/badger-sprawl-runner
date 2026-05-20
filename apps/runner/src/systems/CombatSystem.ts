/**
 * Combat system: hitboxes, hurtboxes, damage, parry, dodge, combos
 * State-of-the-art combat with hitstop, screen shake, and combo tracking
 */

import { aabb } from '@badger/platformer-core';
import type { Entity } from './PhysicsSystem';

export interface CombatEntity extends Entity {
	hp: number;
	maxHp: number;
	invuln: number;
	stun: number;

	// Enhanced combat properties
	parryWindow?: number;
	parryCooldown?: number;
	dodgeCooldown?: number;
	dodgeActive?: number;
	isDodging?: boolean;
	comboCount?: number;
	comboTimer?: number;
	lastHitTime?: number;
	rookMarked?: boolean;
	bossPhaseLabel?: string;
	bossPhaseMechanic?: string;
	bossPhaseIndex?: number;
	bossId?: string;
	bossName?: string;
	bossArgument?: string;
	isBossPlaceholder?: boolean;
	procgenFamily?: string;
	procgenRole?: string;
	procgenAffixes?: string[];
}

export interface HitboxSet {
	attack: { x: number; y: number; w: number; h: number } | null;
	hurt: { x: number; y: number; w: number; h: number };
}

export interface CombatEvent {
	kind: 'hit' | 'kill' | 'parry' | 'dodge' | 'damage';
	source?: 'player' | 'enemy';
	damage?: number;
	combo?: number;
}

export interface CombatEvents {
	onEvent?: (event: CombatEvent) => void;
	requestHitstop?: (duration: number) => void;
	requestScreenShake?: (intensity: number) => void;
	mitigateDamage?: (amount: number) => number;
}

export class CombatSystem {
	private lastAction: { kind: string; time: number } | null = null;
	private comboWindow = 1.2; // Seconds to maintain combo
	private maxCombo = 5;

	step(
		player: CombatEntity,
		enemies: CombatEntity[],
		actionMap: Record<string, boolean>,
		dt: number,
		events?: CombatEvents
	): void {
		// Initialize combat properties
		if (player.parryWindow === undefined) player.parryWindow = 0;
		if (player.parryCooldown === undefined) player.parryCooldown = 0;
		if (player.dodgeCooldown === undefined) player.dodgeCooldown = 0;
		if (player.dodgeActive === undefined) player.dodgeActive = 0;
		if (player.isDodging === undefined) player.isDodging = false;
		if (player.comboCount === undefined) player.comboCount = 0;
		if (player.comboTimer === undefined) player.comboTimer = 0;
		if (player.lastHitTime === undefined) player.lastHitTime = 0;

		// Decay timers
		player.invuln = Math.max(0, player.invuln - dt);
		player.stun = Math.max(0, player.stun - dt);
		player.parryWindow = Math.max(0, player.parryWindow - dt);
		player.parryCooldown = Math.max(0, player.parryCooldown - dt);
		player.dodgeCooldown = Math.max(0, player.dodgeCooldown - dt);
		player.dodgeActive = Math.max(0, player.dodgeActive - dt);
		player.comboTimer = Math.max(0, player.comboTimer - dt);

		// Update dodge state
		player.isDodging = player.dodgeActive > 0;

		// Reset combo if window expired
		if (player.comboTimer <= 0) {
			player.comboCount = 0;
		}

		// Handle parry input
		if (actionMap.parryPressed && player.parryCooldown <= 0 && !player.onGround) {
			player.parryWindow = 0.15; // 150ms parry window
			player.parryCooldown = 0.4;
			events?.onEvent?.({ kind: 'parry', source: 'player' });
		}

		// Handle dodge input
		if (actionMap.dodgePressed && player.dodgeCooldown <= 0 && player.onGround) {
			player.dodgeActive = 0.25; // 250ms dodge duration
			player.dodgeCooldown = 0.5;
			player.invuln = 0.3; // Brief invincibility
			events?.onEvent?.({ kind: 'dodge', source: 'player' });
			events?.requestScreenShake?.(3);
		}

		for (const enemy of enemies) {
			// Initialize enemy combat properties
			if (enemy.parryWindow === undefined) enemy.parryWindow = 0;
			if (enemy.invuln === undefined) enemy.invuln = 0;
			if (enemy.stun === undefined) enemy.stun = 0;

			enemy.invuln = Math.max(0, enemy.invuln - dt);
			enemy.stun = Math.max(0, enemy.stun - dt);
			enemy.parryWindow = Math.max(0, enemy.parryWindow - dt);

			// Player collision with enemy
			if (player.invuln <= 0 && enemy.stun <= 0) {
				if (this.checkCollision(player, enemy)) {
					// Check for parry
					if (player.parryWindow > 0) {
						this.parry(player, enemy, events);
					} else if (!player.isDodging) {
						this.damage(player, 1, events);
					}
				}
			}
		}
	}

	getLastAction(): { kind: string; time: number } | null {
		return this.lastAction;
	}

	getComboCount(): number {
		return 0; // Would return player combo count
	}

	melee(player: Entity, enemies: CombatEntity[], combo: string, events?: CombatEvents): void {
		const hitbox = this.getMeleeHitbox(player, combo);

		// Record action for animation system
		this.lastAction = { kind: 'melee', time: Date.now() };

		let hitCount = 0;

		for (const enemy of enemies) {
			if (enemy.hp > 0 && enemy.stun <= 0 && aabb(hitbox, enemy)) {
				const damage = combo === 'katana' ? 2 : 1;

				// Check enemy parry
				if ((enemy.parryWindow ?? 0) > 0) {
					// Enemy parried - bounce back
					player.vx = -player.dir * 100;
					events?.onEvent?.({ kind: 'parry', source: 'enemy' });
					events?.requestHitstop?.(0.08);
					continue;
				}

				enemy.hp -= damage;
				enemy.stun = 0.45;
				enemy.vx += player.dir * 150;
				player.vx -= player.dir * 35;

				hitCount++;

				// Increment combo
				if (player.comboCount !== undefined) {
					player.comboCount = Math.min(this.maxCombo, player.comboCount + 1);
					player.comboTimer = this.comboWindow;
					player.lastHitTime = Date.now();
				}

				events?.onEvent?.({
					kind: enemy.hp <= 0 ? 'kill' : 'hit',
					source: 'player',
					damage,
					combo: player.comboCount,
				});

				// Hitstop and screen shake based on combo
				const hitstopDuration = 0.04 + (player.comboCount || 0) * 0.02;
				events?.requestHitstop?.(Math.min(hitstopDuration, 0.15));
				events?.requestScreenShake?.(5 + (player.comboCount || 0) * 2);
			}
		}

		// Miss penalty - reduce combo timer slightly
		if (hitCount === 0 && player.comboCount !== undefined && player.comboCount > 0) {
			player.comboTimer = Math.max(0, (player.comboTimer ?? 0) - 0.2);
		}
	}

	private parry(player: CombatEntity, enemy: CombatEntity, events?: CombatEvents): void {
		// Perfect parry - reflect damage
		enemy.hp -= 1;
		enemy.stun = 0.8;
		enemy.vx = player.dir * 250;

		player.parryWindow = 0;
		events?.requestHitstop?.(0.12);
		events?.requestScreenShake?.(8);
		events?.onEvent?.({ kind: 'hit', source: 'player', damage: 1 });
	}

	private getMeleeHitbox(
		player: Entity,
		combo: string
	): { x: number; y: number; w: number; h: number } {
		const w = combo === 'katana' ? 50 : 42;
		const h = combo === 'katana' ? 32 : 28;
		return {
			x: player.x + (player.dir > 0 ? player.w : -w),
			y: player.y + 8,
			w,
			h,
		};
	}

	private checkCollision(a: Entity, b: Entity): boolean {
		return aabb(a, b);
	}

	private damage(entity: CombatEntity, amount: number, events?: CombatEvents): void {
		const finalAmount = events?.mitigateDamage?.(amount) ?? amount;
		if (finalAmount <= 0) {
			entity.invuln = Math.max(entity.invuln, 0.35);
			return;
		}
		entity.hp -= finalAmount;
		entity.invuln = 1.1;
		events?.onEvent?.({
			kind: 'damage',
			source: 'enemy',
			damage: finalAmount,
		});
		events?.requestScreenShake?.(6);
		events?.requestHitstop?.(0.06);
	}

	// Check if entity can be hit
	canHit(entity: CombatEntity): boolean {
		return entity.invuln <= 0 && !entity.isDodging;
	}

	// Get combo multiplier for damage calculations
	getComboMultiplier(comboCount: number): number {
		return 1 + comboCount * 0.1; // 10% bonus damage per combo level
	}
}
