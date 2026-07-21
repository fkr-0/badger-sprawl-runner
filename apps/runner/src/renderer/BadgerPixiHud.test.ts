import { describe, expect, it } from 'vitest';
import { createPlayer } from '../actors/MossBadger';
import { resolveBadgerPixiHudModel } from './BadgerPixiHud';

describe('Badger native Pixi HUD model', () => {
	it('derives segmented health, rocket fuel and checkpoint presentation data', () => {
		const player = createPlayer();
		player.hp = 2;
		player.maxHp = 5;
		player.hasRocket = true;
		player.fuel = 3.5;
		player.maxFuel = 6;
		player.checkpointLabel = 'Drainmarket gate';
		player.comboCount = 4;
		const model = resolveBadgerPixiHudModel(player, 1280, 720);

		expect(model.health).toBe(2);
		expect(model.healthWarning).toBe(true);
		expect(model.fuel).toBe(3.5);
		expect(model.hasRocket).toBe(true);
		expect(model.checkpoint).toBe('DRAINMARKET GATE');
		expect(model.combo).toBe(4);
		expect(model.panel).toMatchObject({ x: 12, y: 12, width: 350, height: 74 });
	});
});

