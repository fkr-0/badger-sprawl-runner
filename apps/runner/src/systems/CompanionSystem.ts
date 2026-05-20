import type { Player } from '../actors/MossBadger';
import type { CombatEntity } from './CombatSystem';

export type CompanionId = 'naya_root' | 'rook_null' | 'auntie_subharmonic';

export interface CompanionRuntimeState {
	active: CompanionId[];
	nayaShield: number;
	rookOverlayUntil: number;
	auntieHint: string;
	hintTimer: number;
}

export interface CompanionEvents {
	onShield?: (amount: number) => void;
	onOverlay?: () => void;
	onHint?: (message: string) => void;
}

const DEFAULT_COMPANIONS: CompanionId[] = ['naya_root', 'rook_null', 'auntie_subharmonic'];
const NAYA_SHIELD_MAX = 2;
const NAYA_RECHARGE_PER_SECOND = 0.18;
const ROOK_OVERLAY_SECONDS = 1.6;
const AUNTIE_HINT_SECONDS = 3.5;

export class CompanionSystem {
	private state: CompanionRuntimeState = {
		active: [...DEFAULT_COMPANIONS],
		nayaShield: NAYA_SHIELD_MAX,
		rookOverlayUntil: 0,
		auntieHint: 'Auntie: rent sensors hate rhythm. Move between their blinks.',
		hintTimer: AUNTIE_HINT_SECONDS,
	};

	constructor(active: CompanionId[] = DEFAULT_COMPANIONS) {
		this.state.active = [...active];
	}

	step(player: Player, enemies: CombatEntity[], dt: number, events: CompanionEvents = {}): void {
		if (this.hasCompanion('naya_root')) {
			this.state.nayaShield = Math.min(
				NAYA_SHIELD_MAX,
				this.state.nayaShield + dt * NAYA_RECHARGE_PER_SECOND
			);
		}

		if (this.hasCompanion('rook_null') && enemies.some((enemy) => enemy.hp > 0)) {
			this.state.rookOverlayUntil = ROOK_OVERLAY_SECONDS;
			events.onOverlay?.();
		} else {
			this.state.rookOverlayUntil = Math.max(0, this.state.rookOverlayUntil - dt);
		}

		if (this.hasCompanion('auntie_subharmonic')) {
			this.state.hintTimer = Math.max(0, this.state.hintTimer - dt);
			if (this.state.hintTimer === 0) {
				this.state.auntieHint = this.getContextHint(player, enemies);
				this.state.hintTimer = AUNTIE_HINT_SECONDS;
				events.onHint?.(this.state.auntieHint);
			}
		}
	}

	mitigateDamage(amount: number, events: CompanionEvents = {}): number {
		if (!this.hasCompanion('naya_root') || this.state.nayaShield <= 0 || amount <= 0) {
			return amount;
		}
		const blocked = Math.min(amount, Math.floor(this.state.nayaShield));
		this.state.nayaShield = Math.max(0, this.state.nayaShield - blocked);
		events.onShield?.(blocked);
		return amount - blocked;
	}

	getState(): CompanionRuntimeState {
		return {
			active: [...this.state.active],
			nayaShield: Number(this.state.nayaShield.toFixed(2)),
			rookOverlayUntil: Number(this.state.rookOverlayUntil.toFixed(2)),
			auntieHint: this.state.auntieHint,
			hintTimer: Number(this.state.hintTimer.toFixed(2)),
		};
	}

	private hasCompanion(companionId: CompanionId): boolean {
		return this.state.active.includes(companionId);
	}

	private getContextHint(player: Player, enemies: CombatEntity[]): string {
		if (player.hp <= 2) return 'Auntie: breathe, badger. A stim is cheaper than a funeral.';
		if (enemies.some((enemy) => enemy.hp > 0 && enemy.x > player.x)) {
			return 'Auntie: Rook sees teeth ahead. Keep your claws ready.';
		}
		if (player.hasRocket) return 'Auntie: rocket pack is not escape. It is punctuation.';
		return 'Auntie: make the toll booth sing when you break it.';
	}
}
