/**
 * Physics system: integrates platformer-core package with game entities.
 * Adds game-feel tuning around the deterministic core: buffered/coyote jumps,
 * one-shot jump cutting, apex hang, responsive direction changes and dodge momentum.
 */

import {
	coyoteStep,
	defaultParams,
	gravityStep,
	movementStep,
	platformStep,
} from '@badger/platformer-core';
import type { ActionMap } from './InputSystem';

export interface Entity {
	x: number;
	y: number;
	w: number;
	h: number;
	vx: number;
	vy: number;
	dir: number;
	onGround: boolean;
	coyoteLeft: number;
	jumpBuffered: number;
	hasRocket?: boolean;
	hasRailgun?: boolean;
	hasKatana?: boolean;
	fuel?: number;
	maxFuel?: number;
	stims?: number;
	comboCount?: number;
	comboTimer?: number;
	lastHitTime?: number;
	parryWindow?: number;
	isDodging?: boolean;
	companionHint?: string;
	companionShield?: number;
	rookOverlayActive?: boolean;
	bossPhaseHint?: string;
	airControlMultiplier?: number;
	maxFallSpeedBonus?: number;
	environmentGravityMultiplier?: number;
	environmentAirControlMultiplier?: number;
	environmentMaxFallSpeedDelta?: number;
	landingNoiseMultiplier?: number;

	// Game-feel and presentation state.
	scaleX?: number;
	scaleY?: number;
	squashTime?: number;
	wasOnGround?: boolean;
	justJumped?: boolean;
	justLanded?: boolean;
	jumpCutApplied?: boolean;
	nearApex?: boolean;
}

export interface Platform {
	x: number;
	y: number;
	w: number;
	h: number;
}

export interface PhysicsEvents {
	onJump?: () => void;
	onLand?: (fallDistance: number) => void;
	onCoyoteJump?: () => void;
	onApex?: () => void;
}

const SUPPORT_EPSILON = 2;
const APEX_VELOCITY = 92;
const APEX_GRAVITY_MULTIPLIER = 0.58;
const FALL_GRAVITY_MULTIPLIER = 1.08;
const TURN_ACCEL_MULTIPLIER_GROUND = 1.38;
const TURN_ACCEL_MULTIPLIER_AIR = 1.18;
const JUMP_CUT_MULTIPLIER = 0.48;
const JUMP_CUT_MIN_UPWARD_SPEED = -250;
const DODGE_MAX_SPEED = 440;
const DODGE_FRICTION = 850;

function stunTime(entity: Entity): number {
	return (entity as Entity & { stun?: number }).stun ?? 0;
}

export class PhysicsSystem {
	private maxHeightY = 0;

	step(
		player: Entity,
		platforms: Platform[],
		action: ActionMap,
		dt: number,
		events?: PhysicsEvents
	): void {
		if (!Number.isFinite(dt) || dt < 0) throw new Error(`Invalid physics dt: ${dt}`);
		const wasOnGround = player.onGround;
		const wasNearApex = player.nearApex ?? false;

		this.initializeFeelState(player, wasOnGround);
		player.justJumped = false;
		player.justLanded = false;

		const stunned = stunTime(player) > 0;
		if (action.jumpPressed && !stunned) {
			player.jumpBuffered = defaultParams.jumpBuffer;
		}

		const rawAxisInput = (action.moveRight ? 1 : 0) - (action.moveLeft ? 1 : 0);
		const axisInput = stunned || player.isDodging ? 0 : rawAxisInput;
		if (axisInput !== 0) player.dir = axisInput;

		const canCoyoteJump = player.coyoteLeft > 0 && !player.onGround;
		if (player.jumpBuffered > 0 && (player.onGround || canCoyoteJump) && !stunned) {
			player.vy = defaultParams.jumpVelocity;
			player.onGround = false;
			player.coyoteLeft = 0;
			player.jumpBuffered = 0;
			player.jumpCutApplied = false;
			player.justJumped = true;
			player.scaleX = 0.76;
			player.scaleY = 1.34;
			player.squashTime = 0.12;
			this.maxHeightY = player.y;
			if (canCoyoteJump) events?.onCoyoteJump?.();
			else events?.onJump?.();
		}

		const reversing =
			axisInput !== 0 && Math.sign(player.vx) !== 0 && Math.sign(player.vx) !== axisInput;
		if (reversing) player.vx *= player.onGround ? 0.86 : 0.95;

		const nearApex = !player.onGround && Math.abs(player.vy) <= APEX_VELOCITY;
		player.nearApex = nearApex;
		if (nearApex && !wasNearApex) events?.onApex?.();

		const gravityMultiplier = nearApex
			? APEX_GRAVITY_MULTIPLIER
			: player.vy > 0
				? FALL_GRAVITY_MULTIPLIER
				: 1;
		const runtimeParams = {
			...defaultParams,
			gravity:
				defaultParams.gravity *
				gravityMultiplier *
				(player.environmentGravityMultiplier ?? 1),
			runAccelGround: defaultParams.runAccelGround * (reversing ? TURN_ACCEL_MULTIPLIER_GROUND : 1),
			runAccelAir:
				defaultParams.runAccelAir *
				(player.airControlMultiplier ?? 1) *
				(player.environmentAirControlMultiplier ?? 1) *
				(reversing ? TURN_ACCEL_MULTIPLIER_AIR : 1),
			friction: player.isDodging ? DODGE_FRICTION : defaultParams.friction,
			maxRunSpeed: player.isDodging ? DODGE_MAX_SPEED : defaultParams.maxRunSpeed,
			maxFallSpeed: Math.max(
				240,
				defaultParams.maxFallSpeed +
					(player.maxFallSpeedBonus ?? 0) +
					(player.environmentMaxFallSpeedDelta ?? 0)
			),
		};

		const travelVy = player.vy;
		const movementResult = movementStep({
			vx: player.vx,
			vy: player.vy,
			x: player.x,
			y: player.y,
			onGround: player.onGround,
			axisInput,
			isFastFalling: action.fastFall && !stunned,
			params: runtimeParams,
			dt,
		});
		Object.assign(player, movementResult);
		player.vy = gravityStep(player.vy, runtimeParams, dt);

		if (
			!action.jump &&
			player.vy < JUMP_CUT_MIN_UPWARD_SPEED &&
			!player.jumpCutApplied &&
			!player.onGround
		) {
			player.vy = Math.max(player.vy * JUMP_CUT_MULTIPLIER, JUMP_CUT_MIN_UPWARD_SPEED);
			player.jumpCutApplied = true;
		}

		if (!player.onGround && !player.isDodging) player.vx *= 0.994;

		const impactVelocity = player.vy;
		const platformResult = platformStep({
			x: player.x,
			y: player.y,
			w: player.w,
			h: player.h,
			vx: player.vx,
			vy: player.vy,
			prevVy: travelVy,
			dt,
			platforms,
			coyoteTime: defaultParams.coyote,
		});

		const support = platforms.find((platform) => {
			const bottom = player.y + player.h;
			const horizontallySupported =
				player.x + player.w > platform.x && player.x < platform.x + platform.w;
			return (
				horizontallySupported && player.vy >= 0 && Math.abs(bottom - platform.y) <= SUPPORT_EPSILON
			);
		});

		if (platformResult.onGround || support) {
			if (!wasOnGround) {
				const fallDistance = Math.max(0, player.y - this.maxHeightY);
				player.justLanded = true;
				const impactForce = Math.min(Math.abs(impactVelocity) / 520, 1);
				if (impactForce > 0.08) {
					player.scaleX = 1.16 + impactForce * 0.14;
					player.scaleY = 0.84 - impactForce * 0.1;
					player.squashTime = 0.12 + impactForce * 0.08;
					events?.onLand?.(fallDistance);
				}
			}
			player.y = support ? support.y - player.h : platformResult.y;
			player.vy = 0;
			player.onGround = true;
			player.coyoteLeft = platformResult.coyoteLeft;
			player.jumpCutApplied = false;
			player.nearApex = false;
			this.maxHeightY = player.y;
		} else {
			player.onGround = false;
			if (player.y < this.maxHeightY) this.maxHeightY = player.y;
		}

		const coyoteResult = coyoteStep({
			onGround: player.onGround,
			coyoteLeft: player.coyoteLeft,
			jumpBuffered: player.jumpBuffered,
			params: defaultParams,
			dt,
		});
		player.coyoteLeft = coyoteResult.coyoteLeft;
		player.jumpBuffered = coyoteResult.jumpBuffered;

		this.recoverSquash(player, dt);
		player.wasOnGround = player.onGround;
		player.x = Math.max(0, player.x);
	}

	isAlive(entity: Entity, worldHeight: number): boolean {
		return entity.y < worldHeight + 200;
	}

	getFallDistance(entity: Entity): number {
		return entity.y - this.maxHeightY;
	}

	private initializeFeelState(player: Entity, wasOnGround: boolean): void {
		player.scaleX ??= 1;
		player.scaleY ??= 1;
		player.squashTime ??= 0;
		player.wasOnGround ??= wasOnGround;
		player.justJumped ??= false;
		player.justLanded ??= false;
		player.jumpCutApplied ??= false;
		player.nearApex ??= false;
	}

	private recoverSquash(player: Entity, dt: number): void {
		if ((player.squashTime ?? 0) <= 0) {
			player.scaleX = 1;
			player.scaleY = 1;
			return;
		}
		player.squashTime = Math.max(0, (player.squashTime ?? 0) - dt);
		const recovery = Math.min(1, (player.squashTime ?? 0) / 0.14);
		if (player.justJumped) {
			player.scaleX = 0.76 + (1 - recovery) * 0.24;
			player.scaleY = 1.34 - (1 - recovery) * 0.34;
		} else {
			player.scaleX = 1 + recovery * 0.2;
			player.scaleY = 1 - recovery * 0.18;
		}
	}
}
