/**
 * TrainingDummy - invincible damage test target
 */

import type { DummyPresetId } from '../game/TrainingMode';
import type { CombatEntity } from '../systems/CombatSystem';
import type { Entity } from '../systems/PhysicsSystem';

export interface TrainingDummy extends Entity, CombatEntity {
	isDummy: true;
	flashTimer: number;
	lastHitTime: number;
	presetId: DummyPresetId;
	spawnX: number;
	spawnY: number;
	behaviorTime: number;
	attackClock: number;
	attackTelegraph: number;
}

export function createTrainingDummy(
	x: number,
	y: number,
	presetId: DummyPresetId = 'idle'
): TrainingDummy {
	return {
		id: 'training-dummy',
		x,
		y,
		w: 40,
		h: 50,
		vx: 0,
		vy: 0,
		dir: 1,
		onGround: true,
		coyoteLeft: 0,
		jumpBuffered: 0,

		// Combat properties
		hp: Number.POSITIVE_INFINITY,
		maxHp: Number.POSITIVE_INFINITY,
		invuln: 0,
		stun: 0,
		faction: 'enemy',
		usesPatternController: true,
		spriteSheetId: 'moss_badger_production',
		spriteAnimation: 'idle',

		// Dummy-specific
		isDummy: true,
		flashTimer: 0,
		lastHitTime: 0,
		presetId,
		spawnX: x,
		spawnY: y,
		behaviorTime: 0,
		attackClock: 0,
		attackTelegraph: 0,
	};
}

export interface TrainingDummyStepResult {
	attackFired: boolean;
	attackTelegraph: number;
}

export function configureTrainingDummy(dummy: TrainingDummy, presetId: DummyPresetId): void {
	dummy.presetId = presetId;
	dummy.behaviorTime = 0;
	dummy.attackClock = 0;
	dummy.attackTelegraph = 0;
	dummy.x = dummy.spawnX;
	dummy.y = dummy.spawnY;
	dummy.vx = 0;
	dummy.vy = 0;
	dummy.armor = presetId === 'armored' ? 0.55 : 0;
	dummy.guardMultiplier = presetId === 'armored' ? 0.42 : 1;
	dummy.spriteAnimation = presetId === 'attacking' ? 'melee_claws' : 'idle';
}

export function processTrainingDummy(dummy: TrainingDummy, dt: number): TrainingDummyStepResult {
	// Decay flash timer
	dummy.flashTimer = Math.max(0, dummy.flashTimer - dt);
	dummy.invuln = Math.max(0, dummy.invuln - dt);
	dummy.stun = Math.max(0, dummy.stun - dt);
	dummy.behaviorTime += dt;
	dummy.attackClock += dt;
	dummy.attackTelegraph = 0;
	let attackFired = false;

	switch (dummy.presetId) {
		case 'walking':
			dummy.x = dummy.spawnX + Math.sin(dummy.behaviorTime * 1.35) * 92;
			dummy.y = dummy.spawnY;
			dummy.dir = Math.cos(dummy.behaviorTime * 1.35) >= 0 ? 1 : -1;
			dummy.spriteAnimation = 'run';
			break;
		case 'jumping':
			dummy.x = dummy.spawnX;
			dummy.y = dummy.spawnY - Math.abs(Math.sin(dummy.behaviorTime * 2.2)) * 84;
			dummy.spriteAnimation = dummy.y < dummy.spawnY - 30 ? 'jump_up' : 'land';
			break;
		case 'flying':
			dummy.x = dummy.spawnX + Math.sin(dummy.behaviorTime * 0.85) * 54;
			dummy.y = dummy.spawnY - 104 + Math.sin(dummy.behaviorTime * 1.7) * 18;
			dummy.spriteAnimation = 'fall';
			break;
		case 'attacking': {
			const cycle = dummy.attackClock % 1.5;
			dummy.attackTelegraph = cycle >= 0.92 && cycle < 1.28 ? (cycle - 0.92) / 0.36 : 0;
			if (dummy.attackClock >= 1.28) {
				dummy.attackClock = 0;
				attackFired = true;
			}
			dummy.x = dummy.spawnX;
			dummy.y = dummy.spawnY;
			dummy.spriteAnimation = dummy.attackTelegraph > 0 ? 'melee_claws' : 'idle';
			break;
		}
		default:
			dummy.x = dummy.spawnX;
			dummy.y = dummy.spawnY;
			dummy.spriteAnimation = dummy.presetId === 'armored' ? 'parry' : 'idle';
			break;
	}

	dummy.vx = 0;
	dummy.vy = 0;
	dummy.hp = Number.POSITIVE_INFINITY;
	dummy.maxHp = Number.POSITIVE_INFINITY;
	return { attackFired, attackTelegraph: dummy.attackTelegraph };
}

export function hitTrainingDummy(dummy: TrainingDummy, timeMs = performance.now()): void {
	dummy.flashTimer = 0.15;
	dummy.lastHitTime = timeMs;
	dummy.stun = 0.2;
	dummy.hp = Number.POSITIVE_INFINITY;
}
