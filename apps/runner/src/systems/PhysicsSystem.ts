/**
 * Physics system: integrates platformer-core package with game entities
 * State-of-the-art platformer physics with coyote time, jump buffering,
 * variable jump height, air control, and squash/stretch
 */

import { gravityStep, movementStep, platformStep, coyoteStep, aabb } from '@badger/platformer-core';
import { defaultParams } from '@badger/platformer-core';
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

	// Visual juice properties
	scaleX?: number;
	scaleY?: number;
	squashTime?: number;
	wasOnGround?: boolean;
	justJumped?: boolean;
	justLanded?: boolean;
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
		const wasOnGround = player.onGround;
		const prevY = player.y;

		// Initialize juice properties
		if (player.scaleX === undefined) player.scaleX = 1;
		if (player.scaleY === undefined) player.scaleY = 1;
		if (player.squashTime === undefined) player.squashTime = 0;
		if (player.wasOnGround === undefined) player.wasOnGround = wasOnGround;
		if (player.justJumped === undefined) player.justJumped = false;
		if (player.justLanded === undefined) player.justLanded = false;

		// Reset flags
		player.justJumped = false;
		player.justLanded = false;

		// Jump buffering - small window to queue jump input
		if (action.jumpPressed) {
			player.jumpBuffered = defaultParams.jumpBuffer;
		}

		// Horizontal input with deadzone for precision
		const axisInput = (action.moveRight ? 1 : 0) - (action.moveLeft ? 1 : 0);
		if (axisInput !== 0) player.dir = axisInput;

		// Enhanced movement with better air control
		const movementResult = movementStep({
			vx: player.vx,
			vy: player.vy,
			x: player.x,
			y: player.y,
			onGround: player.onGround,
			axisInput,
			isFastFalling: action.fastFall,
			params: defaultParams,
			dt,
		});
		Object.assign(player, movementResult);

		// Gravity
		player.vy = gravityStep(player.vy, defaultParams, dt);

		// Coyote jump - can jump shortly after leaving platform
		const canCoyoteJump = player.coyoteLeft > 0 && !player.onGround;

		// Execute jump
		if (player.jumpBuffered > 0 && (player.onGround || canCoyoteJump)) {
			player.vy = defaultParams.jumpVelocity;
			player.onGround = false;
			player.coyoteLeft = 0;
			player.jumpBuffered = 0;
			player.justJumped = true;

			// Jump squash and stretch
			player.scaleX = 0.75;
			player.scaleY = 1.35;
			player.squashTime = 0.12;

			if (canCoyoteJump) {
				events?.onCoyoteJump?.();
			} else {
				events?.onJump?.();
			}

			// Track max height for fall damage calculation
			this.maxHeightY = player.y;
		}

		// Variable jump height - holding jump goes higher
		const jumpReleaseThreshold = defaultParams.jumpVelocity * defaultParams.variableJumpCut;
		if (!action.jump && player.vy < jumpReleaseThreshold) {
			player.vy *= 0.52; // Quick velocity cut for snappy feel
		}

		// Air damping - slight horizontal resistance in air for control
		if (!player.onGround) {
			player.vx *= 0.992;
		}

		// Platform collision with one-way support
		const prevVy = player.vy - defaultParams.gravity * dt;
		const platformResult = platformStep({
			x: player.x,
			y: player.y,
			w: player.w,
			h: player.h,
			vx: player.vx,
			vy: player.vy,
			prevVy,
			dt,
			platforms,
			coyoteTime: defaultParams.coyote,
		});

		if (platformResult.onGround) {
			if (!player.onGround) {
				// Just landed
				const fallDistance = player.y - this.maxHeightY;
				player.justLanded = true;

				// Landing squash based on impact velocity
				const impactForce = Math.min(Math.abs(prevVy) / 400, 1);
				if (impactForce > 0.1) {
					player.scaleX = 1.2 + impactForce * 0.15;
					player.scaleY = 0.8 - impactForce * 0.1;
					player.squashTime = 0.14 + impactForce * 0.08;
					events?.onLand?.(fallDistance);
				}
			}

			player.y = platformResult.y;
			player.vy = 0;
			player.onGround = true;
			player.coyoteLeft = platformResult.coyoteLeft;
			this.maxHeightY = player.y; // Reset max height
		} else {
			player.onGround = false;
			// Track highest point (lowest Y value)
			if (player.y < this.maxHeightY) {
				this.maxHeightY = player.y;
			}
		}

		// Coyote and jump buffer decay
		const coyoteResult = coyoteStep({
			onGround: player.onGround,
			coyoteLeft: player.coyoteLeft,
			jumpBuffered: player.jumpBuffered,
			params: defaultParams,
			dt,
		});
		player.coyoteLeft = coyoteResult.coyoteLeft;
		player.jumpBuffered = coyoteResult.jumpBuffered;

		// Animate squash and stretch recovery
		if (player.squashTime > 0) {
			player.squashTime -= dt;
			const recovery = player.squashTime / 0.12; // Normalized recovery

			if (player.justJumped) {
				// Stretch to squash recovery
				player.scaleX = 0.75 + (1 - recovery) * 0.25;
				player.scaleY = 1.35 - (1 - recovery) * 0.35;
			} else if (player.justLanded || player.squashTime > 0) {
				// Squash recovery
				player.scaleX = 1 + recovery * 0.2;
				player.scaleY = 1 - recovery * 0.2;
			} else {
				player.scaleX = 1;
				player.scaleY = 1;
			}
		} else {
			player.scaleX = 1;
			player.scaleY = 1;
		}

		// Store previous ground state
		player.wasOnGround = player.onGround;

		// World bounds
		player.x = Math.max(0, player.x);
	}

	// Check if entity is in valid state (not fallen off world)
	isAlive(entity: Entity, worldHeight: number): boolean {
		return entity.y < worldHeight + 200;
	}

	// Get current fall distance for damage calculations
	getFallDistance(entity: Entity): number {
		return entity.y - this.maxHeightY;
	}
}
