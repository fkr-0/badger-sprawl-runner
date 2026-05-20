export * from './campaign/schema';
export { CAMPAIGN } from './campaign/campaignData';
export { CAMPAIGN_SIDE_QUESTS } from './campaign/sideQuests';
export { CAMPAIGN_MINIGAMES } from './campaign/minigames';
export { BRANCH_CONSEQUENCES } from './campaign/branchConsequences';

import { CAMPAIGN } from './campaign/campaignData';
import { CAMPAIGN_SIDE_QUESTS } from './campaign/sideQuests';
import { CAMPAIGN_MINIGAMES } from './campaign/minigames';
import type { CampaignStage } from './campaign/schema';

for (const stage of CAMPAIGN.stages) {
	stage.sideQuests = CAMPAIGN_SIDE_QUESTS[stage.id]?.map((quest) => ({ ...quest })) ?? [];
	stage.minigames = CAMPAIGN_MINIGAMES[stage.id]?.map((minigame) => ({ ...minigame })) ?? [];
}

export const FIRST_THREE_ACT_STAGE_IDS = CAMPAIGN.acts.slice(0, 3).flatMap((act) => act.stages);

export function getCampaignStage(stageId: string): CampaignStage | undefined {
	return CAMPAIGN.stages.find((stage) => stage.id === stageId);
}

export function getNextCampaignStage(stageId: string): CampaignStage | undefined {
	const index = CAMPAIGN.stages.findIndex((stage) => stage.id === stageId);
	return index >= 0 ? CAMPAIGN.stages[index + 1] : undefined;
}
