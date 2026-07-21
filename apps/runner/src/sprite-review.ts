import {
	type LoadedSheet,
	type SpriteManifest,
	type SpriteSheet,
	loadSpriteSheet,
	normalizeSpriteManifest,
} from '@badger/sprite-contracts';
import {
	type ArcadeSpriteContactSheetEntry,
	drawArcadeSpriteContactSheetCanvas,
	resolveArcadeSpriteFrame,
} from '../../../vendor/arcade-runtime.mjs';
import {
	SpriteInspectorController,
	type SpriteInspectorMode,
	type SpriteInspectorSnapshot,
} from './renderer/SpriteInspectorController';

interface SpriteReviewSnapshot {
	sheetIds: string[];
	entryCount: number;
	width: number;
	height: number;
	labels: string[];
}

interface BrowserSpriteInspectorSnapshot {
	sheetId: string;
	animationName: string;
	mode: SpriteInspectorMode;
	frame: number;
	direction: 1 | -1;
	progress: number;
	speed: number;
	playing: boolean;
	paused: boolean;
	completed: boolean;
	timelineFrames: number;
	eventLogSize: number;
	atlasOk: boolean;
	sourceRect: [number, number, number, number];
	pivot: [number, number];
}

declare global {
	interface Window {
		__spriteReview?: SpriteReviewSnapshot;
		__spriteInspector?: BrowserSpriteInspectorSnapshot;
	}
}

const DEFAULT_SHEETS = [
	'moss_badger',
	'enemy_turnstile_mite',
	'enemy_rent_cop_piker',
	'enemy_masque_duelist',
	'boss_boss_king_feedback_ampthrone',
];
const PREVIEW_WIDTH = 480;
const PREVIEW_HEIGHT = 360;

function requiredElement<T extends Element>(selector: string): T {
	const element = document.querySelector<T>(selector);
	if (!element) throw new Error(`Sprite review DOM is missing ${selector}`);
	return element;
}

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

function requestedInspectorSheet(): string | undefined {
	return new URLSearchParams(window.location.search).get('inspect') ?? undefined;
}

function requestedInspectorAnimation(): string | undefined {
	return new URLSearchParams(window.location.search).get('animation') ?? undefined;
}

function requestedInspectorMode(): SpriteInspectorMode | undefined {
	const mode = new URLSearchParams(window.location.search).get('mode');
	return mode === 'loop' || mode === 'once' || mode === 'pingpong' ? mode : undefined;
}

function requestedInspectorSpeed(): number {
	const value = Number(new URLSearchParams(window.location.search).get('speed'));
	return Number.isFinite(value) && value >= 0 ? Math.min(4, value) : 1;
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

function drawContactSheet(
	context: CanvasRenderingContext2D,
	ids: readonly string[],
	selected: readonly SpriteSheet[],
	images: readonly HTMLImageElement[],
	maximumFrames: number
): SpriteReviewSnapshot {
	const entries = selected.flatMap((sheet, index) =>
		frameEntries(sheet, images[index], maximumFrames)
	);
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
	return {
		sheetIds: [...ids],
		entryCount: entries.length,
		width: result.width,
		height: result.height,
		labels: entries.map((entry) => entry.label ?? ''),
	};
}

function resolvedSheet(sheet: SpriteSheet): SpriteSheet {
	return {
		...sheet,
		file: new URL(`./${sheet.file}`, window.location.href).href,
	};
}

function displayLoadedSheet(source: SpriteSheet, loaded: LoadedSheet): LoadedSheet {
	return { ...loaded, sheet: source };
}

function populateSelect(
	select: HTMLSelectElement,
	options: readonly string[],
	selected: string
): void {
	select.replaceChildren(
		...options.map((value) => {
			const option = document.createElement('option');
			option.value = value;
			option.textContent = value;
			option.selected = value === selected;
			return option;
		})
	);
}

function drawCheckerboard(context: CanvasRenderingContext2D): void {
	context.fillStyle = '#0d1219';
	context.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
	const cell = 20;
	for (let y = 0; y < PREVIEW_HEIGHT; y += cell) {
		for (let x = 0; x < PREVIEW_WIDTH; x += cell) {
			if ((x / cell + y / cell) % 2 !== 0) continue;
			context.fillStyle = '#111a24';
			context.fillRect(x, y, cell, cell);
		}
	}
}

function drawBoxOverlay(
	context: CanvasRenderingContext2D,
	boxes: readonly { x: number; y: number; w: number; h: number; label?: string }[],
	destinationX: number,
	destinationY: number,
	scale: number,
	strokeStyle: string
): void {
	context.save();
	context.strokeStyle = strokeStyle;
	context.fillStyle = strokeStyle;
	context.lineWidth = 1;
	context.font = '10px ui-monospace, monospace';
	for (const box of boxes) {
		context.strokeRect(
			destinationX + box.x * scale,
			destinationY + box.y * scale,
			box.w * scale,
			box.h * scale
		);
		if (box.label) {
			context.fillText(
				box.label,
				destinationX + box.x * scale + 2,
				destinationY + box.y * scale - 3
			);
		}
	}
	context.restore();
}

function drawInspectorPreview(
	context: CanvasRenderingContext2D,
	controller: SpriteInspectorController,
	snapshot: SpriteInspectorSnapshot
): void {
	drawCheckerboard(context);
	const { address } = snapshot;
	const availableWidth = PREVIEW_WIDTH - 96;
	const availableHeight = PREVIEW_HEIGHT - 80;
	const scale = Math.max(
		1,
		Math.min(
			10,
			Math.floor(
				Math.min(availableWidth / address.frameWidth, availableHeight / address.frameHeight)
			)
		)
	);
	const width = address.frameWidth * scale;
	const height = address.frameHeight * scale;
	const destinationX = Math.round((PREVIEW_WIDTH - width) / 2);
	const destinationY = Math.round((PREVIEW_HEIGHT - height) / 2);
	context.imageSmoothingEnabled = false;
	context.drawImage(
		controller.getLoadedSheet().image,
		address.sourceX,
		address.sourceY,
		address.frameWidth,
		address.frameHeight,
		destinationX,
		destinationY,
		width,
		height
	);
	context.strokeStyle = '#52677c';
	context.strokeRect(destinationX - 0.5, destinationY - 0.5, width + 1, height + 1);

	const animation = controller.getLoadedSheet().sheet.animations[snapshot.animationName];
	if (animation) {
		drawBoxOverlay(
			context,
			animation.hurtboxes ?? [],
			destinationX,
			destinationY,
			scale,
			'#67f3c4'
		);
		drawBoxOverlay(context, animation.hitboxes ?? [], destinationX, destinationY, scale, '#ff6b7a');
	}

	const pivotX = destinationX + address.pivotX * scale;
	const pivotY = destinationY + address.pivotY * scale;
	context.save();
	context.strokeStyle = '#ffcf5a';
	context.lineWidth = 1;
	context.beginPath();
	context.moveTo(pivotX - 8, pivotY);
	context.lineTo(pivotX + 8, pivotY);
	context.moveTo(pivotX, pivotY - 8);
	context.lineTo(pivotX, pivotY + 8);
	context.stroke();
	context.restore();
}

function eventLabel(event: {
	kind: string;
	name?: string;
	payload?: Readonly<Record<string, unknown>>;
}): string {
	const name = event.name ? `:${event.name}` : '';
	const payload = event.payload ? ` ${JSON.stringify(event.payload)}` : '';
	return `${event.kind}${name}${payload}`;
}

function updateTimeline(
	container: HTMLElement,
	controller: SpriteInspectorController,
	snapshot: SpriteInspectorSnapshot
): void {
	const activeSlot = Math.min(
		snapshot.timeline.frames.length - 1,
		Math.max(
			0,
			Math.floor(Math.min(0.999999999, snapshot.progress) * snapshot.timeline.frames.length)
		)
	);
	container.style.setProperty('--timeline-columns', String(snapshot.timeline.frames.length));
	container.replaceChildren(
		...snapshot.timeline.frames.map((frame) => {
			const button = document.createElement('button');
			button.type = 'button';
			button.className = 'timeline-frame';
			button.dataset.active = String(frame.slot === activeSlot);
			button.dataset.event = String(frame.events.length > 0);
			button.title = `slot ${frame.slot + 1} · local frame ${frame.localFrame + 1} · ${frame.direction > 0 ? 'forward' : 'reverse'}`;
			button.textContent = String(frame.localFrame + 1);
			button.addEventListener('click', () => {
				controller.pause();
				controller.seekProgress((frame.slot + 0.001) / snapshot.timeline.frames.length);
			});
			return button;
		})
	);
}

function updateUrl(snapshot: SpriteInspectorSnapshot): void {
	const url = new URL(window.location.href);
	url.searchParams.set('inspect', snapshot.sheetId);
	url.searchParams.set('animation', snapshot.animationName);
	url.searchParams.set('mode', snapshot.mode);
	url.searchParams.set('speed', String(snapshot.speed));
	window.history.replaceState(null, '', url);
}

async function createInspector(
	manifest: SpriteManifest,
	initialSheetId: string,
	previewContext: CanvasRenderingContext2D
): Promise<{
	controller: SpriteInspectorController;
	loadSheet(sheetId: string): Promise<void>;
	render(): void;
}> {
	const sheetSelect = requiredElement<HTMLSelectElement>('#sheet-select');
	const animationSelect = requiredElement<HTMLSelectElement>('#animation-select');
	const modeSelect = requiredElement<HTMLSelectElement>('#mode-select');
	const speedInput = requiredElement<HTMLInputElement>('#speed-input');
	const speedOutput = requiredElement<HTMLOutputElement>('#speed-output');
	const timelineInput = requiredElement<HTMLInputElement>('#timeline-input');
	const timelineFrames = requiredElement<HTMLElement>('#timeline-frames');
	const playButton = requiredElement<HTMLButtonElement>('#play-toggle');
	const frameReadout = requiredElement<HTMLElement>('#frame-readout');
	const atlasReadout = requiredElement<HTMLElement>('#atlas-readout');
	const eventReadout = requiredElement<HTMLElement>('#event-readout');
	const eventLog = requiredElement<HTMLElement>('#event-log');
	const cache = new Map<string, Promise<LoadedSheet>>();
	const manifestSheets = new Map(manifest.sheets.map((sheet) => [sheet.id, sheet]));
	const orderedSheetIds = [...manifestSheets.keys()].sort((left, right) =>
		left.localeCompare(right)
	);

	const load = (sheetId: string): Promise<LoadedSheet> => {
		const existing = cache.get(sheetId);
		if (existing) return existing;
		const source = manifestSheets.get(sheetId);
		if (!source) return Promise.reject(new Error(`Unknown sprite sheet: ${sheetId}`));
		const request = loadSpriteSheet(resolvedSheet(source), previewContext).then((loaded) =>
			displayLoadedSheet(source, loaded)
		);
		cache.set(sheetId, request);
		return request;
	};

	const initialLoaded = await load(initialSheetId);
	const requestedAnimation = requestedInspectorAnimation();
	const controller = new SpriteInspectorController(
		initialLoaded,
		requestedAnimation,
		requestedInspectorMode()
	);
	controller.setSpeed(requestedInspectorSpeed());

	populateSelect(sheetSelect, orderedSheetIds, initialSheetId);
	populateSelect(
		animationSelect,
		Object.keys(initialLoaded.sheet.animations),
		controller.snapshot().animationName
	);

	const render = () => {
		const snapshot = controller.snapshot();
		drawInspectorPreview(previewContext, controller, snapshot);
		playButton.textContent = snapshot.paused || !snapshot.playing ? 'Play' : 'Pause';
		modeSelect.value = snapshot.mode;
		speedInput.value = String(snapshot.speed);
		speedOutput.value = `${snapshot.speed.toFixed(2)}×`;
		timelineInput.value = String(Math.round(snapshot.progress * 1000));
		frameReadout.textContent = [
			`frame ${snapshot.frame + 1}/${controller.getLoadedSheet().sheet.animations[snapshot.animationName]?.frames ?? 0}`,
			`sprite cell ${snapshot.address.absoluteFrame}`,
			`${snapshot.direction > 0 ? 'forward' : 'reverse'}`,
			`${(snapshot.progress * 100).toFixed(1)}%`,
			`${snapshot.timeline.fps} fps`,
		].join(' · ');
		const audit = snapshot.sheet.dimensionAudit;
		atlasReadout.textContent = [
			`${snapshot.sheet.layout.mode}`,
			`${snapshot.sheet.layout.columns}×${snapshot.sheet.layout.rows} cells`,
			`${snapshot.sheet.usedCellCount} used / ${snapshot.sheet.unusedCellCount} unused`,
			`${snapshot.sheet.totalFrames} animation frames`,
			`${audit?.actual.width ?? '?'}×${audit?.actual.height ?? '?'} px`,
			audit?.ok ? 'geometry exact' : 'geometry error',
		].join(' · ');
		eventReadout.textContent =
			snapshot.currentEvents.length > 0
				? snapshot.currentEvents.map(eventLabel).join(' · ')
				: 'No event on current frame';
		eventLog.textContent =
			snapshot.eventLog.length > 0
				? snapshot.eventLog
						.slice()
						.reverse()
						.map(
							(event) =>
								`#${event.sequence} ${event.animationName}[${event.localFrame + 1}] ${eventLabel(event)}`
						)
						.join('\n')
				: 'Playback event log is empty.';
		updateTimeline(timelineFrames, controller, snapshot);
		window.__spriteInspector = {
			sheetId: snapshot.sheetId,
			animationName: snapshot.animationName,
			mode: snapshot.mode,
			frame: snapshot.frame,
			direction: snapshot.direction,
			progress: snapshot.progress,
			speed: snapshot.speed,
			playing: snapshot.playing,
			paused: snapshot.paused,
			completed: snapshot.completed,
			timelineFrames: snapshot.timeline.frames.length,
			eventLogSize: snapshot.eventLog.length,
			atlasOk: snapshot.sheet.dimensionAudit?.ok ?? false,
			sourceRect: [
				snapshot.address.sourceX,
				snapshot.address.sourceY,
				snapshot.address.frameWidth,
				snapshot.address.frameHeight,
			],
			pivot: [snapshot.address.pivotX, snapshot.address.pivotY],
		};
	};

	const loadSheet = async (sheetId: string): Promise<void> => {
		document.body.dataset.inspectorStatus = 'loading';
		const loaded = await load(sheetId);
		controller.setSheet(loaded, requestedInspectorAnimation());
		populateSelect(
			animationSelect,
			Object.keys(loaded.sheet.animations),
			controller.snapshot().animationName
		);
		sheetSelect.value = sheetId;
		document.body.dataset.inspectorStatus = 'ready';
		render();
		updateUrl(controller.snapshot());
	};

	sheetSelect.addEventListener('change', () => void loadSheet(sheetSelect.value));
	animationSelect.addEventListener('change', () => {
		controller.selectAnimation(animationSelect.value);
		render();
		updateUrl(controller.snapshot());
	});
	modeSelect.addEventListener('change', () => {
		controller.setMode(modeSelect.value as SpriteInspectorMode);
		render();
		updateUrl(controller.snapshot());
	});
	speedInput.addEventListener('input', () => {
		controller.setSpeed(Number(speedInput.value));
		render();
		updateUrl(controller.snapshot());
	});
	timelineInput.addEventListener('input', () => {
		controller.pause();
		controller.seekProgress(Number(timelineInput.value) / 1000);
		render();
	});
	playButton.addEventListener('click', () => {
		controller.togglePlayback();
		render();
	});
	requiredElement<HTMLButtonElement>('#restart').addEventListener('click', () => {
		controller.restart();
		render();
	});
	requiredElement<HTMLButtonElement>('#previous-frame').addEventListener('click', () => {
		controller.stepFrames(-1);
		render();
	});
	requiredElement<HTMLButtonElement>('#next-frame').addEventListener('click', () => {
		controller.stepFrames(1);
		render();
	});
	requiredElement<HTMLButtonElement>('#clear-events').addEventListener('click', () => {
		controller.clearEventLog();
		render();
	});

	document.addEventListener('keydown', (event) => {
		if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement)
			return;
		if (event.code === 'Space') {
			event.preventDefault();
			controller.togglePlayback();
		} else if (event.code === 'ArrowLeft') controller.stepFrames(-1);
		else if (event.code === 'ArrowRight') controller.stepFrames(1);
		else if (event.code === 'KeyR') controller.restart();
		else return;
		render();
	});

	document.body.dataset.inspectorStatus = 'ready';
	render();
	return { controller, loadSheet, render };
}

async function renderReview(): Promise<void> {
	const body = document.body;
	const canvas = requiredElement<HTMLCanvasElement>('#review');
	const previewCanvas = requiredElement<HTMLCanvasElement>('#inspector-preview');
	const title = requiredElement<HTMLElement>('#title');
	const summary = requiredElement<HTMLElement>('#summary');
	const context = canvas.getContext('2d');
	const previewContext = previewCanvas.getContext('2d');
	if (!context || !previewContext) throw new Error('Canvas2D is unavailable');

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
	const reviewSnapshot = drawContactSheet(context, ids, selected, images, maximumFrames);
	window.__spriteReview = reviewSnapshot;

	previewCanvas.width = PREVIEW_WIDTH;
	previewCanvas.height = PREVIEW_HEIGHT;
	const requestedSheet = requestedInspectorSheet();
	const initialInspectorSheet = manifest.sheets.some((sheet) => sheet.id === requestedSheet)
		? (requestedSheet as string)
		: (ids[0] ?? manifest.sheets[0]?.id ?? '');
	const inspector = await createInspector(manifest, initialInspectorSheet, previewContext);
	let previousTimestamp = performance.now();
	const animate = (timestamp: number) => {
		const deltaTime = Math.min(0.1, Math.max(0, (timestamp - previousTimestamp) / 1000));
		previousTimestamp = timestamp;
		inspector.controller.advance(deltaTime);
		inspector.render();
		requestAnimationFrame(animate);
	};
	requestAnimationFrame(animate);

	title.textContent = ids.length === 1 ? `Sprite Review · ${ids[0]}` : 'Badger Sprite Review';
	summary.textContent = `${ids.length} sheet${ids.length === 1 ? '' : 's'} · ${reviewSnapshot.entryCount} rendered frames · live shared-runtime inspector`;
	body.dataset.status = 'ready';
}

renderReview().catch((error: unknown) => {
	const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
	document.body.dataset.status = 'error';
	document.body.dataset.inspectorStatus = 'error';
	const target = document.querySelector<HTMLElement>('#error');
	if (target) target.textContent = message;
	console.error(error);
});
