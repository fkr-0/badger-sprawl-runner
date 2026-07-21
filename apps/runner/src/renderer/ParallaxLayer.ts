/**
 * ParallaxLayer - multi-speed background layer
 */

export interface ParallaxLayer {
	speed: number;
	elements: Array<{
		x: number;
		y: number;
		w: number;
		h: number;
		color1: string;
		color2: string;
	}>;
}

export class ParallaxRenderer {
	private layers: ParallaxLayer[] = [];

	getLayers(): readonly ParallaxLayer[] {
		return this.layers;
	}

	addLayer(speed: number): ParallaxLayer {
		const layer = { speed, elements: [] };
		this.layers.push(layer);
		return layer;
	}

	render(ctx: CanvasRenderingContext2D, cameraX: number, width: number, height: number): void {
		for (const layer of this.layers) {
			const offsetX = cameraX * layer.speed;

			for (const el of layer.elements) {
				const x = ((el.x - offsetX) % 1200) - 120;
				ctx.fillStyle = el.color1;
				ctx.fillRect(x, el.y, el.w, el.h);
				ctx.fillStyle = el.color2;
				ctx.fillRect(x + 14, el.y + 8, 8, 28);
			}
		}
	}

	initializeDefaultSprawl(canvasHeight = 600): void {
		// Far parallax (buildings) - 0.35x speed
		const far = this.addLayer(0.35);
		for (let i = 0; i < 16; i++) {
			const h = 90 + (i % 5) * 25;
			far.elements.push({
				x: i * 135,
				y: canvasHeight - 110 - h,
				w: 90,
				h,
				color1: i % 3 ? '#151b2d' : '#1c1731',
				color2: i % 2 ? '#67f3c4' : '#ff5e7a',
			});
		}

		// Mid parallax (signs) - 0.6x speed
		const mid = this.addLayer(0.6);
		for (let i = 0; i < 8; i++) {
			mid.elements.push({
				x: i * 220 + 50,
				y: canvasHeight - 250,
				w: 70,
				h: 50,
				color1: '#1a1d26',
				color2: i % 2 ? '#ff5e7a' : '#67f3c4',
			});
		}
	}
}
