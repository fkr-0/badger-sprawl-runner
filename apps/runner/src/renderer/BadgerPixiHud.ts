import { Container, Graphics, Text } from 'pixi.js';
import { createPixiHudGauge } from '../../../../vendor/arcade-runtime.mjs';
import type { Player } from '../actors/MossBadger';
import { buildGameplayHudLayout } from './GameplayHudLayout';

export interface BadgerPixiHudModel {
	health: number;
	maxHealth: number;
	healthWarning: boolean;
	fuel: number;
	maxFuel: number;
	hasRocket: boolean;
	checkpoint: string;
	combo: number;
	panel: { x: number; y: number; width: number; height: number };
}

export function resolveBadgerPixiHudModel(
	player: Player,
	width: number,
	height: number
): BadgerPixiHudModel {
	const panel = buildGameplayHudLayout(
		width,
		height,
		0,
		(player.gearIconSlots ?? []).length
	).vitals;
	return {
		health: player.hp,
		maxHealth: player.maxHp,
		healthWarning: player.hp / Math.max(1, player.maxHp) <= 0.4,
		fuel: player.fuel,
		maxFuel: player.maxFuel,
		hasRocket: player.hasRocket,
		checkpoint: (player.checkpointLabel ?? 'SPRAWL ENTRY').toUpperCase(),
		combo: player.comboCount ?? 0,
		panel,
	};
}

function createLabel(
	root: Container,
	x: number,
	y: number,
	fontSize: number,
	fill = '#eaf2ff'
): Text {
	const label = new Text({
		text: '',
		style: {
			fontFamily: 'ui-monospace, monospace',
			fontSize,
			fontWeight: '700',
			fill,
		},
	});
	label.position.set(x, y);
	root.addChild(label);
	return label;
}

export function createBadgerPixiHud(options: {
	container: Container;
	width: number;
	height: number;
}) {
	const modelRoot = new Container();
	modelRoot.label = 'badger-native-hud';
	options.container.addChild(modelRoot);
	const panel = new Graphics();
	modelRoot.addChild(panel);
	const healthGauge = createPixiHudGauge({
		PIXI: { Container, Graphics },
		container: modelRoot,
		label: 'badger-health',
		layout: { x: 26, y: 41, width: 150, height: 12, gap: 4 },
		style: { background: '#202633', fill: '#67f3c4', borderWidth: 0 },
	});
	const fuelGauge = createPixiHudGauge({
		PIXI: { Container, Graphics },
		container: modelRoot,
		label: 'badger-fuel',
		layout: { x: 26, y: 62, width: 150, height: 7 },
		style: { background: '#202633', fill: '#ffb35e', borderWidth: 0 },
	});
	const title = createLabel(modelRoot, 26, 20, 10, '#67f3c4');
	const fuelLabel = createLabel(modelRoot, 26, 53, 8, '#ffb35e');
	const checkpoint = createLabel(modelRoot, 26, 72, 9, '#92a4be');
	const combo = createLabel(modelRoot, 198, 37, 12, '#67f3c4');
	let updates = 0;
	let latest: BadgerPixiHudModel | null = null;

	return {
		root: modelRoot,
		update(player: Player): BadgerPixiHudModel {
			const model = resolveBadgerPixiHudModel(player, options.width, options.height);
			latest = model;
			modelRoot.position.set(model.panel.x, model.panel.y);
			panel.clear();
			panel
				.roundRect(0, 0, model.panel.width, model.panel.height, 6)
				.fill({ color: '#080b12', alpha: 0.88 })
				.stroke({ color: '#364457', width: 1 });
			healthGauge.update(
				{
					value: model.health,
					max: model.maxHealth,
					segments: model.maxHealth,
					lowThreshold: 0.4,
					criticalThreshold: 0.2,
				},
				{ style: { fill: model.healthWarning ? '#ff5e7a' : '#67f3c4' } }
			);
			fuelGauge.update(
				{ value: model.hasRocket ? model.fuel : 0, max: Math.max(1, model.maxFuel) },
				{ visible: model.hasRocket }
			);
			title.text = `MOSS // INTEGRITY ${Math.ceil(model.health)}/${model.maxHealth}`;
			fuelLabel.text = model.hasRocket
				? `ROCKET ${model.fuel.toFixed(1)}/${model.maxFuel}`
				: 'ROCKET // OFFLINE';
			fuelLabel.style.fill = model.hasRocket ? '#ffb35e' : '#92a4be';
			checkpoint.text = `CHECKPOINT // ${model.checkpoint}`;
			combo.text = model.combo > 1 ? `${model.combo}x COMBO` : '';
			updates += 1;
			return model;
		},
		snapshot() {
			return { updates, model: latest } as const;
		},
		destroy() {
			modelRoot.removeFromParent();
			modelRoot.destroy({ children: true });
		},
	};
}
