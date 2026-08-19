import { type Container, Graphics } from 'pixi.js';
import { createPixiFramePool } from '@arcade/runtime/pixi';
import type { ArcadePixiFramePoolSnapshot } from '@arcade/runtime/pixi';
import type { Particle, VFXRenderSource } from './VFXPool';

export interface BadgerPixiVfxParticleModel {
	x: number;
	y: number;
	alpha: number;
	radius: number;
	color: string;
	kind: string;
}

interface BadgerPixiVfxPayload {
	particle: Readonly<Particle>;
	cameraX: number;
}

export interface BadgerPixiVfxSnapshot extends ArcadePixiFramePoolSnapshot {
	renderedParticles: number;
}

export function resolveBadgerPixiVfxParticle(
	particle: Readonly<Particle>,
	cameraX: number
): BadgerPixiVfxParticleModel {
	return {
		x: particle.x - cameraX,
		y: particle.y,
		alpha: Math.max(0, Math.min(1, particle.life * 2)),
		radius: Math.max(0, particle.size * particle.life * 18),
		color: particle.color,
		kind: particle.kind,
	};
}

function drawParticle(graphics: Graphics, model: BadgerPixiVfxParticleModel): void {
	graphics.clear();
	graphics.position.set(model.x, model.y);
	graphics.alpha = model.alpha;
	graphics.rotation = 0;

	if (model.kind === 'muzzle') {
		graphics.rect(-model.radius, -model.radius / 3, model.radius * 2, model.radius / 1.5);
		graphics.fill({ color: model.color });
		return;
	}

	if (model.kind === 'rocket') {
		graphics.poly([
			-model.radius,
			0,
			model.radius * 0.65,
			-model.radius * 0.55,
			model.radius,
			0,
			model.radius * 0.65,
			model.radius * 0.55,
		]);
		graphics.fill({ color: model.color });
		return;
	}

	graphics.circle(0, 0, model.radius);
	graphics.fill({ color: model.color });
}

export function createBadgerPixiVfx(options: {
	container: Container;
	maxCapacity?: number;
}) {
	const pool = createPixiFramePool<Graphics, BadgerPixiVfxPayload>({
		container: options.container,
		maxCapacity: options.maxCapacity ?? 320,
		createSprite: () => {
			const graphics = new Graphics();
			graphics.label = 'badger-native-vfx-particle';
			return graphics;
		},
		activate(graphics, payload) {
			drawParticle(
				graphics,
				resolveBadgerPixiVfxParticle(payload.particle, payload.cameraX)
			);
		},
		deactivate(graphics) {
			graphics.clear();
			graphics.alpha = 0;
		},
	});
	let renderedParticles = 0;

	return {
		render(source: VFXRenderSource, cameraX: number): BadgerPixiVfxSnapshot {
			pool.beginFrame();
			renderedParticles = 0;
			source.forEachActive((particle) => {
				if (pool.acquire({ particle, cameraX })) renderedParticles += 1;
			});
			return { ...pool.endFrame(), renderedParticles };
		},
		clear(): number {
			renderedParticles = 0;
			return pool.clear();
		},
		snapshot(): BadgerPixiVfxSnapshot {
			return { ...pool.snapshot(), renderedParticles };
		},
		destroy(): boolean {
			return pool.destroy();
		},
	};
}
