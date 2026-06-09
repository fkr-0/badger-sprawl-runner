import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { readFileSync } from 'node:fs';

const manifestPath = 'data/sprites.json';
const publicRoot = 'apps/runner/public';
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

function sheetDimensions(sheet) {
	const [fw, fh] = sheet.frameSize;
	if (sheet.grid) return [fw * sheet.grid.columns, fh * sheet.grid.rows];
	const maxFrames = Math.max(...Object.values(sheet.animations).map((animation) => animation.frames));
	return [fw * maxFrames, fh * Math.max(1, Object.keys(sheet.animations).length)];
}

function colorFor(key) {
	const digest = createHash('sha256').update(key).digest();
	return [70 + (digest[0] % 150), 70 + (digest[1] % 150), 70 + (digest[2] % 150), 255];
}

function crc32(buffer) {
	let crc = 0xffffffff;
	for (const byte of buffer) {
		crc ^= byte;
		for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
	}
	return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
	const typeBuffer = Buffer.from(type, 'ascii');
	const length = Buffer.alloc(4);
	length.writeUInt32BE(data.length, 0);
	const crc = Buffer.alloc(4);
	crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
	return Buffer.concat([length, typeBuffer, data, crc]);
}

function setPixel(pixels, width, height, x, y, rgba) {
	if (x < 0 || y < 0 || x >= width || y >= height) return;
	const index = (y * width + x) * 4;
	pixels[index] = rgba[0];
	pixels[index + 1] = rgba[1];
	pixels[index + 2] = rgba[2];
	pixels[index + 3] = rgba[3];
}

function fillRect(pixels, width, height, x, y, w, h, rgba) {
	for (let yy = y; yy < y + h; yy++) {
		for (let xx = x; xx < x + w; xx++) setPixel(pixels, width, height, xx, yy, rgba);
	}
}

function strokeRect(pixels, width, height, x, y, w, h, rgba) {
	for (let xx = x; xx < x + w; xx++) {
		setPixel(pixels, width, height, xx, y, rgba);
		setPixel(pixels, width, height, xx, y + h - 1, rgba);
	}
	for (let yy = y; yy < y + h; yy++) {
		setPixel(pixels, width, height, x, yy, rgba);
		setPixel(pixels, width, height, x + w - 1, yy, rgba);
	}
}

function drawFrame(pixels, width, height, sheet, label, frame, x, y) {
	const [fw, fh] = sheet.frameSize;
	const fill = colorFor(`${sheet.id}:${label}:${frame}`);
	fillRect(pixels, width, height, x, y, fw, fh, fill);
	strokeRect(pixels, width, height, x, y, fw, fh, [255, 255, 255, 60]);
	fillRect(pixels, width, height, x + 2, y + 2, Math.min(12, fw - 4), Math.min(12, fh - 4), [255, 255, 255, 40]);
	fillRect(pixels, width, height, x + fw - 5, y + fh - 5, 3, 3, [0, 0, 0, 120]);
}

function encodePng(width, height, pixels) {
	const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(width, 0);
	ihdr.writeUInt32BE(height, 4);
	ihdr[8] = 8; // bit depth
	ihdr[9] = 6; // RGBA
	ihdr[10] = 0;
	ihdr[11] = 0;
	ihdr[12] = 0;

	const raw = Buffer.alloc((width * 4 + 1) * height);
	for (let y = 0; y < height; y++) {
		const rawRow = y * (width * 4 + 1);
		raw[rawRow] = 0;
		pixels.copy(raw, rawRow + 1, y * width * 4, (y + 1) * width * 4);
	}

	return Buffer.concat([
		header,
		chunk('IHDR', ihdr),
		chunk('IDAT', deflateSync(raw, { level: 9 })),
		chunk('IEND', Buffer.alloc(0)),
	]);
}

function renderSheet(sheet) {
	const [width, height] = sheetDimensions(sheet);
	const safeWidth = Math.max(1, width);
	const safeHeight = Math.max(1, height);
	const pixels = Buffer.alloc(safeWidth * safeHeight * 4);
	const [fw, fh] = sheet.frameSize;

	if (sheet.grid) {
		const total = sheet.grid.columns * sheet.grid.rows;
		const labels = Array.from({ length: total }, (_, frame) => `frame_${frame}`);
		for (const [animName, animation] of Object.entries(sheet.animations)) {
			const order = animation.order ?? Array.from({ length: animation.frames }, (_, frame) => frame);
			for (const frame of order) if (frame >= 0 && frame < total) labels[frame] = animName;
		}
		for (let frame = 0; frame < total; frame++) {
			drawFrame(
				pixels,
				safeWidth,
				safeHeight,
				sheet,
				labels[frame],
				frame,
				(frame % sheet.grid.columns) * fw,
				Math.floor(frame / sheet.grid.columns) * fh,
			);
		}
	} else {
		Object.entries(sheet.animations).forEach(([animName, animation], row) => {
			for (let frame = 0; frame < animation.frames; frame++) {
				drawFrame(pixels, safeWidth, safeHeight, sheet, animName, frame, frame * fw, row * fh);
			}
		});
	}

	return encodePng(safeWidth, safeHeight, pixels);
}

await mkdir(join(publicRoot, 'data'), { recursive: true });
await copyFile(manifestPath, join(publicRoot, 'data/sprites.json'));

let written = 0;
for (const sheet of manifest.spriteSheets) {
	const target = join(publicRoot, sheet.file);
	await mkdir(dirname(target), { recursive: true });
	await writeFile(target, renderSheet(sheet));
	written++;
}

console.log(`Generated ${written} placeholder sprite atlases in ${publicRoot}`);
