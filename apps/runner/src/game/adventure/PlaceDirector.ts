import type { GameFlow } from '../GameFlow';
import type { DistrictStoryPhase } from './AdventureState';
import {
	getInfrastructureNoticesForDistrict,
	resolveInfrastructureNetwork,
} from './InfrastructureNetwork';
import { getNpcConversations, getNpcDef, type NpcConversationDef, type NpcDef } from './NpcCatalog';
import {
	getPlaceDef,
	getPlaceVariant,
	type PlaceDef,
	type PlacePhaseVariant,
	type PlaceServiceDef,
} from './PlaceLedger';
import { getQuestDef, QUEST_CATALOG } from './QuestCatalog';
import { resolveSubwayPulse, type SubwayPulseSnapshot } from './SubwayPulse';
import { resolveWorldSchedule, type WorldBeat } from './WorldSchedule';
import type { WorldCommandResult, WorldDirector } from './WorldDirector';

export interface PlaceNpcProjection {
	npc: NpcDef;
	conversation?: NpcConversationDef;
	trust: number;
	met: boolean;
}

export interface PlaceSnapshot {
	place: PlaceDef;
	variant: PlacePhaseVariant;
	phase: DistrictStoryPhase;
	visitCount: number;
	npcs: PlaceNpcProjection[];
	services: PlaceServiceDef[];
	subwayPulse: SubwayPulseSnapshot;
	infrastructureHealth: number;
	infrastructureLabel: string;
	infrastructureNotices: string[];
	worldBeat: WorldBeat;
	scheduleLabel: string;
	scheduleNotice: string;
}

export type PlaceInteractionIntent = 'open-skills' | 'open-shop' | 'open-map';

export interface PlaceInteractionResult {
	ok: boolean;
	message: string;
	changed: boolean;
	intent?: PlaceInteractionIntent;
	worldResult?: WorldCommandResult;
}

export class PlaceDirector {
	constructor(
		private readonly world: WorldDirector,
		private readonly flow: GameFlow
	) {}

	getSnapshot(locationId = this.world.getState().currentLocationId): PlaceSnapshot | null {
		const place = getPlaceDef(locationId);
		if (!place) return null;
		const state = this.world.getState();
		const phase = state.districtPhases[place.districtId] ?? 'contested';
		const variant = getPlaceVariant(place, phase);
		const npcIds = this.resolveNpcIds(place, variant);
		const npcs = npcIds
			.map((npcId) => getNpcDef(npcId))
			.filter((npc): npc is NpcDef => Boolean(npc))
			.map((npc) => ({
				npc,
				conversation: this.resolveConversation(npc.id, locationId, phase),
				trust: state.npcStates[npc.id]?.trust ?? 0,
				met: state.npcStates[npc.id]?.met ?? false,
			}));
		const serviceLevels = state.locationStates[locationId]?.serviceLevels ?? {};
		const services = place.services.filter(
			(service) =>
				variant.serviceIds.includes(service.id) &&
				(service.minimumLevel === 0 || (serviceLevels[service.id] ?? 0) >= service.minimumLevel)
		);
		const infrastructure = resolveInfrastructureNetwork(state, this.flow.getStoryProgress());
		const schedule = resolveWorldSchedule(state, this.flow.getStoryProgress());
		return {
			place,
			variant,
			phase,
			visitCount: state.locationStates[locationId]?.visitCount ?? 0,
			npcs,
			services,
			subwayPulse: resolveSubwayPulse(state, this.flow.getStoryProgress()),
			infrastructureHealth: infrastructure.health,
			infrastructureLabel: infrastructure.label,
			infrastructureNotices: getInfrastructureNoticesForDistrict(
				infrastructure,
				place.districtId
			),
			worldBeat: schedule.beat,
			scheduleLabel: schedule.label,
			scheduleNotice: schedule.notice,
		};
	}

	talkTo(npcId: string, locationId = this.world.getState().currentLocationId): PlaceInteractionResult {
		const snapshot = this.getSnapshot(locationId);
		const projected = snapshot?.npcs.find((entry) => entry.npc.id === npcId);
		if (!snapshot || !projected) {
			return { ok: false, changed: false, message: 'Nobody by that name is here.' };
		}
		const conversation = projected.conversation;
		if (!conversation) {
			return {
				ok: true,
				changed: false,
				message: `${projected.npc.name} has nothing new to add, but does not leave the silence empty.`,
			};
		}

		const worldResult = this.world.execute({
			type: 'record-conversation',
			npcId,
			conversationId: conversation.id,
			trustDelta: conversation.trustDelta,
			flag: conversation.recordFlag,
		});
		if (!worldResult.ok) {
			return { ok: false, changed: false, message: worldResult.reason, worldResult };
		}
		if (conversation.recordFlag) {
			this.world.execute({ type: 'set-world-flag', flag: conversation.recordFlag });
		}
		if (conversation.startsQuestId) {
			const quest = getQuestDef(conversation.startsQuestId);
			this.world.execute({
				type: 'set-quest-state',
				questId: conversation.startsQuestId,
				status: 'active',
				stepId: conversation.startsQuestStepId ?? quest?.entryStepId,
			});
		}
		return {
			ok: true,
			changed: true,
			worldResult,
			message: formatConversation(projected.npc, conversation),
		};
	}

	activateService(
		serviceId: string,
		locationId = this.world.getState().currentLocationId
	): PlaceInteractionResult {
		const snapshot = this.getSnapshot(locationId);
		const service = snapshot?.services.find((entry) => entry.id === serviceId);
		if (!snapshot || !service) {
			return { ok: false, changed: false, message: 'That service is not available here.' };
		}
		switch (service.id) {
			case 'skill-mentor':
				return { ok: true, changed: false, intent: 'open-skills', message: service.description };
			case 'field-shop':
				return { ok: true, changed: false, intent: 'open-shop', message: service.description };
			case 'transit-control':
				return {
					ok: true,
					changed: false,
					intent: 'open-map',
					message: `${snapshot.subwayPulse.label} // ${snapshot.subwayPulse.announcement}`,
				};
			case 'rumor-board':
				return this.activateRumorBoard(locationId);
			default:
				return {
					ok: true,
					changed: false,
					message: `${service.label}: ${service.description}`,
				};
		}
	}

	private activateRumorBoard(locationId: string): PlaceInteractionResult {
		const state = this.world.getState();
		const districtId = getPlaceDef(locationId)?.districtId;
		const quest = QUEST_CATALOG.filter(
			(candidate) =>
				candidate.districtId === districtId &&
				(candidate.kind === 'side' || candidate.kind === 'contract')
		)
			.sort((a, b) => {
				const kindOrder = Number(a.kind === 'contract') - Number(b.kind === 'contract');
				return kindOrder || a.title.localeCompare(b.title);
			})
			.find((candidate) => !state.questStates[candidate.id]);
		if (!quest) {
			return {
				ok: true,
				changed: false,
				message: 'The board has fresh handwriting but no new obligation Moss can responsibly accept.',
			};
		}
		const worldResult = this.world.execute({
			type: 'set-quest-state',
			questId: quest.id,
			status: 'available',
			stepId: quest.entryStepId,
		});
		return {
			ok: worldResult.ok,
			changed: worldResult.ok,
			worldResult,
			message: worldResult.ok ? `New lead: ${quest.title} — ${quest.description}` : worldResult.reason,
		};
	}

	private resolveNpcIds(place: PlaceDef, variant: PlacePhaseVariant): string[] {
		const state = this.world.getState();
		const schedule = resolveWorldSchedule(state, this.flow.getStoryProgress());
		const ids = new Set(
			variant.npcIds.filter((npcId) => {
				const relocated = state.npcStates[npcId]?.currentLocationId;
				if (relocated) return relocated === place.locationId;
				const scheduled = schedule.scheduledLocationByNpcId[npcId];
				return !scheduled || scheduled === place.locationId;
			})
		);
		for (const [npcId, npcState] of Object.entries(state.npcStates)) {
			if (npcState.currentLocationId === place.locationId) ids.add(npcId);
		}
		for (const [npcId, scheduledLocationId] of Object.entries(
			schedule.scheduledLocationByNpcId
		)) {
			if (!state.npcStates[npcId]?.currentLocationId && scheduledLocationId === place.locationId) {
				ids.add(npcId);
			}
		}
		return [...ids];
	}

	private resolveConversation(
		npcId: string,
		locationId: string,
		phase: DistrictStoryPhase
	): NpcConversationDef | undefined {
		const state = this.world.getState();
		const heard = new Set(state.npcStates[npcId]?.conversationIds ?? []);
		const flags = new Set(state.worldFlags);
		return getNpcConversations(npcId).find((conversation) => {
			if (conversation.locationId !== locationId) return false;
			if (conversation.phase && conversation.phase !== phase) return false;
			if (!conversation.repeatable && heard.has(conversation.id)) return false;
			if (conversation.requiresWorldFlags?.some((flag) => !flags.has(flag))) return false;
			if (conversation.forbidsWorldFlags?.some((flag) => flags.has(flag))) return false;
			return true;
		});
	}
}

function formatConversation(npc: NpcDef, conversation: NpcConversationDef): string {
	return [
		`${npc.name}: “${conversation.speakerLine}”`,
		conversation.mossLine ? `Moss: “${conversation.mossLine}”` : '',
		conversation.followupLine ? `${npc.name}: “${conversation.followupLine}”` : '',
	]
		.filter(Boolean)
		.join('  ');
}

