import {
	type SpriteSheet,
	normalizeSpriteManifest,
} from '@badger/sprite-contracts';
import {
	drawArcadeSpriteContactSheetCanvas,
	resolveArcadeSpriteFrame,
	type ArcadeSpriteContactSheetEntry,
} from '../../../vendor/arcade-runtime.mjs';

interface SpriteReviewSnapshot {
	sheetIds: string[];
	entryCount: number;
	width: number;
	height: number;
	labels: string[];
}

declare global {
	interface Window {
		__spriteReview?: SpriteReviewSnapshot;
	}
}

const DEFAULT_SHEETS = [
	'moss_badger',
	'enemy_turnstile_mite',
	'enemy_rent_cop_piker',
	'enemy_masque_duelist',
	'boss_boss_king_feedback_ampthrone',
];

function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.decoding = 'async';
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error(`Failed to load ${url}`));
		image.src = url;
	});
}

function selectedSheetIds(): string[] {
	const params = new URLSearchParams(window.location.search);
	const explicit = params
		.getAll('sheet')
		.flatMap((value) => value.split(','))
		.map((value) => value.trim())
		.filter(Boolean);
	return explicit.length > 0 ? [...new Set(explicit)] : DEFAULT_SHEETS;
}

function selectedFramesPerAnimation(): number {
	const value = Number(new URLSearchParams(window.location.search).get('frames'));
	return Number.isFinite(value) && value > 0 ? Math.min(16, Math.floor(value)) : 4;
}

function frameEntries(
	sheet: SpriteSheet,
	image: HTMLImageElement,
	maximumFrames: number
): ArcadeSpriteContactSheetEntry[] {
	const entries: ArcadeSpriteContactSheetEntry[] = [];
	for (const [animationName, animation] of Object.entries(sheet.animations)) {
		const frameCount = Math.min(animation.frames, maximumFrames);
		for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
			const frame = resolveArcadeSpriteFrame(sheet, animationName, frameIndex);
			if (!frame) continue;
			entries.push({
				image,
				frame,
				label: `${sheet.id} · ${animationName} · ${frameIndex + 1}/${animation.frames}`,
			});
		}
	}
	return entries;
}

async function renderReview(): Promise<void> {
	const body = document.body;
	const canvas = document.querySelector<HTMLCanvasElement>('#review');
	const title = document.querySelector<HTMLElement>('#title');
	const summary = document.querySelector<HTMLElement>('#summary');
	if (!canvas || !title || !summary) throw new Error('Sprite review DOM is incomplete');
	const context = canvas.getContext('2d');
	if (!context) throw new Error('Canvas2D is unavailable');

	const response = await fetch('./data/sprites.json');
	if (!response.ok) throw new Error(`Sprite manifest request failed: ${response.status}`);
	const manifest = normalizeSpriteManifest(await response.json());
	const ids = selectedSheetIds();
	const maximumFrames = selectedFramesPerAnimation();
	const selected = ids.map((id) => {
		const sheet = manifest.sheets.find((candidate) => candidate.id === id);
		if (!sheet) throw new Error(`Unknown sprite sheet: ${id}`);
		return sheet;
	});
	const images = await Promise.all(
		selected.map((sheet) => loadImage(new URL(`./${sheet.file}`, window.location.href).href))
	);
	const entries = selected.flatMap((sheet, index) => frameEntries(sheet, images[index], maximumFrames));
	if (entries.length === 0) throw new Error('No sprite frames selected');

	const result = drawArcadeSpriteContactSheetCanvas(context, entries, {
		columns: ids.length === 1 ? 5 : 6,
		cellWidth: 180,
		cellHeight: 188,
		gap: 10,
		padding: 14,
		labelHeight: 34,
		contentPadding: 12,
		maximumScale: 3,
		resizeCanvas: true,
		imageSmoothingEnabled: false,
		showPivot: true,
		background: '#0d1219',
		cellBackground: '#18212b',
		cellBorder: '#536274',
		pivotColor: '#ffcf5a',
		labelColor: '#e7edf5',
		font: '11px ui-monospace, monospace',
	});

	title.textContent = ids.length === 1 ? `Sprite Review · ${ids[0]}` : 'Badger Sprite Review';
	summary.textContent = `${ids.length} sheet${ids.length === 1 ? '' : 's'} · ${entries.length} rendered frames · shared Arcade Canvas geometry`;
	window.__spriteReview = {
		sheetIds: ids,
		entryCount: entries.length,
		width: result.width,
		height: result.height,
		labels: entries.map((entry) => entry.label ?? ''),
	};
	body.dataset.status = 'ready';
}

renderReview().catch((error: unknown) => {
	const message = error instanceof Error ? error.stack ?? error.message : String(error);
	document.body.dataset.status = 'error';
	const target = document.querySelector<HTMLElement>('#error');
	if (target) target.textContent = message;
	console.error(error);
});

