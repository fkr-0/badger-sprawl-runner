/** VFX rendering facade over the shared fixed-capacity recycling engine. */

import { type RecyclingPool, createRecyclingPool } from '../../../../vendor/arcade-runtime.mjs';
import type { SpriteRenderer } from './SpriteRenderer';

export interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	life: number;
	maxLife: number;
	kind: string;
	color: string;
	size: number;
}

export interface VFXPoolStats {
	capacity: number;
	activeParticles: number;
	emittedParticles: number;
	recycledParticles: number;
}

export interface VFXRenderSource {
	forEachActive(visitor: (particle: Readonly<Particle>) => void): void;
}

function createDormantParticle(): Particle {
	return {
		x: 0,
		y: 0,
		vx: 0,
		vy: 0,
		life: 0,
		maxLife: 1,
		kind: 'dust',
		color: '#fff',
		size: 1,
	};
}

export class VFXPool implements VFXRenderSource {
	private readonly pool: RecyclingPool<Particle>;
	private emittedParticles = 0;

	constructor(
		capacity = 320,
		private readonly random: () => number = Math.random
	) {
		this.pool = createRecyclingPool({
			capacity,
			create: createDormantParticle,
			reset: (particle) => Object.assign(particle, createDormantParticle()),
		});
	}

	emit(x: number, y: number, kind: string, count: number, spread = 20): void {
		for (let i = 0; i < count; i++) {
			const angle = this.random() * Math.PI * 2;
			const speed = this.random() * spread;
			this.pool.acquire((particle) => {
				Object.assign(particle, {
					x,
					y,
					vx: Math.cos(angle) * speed,
					vy: Math.sin(angle) * speed,
					life: 1,
					maxLife: 1,
					kind,
					color: this.getColor(kind),
					size: this.getSize(kind),
				});
			});
			this.emittedParticles += 1;
		}
	}

	update(dt: number): void {
		this.pool.forEachActive((p) => {
			p.x += p.vx * dt;
			p.y += p.vy * dt;
			p.vy += 500 * dt; // gravity
			p.life -= dt;

			if (p.life <= 0) {
				this.pool.release(p);
			}
		});
	}

	forEachActive(visitor: (particle: Readonly<Particle>) => void): void {
		this.pool.forEachActive(visitor);
	}

	render(ctx: CanvasRenderingContext2D, cameraX: number, spriteRenderer?: SpriteRenderer): void {
		this.forEachActive((p) => {
			const animationName = this.getSpriteAnimation(p.kind);
			const sheet = animationName ? spriteRenderer?.getSheet('vfx_combat') : undefined;
			const animation = animationName ? sheet?.sheet.animations[animationName] : undefined;
			if (animationName && animation && sheet && spriteRenderer) {
				const progress = Math.min(0.999, Math.max(0, 1 - p.life / p.maxLife));
				const frame = Math.floor(progress * animation.frames);
				const scale = Math.max(0.35, Math.min(0.8, p.size / 10));
				const [frameWidth, frameHeight] = sheet.sheet.frameSize;
				ctx.save();
				ctx.globalAlpha = Math.min(1, p.life * 2);
				spriteRenderer.drawFrameTo(
					ctx,
					'vfx_combat',
					animationName,
					frame,
					p.x - cameraX - (frameWidth * scale) / 2,
					p.y - (frameHeight * scale) / 2,
					false,
					scale,
					scale
				);
				ctx.restore();
				return;
			}

			ctx.globalAlpha = p.life * 2;
			ctx.fillStyle = p.color;
			ctx.beginPath();
			ctx.arc(p.x - cameraX, p.y, p.size * p.life * 18, 0, Math.PI * 2);
			ctx.fill();
		});
		ctx.globalAlpha = 1;
	}

	clear(): void {
		this.pool.clear();
	}

	getStats(): VFXPoolStats {
		const stats = this.pool.snapshot();
		return {
			capacity: stats.capacity,
			activeParticles: stats.active,
			emittedParticles: this.emittedParticles,
			recycledParticles: stats.recycled,
		};
	}

	private getColor(kind: string): string {
		switch (kind) {
			case 'emp':
				return '#67f3c4';
			case 'rocket':
				return '#ffb35e';
			case 'dust':
				return '#eaf2ff';
			case 'muzzle':
				return '#eaf2ff';
			case 'blood':
				return '#ff5e7a';
			default:
				return '#fff';
		}
	}

	private getSpriteAnimation(kind: string): string | null {
		switch (kind) {
			case 'emp':
				return 'emp_spark';
			case 'rocket':
				return 'rocket_flame';
			case 'dust':
				return 'landing_dust';
			case 'muzzle':
				return 'rail_muzzle';
			case 'blood':
				return 'claw_arc';
			default:
				return null;
		}
	}

	private getSize(kind: string): number {
		switch (kind) {
			case 'emp':
				return 8;
			case 'rocket':
				return 6;
			case 'dust':
				return 10;
			default:
				return 6;
		}
	}
}
