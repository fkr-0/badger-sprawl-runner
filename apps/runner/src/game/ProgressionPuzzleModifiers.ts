export interface ProgressionPuzzlePlayer {
	itemSetEffects?: Record<string, number | string | boolean>;
	hackMistakeShieldAvailable?: boolean;
}

export function progressionEffectNumber(
	player: ProgressionPuzzlePlayer | undefined,
	key: string,
	fallback = 0
): number {
	const value = player?.itemSetEffects?.[key];
	return typeof value === 'number' ? value : fallback;
}

export function puzzleStepSeconds(dt: number, player: ProgressionPuzzlePlayer | undefined): number {
	const traceReduction = Math.max(
		0,
		Math.min(0.5, progressionEffectNumber(player, 'traceReduction'))
	);
	return Math.max(0, dt) * (1 - traceReduction);
}

export function consumeHackMistakeShield(player: ProgressionPuzzlePlayer | undefined): boolean {
	if (player?.itemSetEffects?.firstHackMistakeIgnored !== true) return false;
	if (player.hackMistakeShieldAvailable === false) return false;
	player.hackMistakeShieldAvailable = false;
	return true;
}
