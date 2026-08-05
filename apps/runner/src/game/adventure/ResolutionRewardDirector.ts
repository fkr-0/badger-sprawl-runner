import type { ResolutionApproach } from '../ResolutionApproach';
import type { WorldCommandResult, WorldDirector } from './WorldDirector';

export interface ResolutionRewardInput {
	resolutionId: string;
	stageId: string;
	threatRank: 1 | 2 | 3 | 4 | 5;
	approaches?: ResolutionApproach[];
	optional?: boolean;
	nonLethal?: boolean;
	undetected?: boolean;
	majorObjective?: boolean;
}

export interface ResolutionRewardReceipt {
	ok: boolean;
	changed: boolean;
	rewardId: string;
	experience: number;
	levelBefore: number;
	levelAfter: number;
	levelGained: boolean;
	approaches: ResolutionApproach[];
	message: string;
	worldResult: WorldCommandResult;
}

/**
 * Awards advancement for resolving situations, never for individual kills.
 *
 * Equal-threat single-approach solutions receive equal base XP regardless of
 * whether the player used claws, guns, stealth, hacking, social leverage, or
 * repair. Bonuses reward optional complexity and constraints, not a preferred
 * build. Claim IDs make callbacks replay-safe and anti-grind by construction.
 */
export class ResolutionRewardDirector {
	constructor(private readonly world: WorldDirector) {}

	recordResolution(input: ResolutionRewardInput): ResolutionRewardReceipt {
		const approaches = [...new Set(input.approaches ?? [])];
		const experience = calculateResolutionExperience({ ...input, approaches });
		const before = this.world.getState().advancement.level;
		const rewardId = `resolution:${input.stageId}:${input.resolutionId}`;
		const worldResult = this.world.execute({
			type: 'claim-resolution-reward',
			rewardId,
			experience,
			approaches,
		});
		const after = this.world.getState().advancement.level;
		const changed = worldResult.ok;
		return {
			ok: worldResult.ok || (!worldResult.ok && worldResult.reason === 'reward-already-claimed'),
			changed,
			rewardId,
			experience: changed ? experience : 0,
			levelBefore: before,
			levelAfter: after,
			levelGained: after > before,
			approaches,
			message: changed
				? `RESOLUTION +${experience} XP${after > before ? ` // LEVEL ${after}` : ''}`
				: 'Resolution reward already recorded; repetition does not become progress.',
			worldResult,
		};
	}
}

export function calculateResolutionExperience(
	input: ResolutionRewardInput & { approaches?: ResolutionApproach[] }
): number {
	const approaches = [...new Set(input.approaches ?? [])];
	const base = 20 + input.threatRank * 15;
	const approachDiversity = Math.max(0, approaches.length - 1) * 5;
	const optionalBonus = input.optional ? 10 : 0;
	const constraintBonus = Number(Boolean(input.nonLethal)) * 8 + Number(Boolean(input.undetected)) * 8;
	const majorBonus = input.majorObjective ? 15 : 0;
	return base + approachDiversity + optionalBonus + constraintBonus + majorBonus;
}
