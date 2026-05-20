import { describe, expect, it } from 'vitest';
import { SideRoomGenerator } from './SideRoomGenerator';

describe('SideRoomGenerator', () => {
	it('generates deterministic side rooms from stage id and seed', () => {
		const generator = new SideRoomGenerator();
		const input = { stageId: 'drainmarket', seed: 'clinic-seed', count: 2 };
		expect(generator.generateSideRooms(input)).toEqual(generator.generateSideRooms(input));
	});

	it('selects stage-tagged chunks when available', () => {
		const [room] = new SideRoomGenerator().generateSideRooms({
			stageId: 'antenna-barrens',
			seed: 'static',
		});
		expect(room?.chunkId).toBe('antenna_static_side_room_01');
		expect(room?.platforms.length).toBeGreaterThan(0);
		expect(room?.pickups[0]?.kind).toBe('stim');
	});

	it('embeds generated enemy packs inside side rooms', () => {
		const [room] = new SideRoomGenerator().generateSideRooms({
			stageId: 'lower-sprawl',
			seed: 'toll',
		});
		expect(room?.enemyPacks.length).toBeGreaterThan(0);
		expect(room?.enemyPacks[0]?.enemies.length).toBeGreaterThan(0);
		expect(room?.enemyPacks[0]?.enemies[0]?.x).toBeGreaterThan(room?.anchorX ?? 0);
	});

	it('falls back to the shared chunk pool for unknown stage ids', () => {
		const [room] = new SideRoomGenerator().generateSideRooms({ stageId: 'unknown', seed: 'fallback' });
		expect(room?.chunkId).toBeTruthy();
		expect(room?.stageId).toBe('unknown');
	});
});
