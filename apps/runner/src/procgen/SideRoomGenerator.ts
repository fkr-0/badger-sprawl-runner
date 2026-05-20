import type { Pickup } from '../systems/ItemSystem';
import type { Platform } from '../systems/PhysicsSystem';
import { EncounterGenerator, type GeneratedEnemyPack } from './EncounterGenerator';

export interface EncounterSlotTemplate {
	id: string;
	x: number;
	y: number;
	budget: number;
}

export interface RoomChunkTemplate {
	id: string;
	stageTags: string[];
	sockets: Record<string, string>;
	encounterSlots: EncounterSlotTemplate[];
}

export interface SideRoomGenerationInput {
	stageId: string;
	seed: string;
	count?: number;
	gameplayHooks?: readonly string[];
}

export interface GeneratedSideRoom {
	id: string;
	stageId: string;
	chunkId: string;
	seed: string;
	anchorX: number;
	platforms: Platform[];
	pickups: Pickup[];
	enemyPacks: GeneratedEnemyPack[];
}

export const DEFAULT_ROOM_CHUNKS: RoomChunkTemplate[] = [
	{
		id: 'lower_sprawl_toll_crossing_01',
		stageTags: ['lower-sprawl', 'toll'],
		sockets: { left: 'ground', right: 'ground' },
		encounterSlots: [{ id: 'entry_pack', x: 620, y: 462, budget: 4 }],
	},
	{
		id: 'drainmarket_clinic_crossing_01',
		stageTags: ['drainmarket', 'clinic'],
		sockets: { left: 'ground', right: 'ground', top: 'vent' },
		encounterSlots: [{ id: 'pressure_pack', x: 760, y: 420, budget: 5 }],
	},
	{
		id: 'antenna_static_side_room_01',
		stageTags: ['antenna-barrens', 'signal'],
		sockets: { left: 'ground', right: 'ground' },
		encounterSlots: [{ id: 'static_pack', x: 920, y: 370, budget: 6 }],
	},
];

export class SideRoomGenerator {
	constructor(
		private readonly chunks: readonly RoomChunkTemplate[] = DEFAULT_ROOM_CHUNKS,
		private readonly encounters = new EncounterGenerator()
	) {}

	generateSideRooms(input: SideRoomGenerationInput): GeneratedSideRoom[] {
		const count = Math.max(0, input.count ?? 1);
		return Array.from({ length: count }, (_, index) => this.generateSideRoom(input, index));
	}

	private generateSideRoom(input: SideRoomGenerationInput, index: number): GeneratedSideRoom {
		const chunk = this.pickChunk(input.stageId, input.seed, index);
		const anchorX = 1960 + index * 620;
		const roomSeed = `${input.seed}:side-room:${index}:${chunk.id}`;
		const enemyPacks = chunk.encounterSlots.map((slot, slotIndex) => {
			const pack = this.encounters.generatePack({
				stageId: input.stageId,
				seed: `${roomSeed}:${slot.id}`,
				gameplayHooks: input.gameplayHooks,
				packIndex: 20 + index * 4 + slotIndex,
			});
			return {
				...pack,
				enemies: pack.enemies.map((enemy, enemyIndex) => ({
					...enemy,
					x: anchorX + 120 + enemyIndex * 48,
					y: slot.y,
				})),
			};
		});

		return {
			id: `${input.stageId}-side-room-${index}`,
			stageId: input.stageId,
			chunkId: chunk.id,
			seed: roomSeed,
			anchorX,
			platforms: this.buildPlatforms(anchorX),
			pickups: this.buildPickups(input.stageId, anchorX, index),
			enemyPacks,
		};
	}

	private pickChunk(stageId: string, seed: string, index: number): RoomChunkTemplate {
		const candidates = this.chunks.filter((chunk) => chunk.stageTags.includes(stageId));
		const pool = candidates.length > 0 ? candidates : this.chunks;
		const hash = hashSeed(`${stageId}:${seed}:${index}`);
		return pool[hash % pool.length] ?? DEFAULT_ROOM_CHUNKS[0] as RoomChunkTemplate;
	}

	private buildPlatforms(anchorX: number): Platform[] {
		return [
			{ x: anchorX, y: 494, w: 520, h: 80 },
			{ x: anchorX + 120, y: 410, w: 165, h: 18 },
			{ x: anchorX + 330, y: 360, w: 145, h: 18 },
		];
	}

	private buildPickups(stageId: string, anchorX: number, index: number): Pickup[] {
		return [
			{
				id: `${stageId}_side_room_${index}_stim_cache`,
				itemId: 'stim_pack',
				x: anchorX + 362,
				y: 326,
				kind: 'stim',
				radius: 30,
				taken: false,
				visualState: 'available',
				animation: 'stim_pack_pickup',
				persistence: 'ephemeral',
			},
		];
	}
}

function hashSeed(seed: string): number {
	let hash = 2166136261;
	for (const char of seed) {
		hash ^= char.charCodeAt(0);
		hash = Math.imul(hash, 16777619);
	}
	return hash >>> 0;
}
