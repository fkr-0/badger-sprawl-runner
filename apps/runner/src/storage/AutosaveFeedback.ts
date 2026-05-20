import type { GameFlow } from '../game/GameFlow';
import { type SaveDriver, saveGameFlow } from './SaveStore';

export type AutosaveReason = 'branch-choice' | 'stage-complete' | 'skill-purchase' | 'campaign-complete';

export interface AutosaveFeedback {
	reason: AutosaveReason;
	label: string;
	timestamp: number;
}

const AUTOSAVE_LABELS: Record<AutosaveReason, string> = {
	'branch-choice': 'Autosaved branch choice',
	'stage-complete': 'Autosaved stage progress',
	'skill-purchase': 'Autosaved skill purchase',
	'campaign-complete': 'Autosaved campaign completion',
};

export function autosaveGameFlow(driver: SaveDriver, flow: GameFlow, reason: AutosaveReason): AutosaveFeedback {
	saveGameFlow(driver, flow);
	const feedback: AutosaveFeedback = {
		reason,
		label: AUTOSAVE_LABELS[reason],
		timestamp: Date.now(),
	};
	dispatchAutosaveFeedback(feedback);
	return feedback;
}

export function dispatchAutosaveFeedback(feedback: AutosaveFeedback): void {
	const eventTarget = globalThis as typeof globalThis & {
		dispatchEvent?: (event: Event) => boolean;
		CustomEvent?: typeof CustomEvent;
	};
	const EventCtor = eventTarget.CustomEvent ?? globalThis.CustomEvent;
	if (eventTarget.dispatchEvent && EventCtor) {
		eventTarget.dispatchEvent(new EventCtor('badger:autosave-feedback', { detail: feedback }));
	}
}
