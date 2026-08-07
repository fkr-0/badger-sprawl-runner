import {
	colorAuthorityGraph,
	proveByContradiction,
} from '../game/adventure/AlgorithmicCivicSystems';
import type { BossPhaseRuntimeState } from './BossPhaseSystem';
import type { CombatEntity } from './CombatSystem';
import type { ActionMap } from './InputSystem';

export type DirectorVaneAction =
	| 'competence-proof'
	| 'chromatic-lock'
	| 'counterclaim'
	| 'ownership-collapse'
	| 'defeated';

export interface DirectorVaneSnapshot {
	action: DirectorVaneAction;
	phaseIndex: number;
	commandIntegrity: number;
	broadcastIntegrity: number;
	colorCount: number;
	activeColor: number;
	routeWindowOpen: boolean;
	contradictionClosed: boolean;
	witnessInterruptions: number;
	coalitionEvidenceCount: number;
	argument: string;
	animation: string;
}

export type DirectorVaneEvent =
	| { kind: 'vane-phase-transition'; phaseIndex: number; action: DirectorVaneAction }
	| { kind: 'vane-color-window'; color: number; open: boolean }
	| { kind: 'vane-contradiction-closed'; proofTrace: string[] }
	| { kind: 'vane-witness-interruption'; count: number }
	| { kind: 'vane-doctrine-unprotected' }
	| { kind: 'vane-defeated' };

export interface DirectorVaneCoalitionInput {
	witnessCount: number;
	coalitionEvidenceCount: number;
	doctrineGrounded: boolean;
}

const SKYLOCK_COLORING = colorAuthorityGraph({
	nodeIds: ['city-root', 'colony-root', 'lift-root', 'archive-root', 'forecast-root'],
	edges: [
		['city-root', 'colony-root'],
		['city-root', 'lift-root'],
		['colony-root', 'archive-root'],
		['lift-root', 'archive-root'],
		['archive-root', 'forecast-root'],
		['forecast-root', 'city-root'],
	],
});

const COMPLETENESS_PROOF = {
	facts: ['protected-appeal-exists', 'skylock-executed-route'],
	assumption: 'skylock-model-is-complete',
	implications: [
		{
			id: 'complete-represents-every-appeal',
			when: ['skylock-model-is-complete', 'protected-appeal-exists'],
			// biome-ignore lint/suspicious/noThenProperty: declarative implication schema, not a promise.
			then: 'protected-appeal-represented',
			reason: 'a complete command model represents every valid protected appeal',
		},
		{
			id: 'execution-omitted-the-appeal',
			when: ['protected-appeal-exists', 'skylock-executed-route'],
			// biome-ignore lint/suspicious/noThenProperty: declarative implication schema, not a promise.
			then: 'protected-appeal-not-represented',
			reason: 'Skylock executed the route without the appeal entering its decision state',
		},
	],
	exclusivePairs: [['protected-appeal-represented', 'protected-appeal-not-represented']] as const,
};

export class DirectorVaneController {
	private action: DirectorVaneAction = 'competence-proof';
	private phaseIndex = 0;
	private elapsed = 0;
	private commandIntegrity = 1;
	private broadcastIntegrity = 1;
	private activeColor = 0;
	private routeWindowOpen = true;
	private contradictionClosed = false;
	private witnessInterruptions = 0;
	private coalitionEvidenceCount = 0;
	private defeatEmitted = false;
	private introEmitted = false;
	private lastWindowOpen = true;

	step(
		boss: CombatEntity | undefined,
		phase: BossPhaseRuntimeState | null,
		action: ActionMap,
		dt: number,
		coalition: DirectorVaneCoalitionInput
	): DirectorVaneEvent[] {
		if (!boss) return [];
		const events: DirectorVaneEvent[] = [];
		const safeDt = Math.max(0, dt);
		this.elapsed += safeDt;
		this.coalitionEvidenceCount = Math.max(0, Math.floor(coalition.coalitionEvidenceCount));
		const nextPhase = phase?.phaseIndex ?? phaseFromHealth(boss);
		if (boss.hp <= 0) {
			this.action = 'defeated';
			boss.vx = 0;
			this.applyPresentation(boss);
			if (!this.defeatEmitted) {
				this.defeatEmitted = true;
				events.push({ kind: 'vane-defeated' });
			}
			return events;
		}
		if (!this.introEmitted) {
			this.introEmitted = true;
			events.push({ kind: 'vane-phase-transition', phaseIndex: 0, action: 'competence-proof' });
		}
		if (nextPhase !== this.phaseIndex) {
			this.phaseIndex = nextPhase;
			this.action = actionForPhase(nextPhase);
			events.push({ kind: 'vane-phase-transition', phaseIndex: nextPhase, action: this.action });
		}

		if (this.phaseIndex === 0) {
			this.commandIntegrity = clamp01(
				this.commandIntegrity - safeDt * Math.min(0.08, this.coalitionEvidenceCount * 0.012)
			);
		}
		if (this.phaseIndex === 1) {
			const colorDuration = 0.9;
			this.activeColor = Math.floor(this.elapsed / colorDuration) % SKYLOCK_COLORING.colorCount;
			this.routeWindowOpen =
				Object.values(SKYLOCK_COLORING.assignment).filter((color) => color === this.activeColor)
					.length >= 2;
			if (this.routeWindowOpen !== this.lastWindowOpen) {
				this.lastWindowOpen = this.routeWindowOpen;
				events.push({
					kind: 'vane-color-window',
					color: this.activeColor,
					open: this.routeWindowOpen,
				});
			}
		}
		if (this.phaseIndex === 2 && action.hackPressed && !this.contradictionClosed) {
			const proof = proveByContradiction(COMPLETENESS_PROOF);
			this.contradictionClosed = proof.closed;
			if (proof.closed) {
				this.commandIntegrity = clamp01(this.commandIntegrity - 0.34);
				events.push({ kind: 'vane-contradiction-closed', proofTrace: proof.proofTrace });
			}
		}
		if (this.phaseIndex >= 3) {
			const availableWitnesses = Math.max(0, Math.floor(coalition.witnessCount));
			if (availableWitnesses > this.witnessInterruptions) {
				this.witnessInterruptions = availableWitnesses;
				this.commandIntegrity = clamp01(this.commandIntegrity - availableWitnesses * 0.08);
				events.push({ kind: 'vane-witness-interruption', count: availableWitnesses });
			}
			if (!coalition.doctrineGrounded) {
				this.broadcastIntegrity = clamp01(this.broadcastIntegrity - safeDt * 0.18);
				if (this.broadcastIntegrity <= 0.5 && this.broadcastIntegrity + safeDt * 0.18 > 0.5) {
					events.push({ kind: 'vane-doctrine-unprotected' });
				}
			} else {
				this.broadcastIntegrity = clamp01(this.broadcastIntegrity + safeDt * 0.06);
			}
		}
		boss.vx *= 0.88;
		this.applyPresentation(boss);
		return events;
	}

	getSnapshot(): DirectorVaneSnapshot {
		return {
			action: this.action,
			phaseIndex: this.phaseIndex,
			commandIntegrity: round(this.commandIntegrity),
			broadcastIntegrity: round(this.broadcastIntegrity),
			colorCount: SKYLOCK_COLORING.colorCount,
			activeColor: this.activeColor,
			routeWindowOpen: this.routeWindowOpen,
			contradictionClosed: this.contradictionClosed,
			witnessInterruptions: this.witnessInterruptions,
			coalitionEvidenceCount: this.coalitionEvidenceCount,
			argument: argumentForAction(this.action),
			animation: animationForAction(this.action),
		};
	}

	private applyPresentation(boss: CombatEntity): void {
		boss.usesPatternController = true;
		boss.bossAction = this.action;
		boss.bossAnimation = animationForAction(this.action);
		boss.bossTelegraph = this.action === 'chromatic-lock' && !this.routeWindowOpen ? 0.9 : 0;
	}
}

function phaseFromHealth(boss: CombatEntity): number {
	const ratio = boss.maxHp > 0 ? boss.hp / boss.maxHp : 0;
	if (ratio <= 0.25) return 3;
	if (ratio <= 0.5) return 2;
	if (ratio <= 0.75) return 1;
	return 0;
}

function actionForPhase(phaseIndex: number): DirectorVaneAction {
	if (phaseIndex >= 3) return 'ownership-collapse';
	if (phaseIndex === 2) return 'counterclaim';
	if (phaseIndex === 1) return 'chromatic-lock';
	return 'competence-proof';
}

function argumentForAction(action: DirectorVaneAction): string {
	switch (action) {
		case 'competence-proof':
			return 'Someone must optimize the sky. Competence is merely authority with benchmarks.';
		case 'chromatic-lock':
			return 'Conflicting institutions require a coloring; therefore the color assignment requires an owner.';
		case 'counterclaim':
			return 'Any appeal absent from the model was never valid enough to count.';
		case 'ownership-collapse':
			return 'A chorus is still a controller with worse meeting discipline.';
		case 'defeated':
			return 'The command channel remains, but ownership no longer follows from operation.';
	}
}

function animationForAction(action: DirectorVaneAction): string {
	if (action === 'defeated') return 'defeat';
	if (action === 'chromatic-lock') return 'signature_attack';
	if (action === 'counterclaim') return 'attack';
	if (action === 'ownership-collapse') return 'phase_transition';
	return 'phase_intro';
}

function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value));
}

function round(value: number): number {
	return Math.round(value * 1000) / 1000;
}
