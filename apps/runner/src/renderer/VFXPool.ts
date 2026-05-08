/**
 * VFXPool - object-pooled particle and VFX instances
 */

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

export class VFXPool {
	private particles: Particle[] = [];

	emit(x: number, y: number, kind: string, count: number, spread = 20): void {
		for (let i = 0; i < count; i++) {
			const angle = Math.random() * Math.PI * 2;
			const speed = Math.random() * spread;
			this.particles.push({
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
		}
	}

	update(dt: number): void {
		for (let i = this.particles.length - 1; i >= 0; i--) {
			const p = this.particles[i];
			p.x += p.vx * dt;
			p.y += p.vy * dt;
			p.vy += 500 * dt; // gravity
			p.life -= dt;

			if (p.life <= 0) {
				this.particles.splice(i, 1);
			}
		}
	}

	render(ctx: CanvasRenderingContext2D, cameraX: number): void {
		for (const p of this.particles) {
			ctx.globalAlpha = p.life * 2;
			ctx.fillStyle = p.color;
			ctx.beginPath();
			ctx.arc(p.x - cameraX, p.y, p.size * p.life * 18, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.globalAlpha = 1;
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
