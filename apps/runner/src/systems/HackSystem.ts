/**
 * HackSystem - manages hacking mechanics and matrix powers
 */

import type { Entity } from './PhysicsSystem';
import { createCodeGate, type MiniGameSpec } from '@badger/codegate';

export interface Hackable {
	id: string;
	x: number;
	y: number;
	tier: number;
	state: 'hostile' | 'neutral' | 'hacked' | 'unstable';
	range: number;
	hackCommand?: MiniGameSpec;
}

export interface HackResult {
	success: boolean;
	effect: string;
	heatDelta: number;
}

export class HackSystem {
	private hackables: Hackable[] = [];
	private activeCodeGate: ReturnType<typeof createCodeGate> | null = null;
	private hackMode: 'none' | 'quick' | 'aimed' | 'command' = 'none';
	private aimedTimer = 0;
	private targetLock: Hackable | null = null;

	registerHackable(hackable: Hackable): void {
		this.hackables.push(hackable);
	}

	removeHackable(id: string): void {
		this.hackables = this.hackables.filter((h) => h.id !== id);
	}

	step(player: Entity, dt: number): void {
		// Update aimed hack timer
		if (this.hackMode === 'aimed') {
			this.aimedTimer -= dt;
			if (this.aimedTimer <= 0) {
				this.hackMode = 'none';
				this.targetLock = null;
			}
		}
	}

	quickHack(player: Entity): HackResult | null {
		const target = this.findNearestHackable(player);
		if (!target) return null;

		// Quick hack automatically succeeds on Tier 0
		if (target.tier === 0) {
			target.state = 'hacked';
			return { success: true, effect: 'hacked', heatDelta: -1 };
		}

		return null;
	}

	startAimedHack(player: Entity): void {
		this.hackMode = 'aimed';
		this.aimedTimer = 1.5; // 1.5 seconds
		this.targetLock = this.findNearestHackable(player);
	}

	startCommandHack(player: Entity): boolean {
		const target = this.findNearestHackable(player);
		if (!target || !target.hackCommand) return false;

		this.activeCodeGate = createCodeGate(target.hackCommand);
		this.hackMode = 'command';
		return true;
	}

	submitCodeInput(input: string): HackResult | null {
		if (!this.activeCodeGate) return null;

		const result = this.activeCodeGate.submitInput(input);
		if (result) {
			if (result.outcome === 'clean' || result.outcome === 'normal') {
				// Apply hack effect
				if (this.targetLock) {
					this.targetLock.state = 'hacked';
				}
				this.activeCodeGate = null;
				this.hackMode = 'none';
				return { success: true, effect: 'hacked', heatDelta: result.heatDelta };
			}
		}

		return null;
	}

	private findNearestHackable(player: Entity): Hackable | null {
		let nearest: Hackable | null = null;
		let nearestDist = Number.POSITIVE_INFINITY;

		for (const hackable of this.hackables) {
			const dx = hackable.x - player.x;
			const dy = hackable.y - player.y;
			const dist = Math.sqrt(dx * dx + dy * dy);

			if (dist < hackable.range && dist < nearestDist) {
				nearest = hackable;
				nearestDist = dist;
			}
		}

		return nearest;
	}

	getHackMode(): typeof this.hackMode {
		return this.hackMode;
	}

	getTargetLock(): Hackable | null {
		return this.targetLock;
	}

	getCodeGateState(): ReturnType<typeof createCodeGate> | null {
		return this.activeCodeGate;
	}

	// Matrix powers
	applyMatrixPower(powerId: string, target: Hackable): boolean {
		switch (powerId) {
			case 'street_senses':
				// Extended hack range
				target.range *= 1.5;
				return true;

			case 'remote_tap':
				// Remote door open
				if (target.tier <= 1) {
					target.state = 'hacked';
					return true;
				}
				return false;

			default:
				return false;
		}
	}

	clear(): void {
		this.hackables = [];
		this.activeCodeGate = null;
		this.hackMode = 'none';
		this.targetLock = null;
	}
}
