import {
	type ArcadePersistenceFeedback,
	createPersistenceFeedback,
} from '../../../../vendor/arcade-runtime.mjs';
import type { GameFlow } from '../game/GameFlow';
import type { AdventureSaveV2 } from '../game/adventure/AdventureState';
import { type SaveDriver, saveGameFlow } from './SaveStore';

export type AutosaveReason =
	| 'branch-choice'
	| 'stage-complete'
	| 'skill-purchase'
	| 'campaign-complete'
	| 'world-travel';

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
	'world-travel': 'Autosaved world position',
};

const autosaveFeedbackChannel = createPersistenceFeedback<AutosaveReason>({
	labels: AUTOSAVE_LABELS,
	eventName: 'badger:autosave-feedback',
});

export function autosaveGameFlow(
	driver: SaveDriver,
	flow: GameFlow,
	reason: AutosaveReason,
	adventure?: AdventureSaveV2
): AutosaveFeedback {
	saveGameFlow(driver, flow, adventure);
	return autosaveFeedbackChannel.emit(reason) as AutosaveFeedback;
}

export function dispatchAutosaveFeedback(feedback: AutosaveFeedback): void {
	autosaveFeedbackChannel.dispatch(feedback as ArcadePersistenceFeedback<AutosaveReason>);
}
