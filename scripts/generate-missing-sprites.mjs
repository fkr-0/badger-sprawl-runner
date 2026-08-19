#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { deflateSync } from 'node:zlib';

const manifestPath = 'data/sprites.json';
const publicRoot = 'apps/runner/public';
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const dryRun = process.argv.includes('--dry-run');
const overwrite = process.argv.includes('--overwrite');

function clamp(value, min = 0, max = 255) {
	return Math.max(min, Math.min(max, Math.round(value)));
}

function hashBytes(key) {
	return createHash('sha256').update(key).digest();
}

function colorFor(key, saturation = 1) {
	const digest = hashBytes(key);
	const base = [72 + (digest[0] % 136), 72 + (digest[1] % 136), 72 + (digest[2] % 136)];
	const mean = (base[0] + base[1] + base[2]) / 3;
	return [
		clamp(mean + (base[0] - mean) * saturation),
		clamp(mean + (base[1] - mean) * saturation),
		clamp(mean + (base[2] - mean) * saturation),
		255,
	];
}

function shade(color, amount, alpha = color[3] ?? 255) {
	return [clamp(color[0] + amount), clamp(color[1] + amount), clamp(color[2] + amount), alpha];
}

function mix(a, b, amount = 0.5, alpha = 255) {
	return [
		clamp(a[0] * (1 - amount) + b[0] * amount),
		clamp(a[1] * (1 - amount) + b[1] * amount),
		clamp(a[2] * (1 - amount) + b[2] * amount),
		alpha,
	];
}

function setPixel(pixels, width, height, x, y, rgba) {
	const pixelX = Math.round(x);
	const pixelY = Math.round(y);
	if (pixelX < 0 || pixelY < 0 || pixelX >= width || pixelY >= height) return;
	const index = (pixelY * width + pixelX) * 4;
	pixels[index] = rgba[0];
	pixels[index + 1] = rgba[1];
	pixels[index + 2] = rgba[2];
	pixels[index + 3] = rgba[3] ?? 255;
}

function fillRect(pixels, width, height, x, y, w, h, rgba) {
	const x0 = Math.round(x);
	const y0 = Math.round(y);
	const x1 = Math.round(x + w);
	const y1 = Math.round(y + h);
	for (let yy = y0; yy < y1; yy++) {
		for (let xx = x0; xx < x1; xx++) setPixel(pixels, width, height, xx, yy, rgba);
	}
}

function strokeRect(pixels, width, height, x, y, w, h, rgba, thickness = 1) {
	fillRect(pixels, width, height, x, y, w, thickness, rgba);
	fillRect(pixels, width, height, x, y + h - thickness, w, thickness, rgba);
	fillRect(pixels, width, height, x, y, thickness, h, rgba);
	fillRect(pixels, width, height, x + w - thickness, y, thickness, h, rgba);
}

function fillEllipse(pixels, width, height, cx, cy, rx, ry, rgba) {
	const minX = Math.floor(cx - rx);
	const maxX = Math.ceil(cx + rx);
	const minY = Math.floor(cy - ry);
	const maxY = Math.ceil(cy + ry);
	for (let y = minY; y <= maxY; y++) {
		for (let x = minX; x <= maxX; x++) {
			const dx = (x - cx) / Math.max(1, rx);
			const dy = (y - cy) / Math.max(1, ry);
			if (dx * dx + dy * dy <= 1) setPixel(pixels, width, height, x, y, rgba);
		}
	}
}

function drawLine(pixels, width, height, x0, y0, x1, y1, rgba, thickness = 1) {
	let currentX = Math.round(x0);
	let currentY = Math.round(y0);
	const targetX = Math.round(x1);
	const targetY = Math.round(y1);
	const dx = Math.abs(targetX - currentX);
	const sx = currentX < targetX ? 1 : -1;
	const dy = -Math.abs(targetY - currentY);
	const sy = currentY < targetY ? 1 : -1;
	let error = dx + dy;
	while (true) {
		fillRect(
			pixels,
			width,
			height,
			currentX - Math.floor(thickness / 2),
			currentY - Math.floor(thickness / 2),
			thickness,
			thickness,
			rgba
		);
		if (currentX === targetX && currentY === targetY) break;
		const e2 = 2 * error;
		if (e2 >= dy) {
			error += dy;
			currentX += sx;
		}
		if (e2 <= dx) {
			error += dx;
			currentY += sy;
		}
	}
}

function fillDiamond(pixels, width, height, cx, cy, radius, rgba) {
	for (let dy = -radius; dy <= radius; dy++) {
		const half = radius - Math.abs(dy);
		fillRect(pixels, width, height, cx - half, cy + dy, half * 2 + 1, 1, rgba);
	}
}

function drawSpark(pixels, width, height, cx, cy, radius, rgba) {
	drawLine(pixels, width, height, cx - radius, cy, cx + radius, cy, rgba);
	drawLine(pixels, width, height, cx, cy - radius, cx, cy + radius, rgba);
	if (radius > 2) {
		drawLine(
			pixels,
			width,
			height,
			cx - radius + 1,
			cy - radius + 1,
			cx + radius - 1,
			cy + radius - 1,
			rgba
		);
		drawLine(
			pixels,
			width,
			height,
			cx + radius - 1,
			cy - radius + 1,
			cx - radius + 1,
			cy + radius - 1,
			rgba
		);
	}
}

function seededValue(key, index = 0) {
	const digest = hashBytes(`${key}:${index}`);
	return ((digest[0] << 16) | (digest[1] << 8) | digest[2]) / 0xffffff;
}

function paletteFor(id) {
	const ink = [14, 16, 23, 255];
	const pale = [239, 233, 216, 255];
	if (/mirror|glass|vitrine|reflection/.test(id)) {
		return {
			ink,
			primary: [74, 112, 151, 255],
			secondary: [175, 224, 238, 255],
			accent: [205, 113, 255, 255],
			pale,
		};
	}
	if (/clinic|suture|mina/.test(id)) {
		return {
			ink,
			primary: [65, 132, 126, 255],
			secondary: [195, 223, 197, 255],
			accent: [230, 78, 87, 255],
			pale,
		};
	}
	if (/feedback|king/.test(id)) {
		return {
			ink,
			primary: [79, 45, 111, 255],
			secondary: [214, 73, 165, 255],
			accent: [245, 142, 46, 255],
			pale,
		};
	}
	if (/vane|command|customs|lancer/.test(id)) {
		return {
			ink,
			primary: [56, 67, 82, 255],
			secondary: [132, 151, 166, 255],
			accent: [239, 190, 62, 255],
			pale,
		};
	}
	if (/ice|fox/.test(id)) {
		return {
			ink,
			primary: [25, 49, 88, 255],
			secondary: [75, 165, 222, 255],
			accent: [124, 243, 230, 255],
			pale,
		};
	}
	if (/angel|elevator/.test(id)) {
		return {
			ink,
			primary: [116, 111, 115, 255],
			secondary: [230, 224, 204, 255],
			accent: [243, 190, 78, 255],
			pale,
		};
	}
	const primary = colorFor(id, 1.35);
	const secondary = shade(primary, 54);
	const accent = colorFor(`${id}:accent`, 1.65);
	return { ink, primary, secondary, accent, pale };
}

function animationPose(label, frame, frameCount, scale) {
	const phase = frameCount > 1 ? frame / frameCount : 0;
	const wave = Math.sin(phase * Math.PI * 2);
	const move = /run|move|patrol|exit/.test(label);
	const attack = /attack|melee|shoot|windup|signature/.test(label);
	return {
		bob: /idle|talk|assist/.test(label)
			? Math.round(wave * scale)
			: move
				? Math.round(Math.abs(wave) * -scale)
				: 0,
		stride: move ? Math.round(wave * 3 * scale) : 0,
		lean: /windup/.test(label)
			? -2 * scale
			: /attack|melee|shoot|signature/.test(label)
				? 2 * scale
				: /hurt|react/.test(label)
					? -2 * scale
					: 0,
		attack,
		hurt: /hurt|react/.test(label),
		stunned: /stun|parried/.test(label),
		death: /death|defeat|down/.test(label),
		victory: /victory|phase_intro|phase_transition/.test(label),
		glow: /assist|hack|signature|phase|victory|pickup/.test(label),
	};
}

function drawEntityFrame(pixels, width, height, sheet, label, frame, frameCount, x, y) {
	const [fw, fh] = sheet.frameSize;
	const id = sheet.id.toLowerCase();
	const boss = fw >= 80;
	const scale = boss ? 2 : 1;
	const palette = paletteFor(id);
	const pose = animationPose(label, frame, frameCount, scale);
	const cx = x + Math.floor(fw / 2) + pose.lean;
	const ground = y + fh - 4;
	const small = /little_ix/.test(id);
	const entityScale = small ? 0.72 : 1;
	const bodyW = Math.round((boss ? 42 : 22) * entityScale);
	const bodyH = Math.round((boss ? 42 : 22) * entityScale);
	const bodyY = ground - Math.round((boss ? 35 : 18) * entityScale) + pose.bob;
	const outline = pose.hurt ? [115, 24, 34, 255] : palette.ink;
	const body = pose.hurt ? mix(palette.primary, [240, 70, 70, 255], 0.52) : palette.primary;
	const alpha = pose.death ? Math.max(80, 230 - frame * 24) : 255;

	fillEllipse(pixels, width, height, cx, ground - 1, bodyW * 0.62, boss ? 5 : 3, [0, 0, 0, 72]);
	if (pose.glow) {
		fillEllipse(pixels, width, height, cx, bodyY, bodyW * 0.9, bodyH * 0.9, [
			...palette.accent.slice(0, 3),
			38,
		]);
	}

	if (/command_lock_faction/.test(id)) {
		drawSmallFaction(pixels, width, height, cx, ground, scale, palette, pose, alpha);
		return;
	}

	if (pose.death) {
		fillEllipse(
			pixels,
			width,
			height,
			cx + frame * scale,
			ground - 5 * scale,
			bodyW * 0.72,
			Math.max(3, bodyH * 0.18),
			[...outline.slice(0, 3), alpha]
		);
		fillEllipse(
			pixels,
			width,
			height,
			cx + frame * scale,
			ground - 6 * scale,
			bodyW * 0.62,
			Math.max(2, bodyH * 0.12),
			[...body.slice(0, 3), alpha]
		);
		return;
	}

	const legY = ground - (boss ? 16 : 9) * entityScale;
	const legW = Math.max(3, Math.round(4 * scale * entityScale));
	const legH = Math.max(5, Math.round(8 * scale * entityScale));
	const leftLegX = cx - Math.round(bodyW * 0.28) + pose.stride;
	const rightLegX = cx + Math.round(bodyW * 0.15) - pose.stride;
	fillRect(pixels, width, height, leftLegX, legY, legW, legH, outline);
	fillRect(pixels, width, height, rightLegX, legY, legW, legH, outline);
	fillRect(
		pixels,
		width,
		height,
		leftLegX + scale,
		legY,
		Math.max(1, legW - scale),
		legH - scale,
		shade(body, -22)
	);
	fillRect(
		pixels,
		width,
		height,
		rightLegX + scale,
		legY,
		Math.max(1, legW - scale),
		legH - scale,
		shade(body, -22)
	);

	if (/fox|lio/.test(id)) {
		fillEllipse(
			pixels,
			width,
			height,
			cx - bodyW * 0.58,
			bodyY + bodyH * 0.12,
			bodyW * 0.55,
			bodyH * 0.23,
			outline
		);
		fillEllipse(
			pixels,
			width,
			height,
			cx - bodyW * 0.6,
			bodyY + bodyH * 0.1,
			bodyW * 0.48,
			bodyH * 0.17,
			palette.secondary
		);
	}
	if (/angel/.test(id)) {
		for (const direction of [-1, 1]) {
			fillEllipse(
				pixels,
				width,
				height,
				cx + direction * bodyW * 0.72,
				bodyY - bodyH * 0.1,
				bodyW * 0.42,
				bodyH * 0.58,
				outline
			);
			fillEllipse(
				pixels,
				width,
				height,
				cx + direction * bodyW * 0.72,
				bodyY - bodyH * 0.1,
				bodyW * 0.34,
				bodyH * 0.5,
				palette.secondary
			);
		}
	}
	if (/drone|mite|nest/.test(id)) {
		for (const direction of [-1, 1]) {
			drawLine(
				pixels,
				width,
				height,
				cx + direction * bodyW * 0.3,
				bodyY,
				cx + direction * bodyW * 0.8,
				bodyY - bodyH * 0.42,
				outline,
				scale
			);
			drawLine(
				pixels,
				width,
				height,
				cx + direction * bodyW * 0.3,
				bodyY + bodyH * 0.2,
				cx + direction * bodyW * 0.9,
				bodyY + bodyH * 0.5,
				outline,
				scale
			);
		}
	}

	fillEllipse(pixels, width, height, cx, bodyY, bodyW * 0.56, bodyH * 0.55, outline);
	fillEllipse(pixels, width, height, cx + scale, bodyY - scale, bodyW * 0.48, bodyH * 0.47, [
		...body.slice(0, 3),
		alpha,
	]);
	fillRect(
		pixels,
		width,
		height,
		cx - bodyW * 0.36,
		bodyY + bodyH * 0.05,
		bodyW * 0.72,
		Math.max(2, 3 * scale),
		palette.accent
	);

	const headR = Math.round((boss ? 13 : 7) * entityScale);
	const headX = cx + Math.round(bodyW * 0.32);
	const headY = bodyY - Math.round(bodyH * 0.45);
	fillEllipse(pixels, width, height, headX, headY, headR + scale, headR, outline);
	fillEllipse(
		pixels,
		width,
		height,
		headX + scale,
		headY,
		headR,
		Math.max(3, headR - scale),
		palette.secondary
	);
	fillRect(
		pixels,
		width,
		height,
		headX + Math.round(headR * 0.35),
		headY - scale,
		Math.max(2, scale * 2),
		Math.max(2, scale * 2),
		palette.ink
	);
	fillRect(
		pixels,
		width,
		height,
		headX + Math.round(headR * 0.55),
		headY + Math.round(headR * 0.35),
		Math.max(2, scale * 2),
		Math.max(1, scale),
		palette.accent
	);

	if (/fox|badger|clinic|juno|lio|mara/.test(id)) {
		fillDiamond(
			pixels,
			width,
			height,
			headX - headR * 0.5,
			headY - headR * 0.88,
			Math.max(2, 2 * scale),
			outline
		);
		fillDiamond(
			pixels,
			width,
			height,
			headX + headR * 0.45,
			headY - headR * 0.88,
			Math.max(2, 2 * scale),
			outline
		);
	}
	if (/mirror|vitrine|reflection/.test(id)) {
		strokeRect(
			pixels,
			width,
			height,
			cx - bodyW * 0.47,
			bodyY - bodyH * 0.2,
			bodyW * 0.94,
			bodyH * 0.75,
			palette.secondary,
			scale
		);
		drawLine(
			pixels,
			width,
			height,
			cx - bodyW * 0.35,
			bodyY + bodyH * 0.25,
			cx + bodyW * 0.35,
			bodyY - bodyH * 0.18,
			palette.accent,
			scale
		);
	}
	if (/king/.test(id)) {
		for (const offset of [-1, 0, 1])
			fillDiamond(
				pixels,
				width,
				height,
				headX + offset * 4 * scale,
				headY - headR - 3 * scale,
				2 * scale,
				palette.accent
			);
	}
	if (/suture|clinic/.test(id)) {
		fillRect(
			pixels,
			width,
			height,
			cx - scale,
			bodyY - 4 * scale,
			2 * scale,
			8 * scale,
			palette.pale
		);
		fillRect(
			pixels,
			width,
			height,
			cx - 4 * scale,
			bodyY - scale,
			8 * scale,
			2 * scale,
			palette.pale
		);
	}
	if (/vane/.test(id)) {
		drawLine(
			pixels,
			width,
			height,
			headX,
			headY - headR,
			headX,
			headY - headR - 6 * scale,
			palette.accent,
			scale
		);
		drawLine(
			pixels,
			width,
			height,
			headX - 4 * scale,
			headY - headR - 4 * scale,
			headX + 4 * scale,
			headY - headR - 6 * scale,
			palette.accent,
			scale
		);
	}
	if (/feedback/.test(id)) {
		fillEllipse(
			pixels,
			width,
			height,
			cx - bodyW * 0.25,
			bodyY + bodyH * 0.05,
			4 * scale,
			4 * scale,
			palette.ink
		);
		fillEllipse(
			pixels,
			width,
			height,
			cx - bodyW * 0.25,
			bodyY + bodyH * 0.05,
			2 * scale,
			2 * scale,
			palette.accent
		);
	}

	if (/lancer|partisan|bailiff|judge/.test(id) || pose.attack) {
		const reach = pose.attack ? (boss ? 34 : 18) * scale : (boss ? 22 : 12) * scale;
		drawLine(
			pixels,
			width,
			height,
			cx + bodyW * 0.25,
			bodyY,
			cx + bodyW * 0.25 + reach,
			bodyY - 3 * scale,
			outline,
			Math.max(1, scale)
		);
		fillDiamond(
			pixels,
			width,
			height,
			cx + bodyW * 0.25 + reach,
			bodyY - 3 * scale,
			2 * scale,
			palette.accent
		);
	}
	if (/juno_jar/.test(id)) {
		fillRect(
			pixels,
			width,
			height,
			cx - bodyW * 0.72,
			bodyY - 4 * scale,
			7 * scale,
			11 * scale,
			palette.secondary
		);
		strokeRect(
			pixels,
			width,
			height,
			cx - bodyW * 0.72,
			bodyY - 4 * scale,
			7 * scale,
			11 * scale,
			outline,
			scale
		);
	}
	if (/mara_modulo/.test(id)) {
		fillRect(
			pixels,
			width,
			height,
			headX - headR * 0.6,
			headY - 2 * scale,
			headR * 1.2,
			3 * scale,
			palette.accent
		);
	}

	if (pose.stunned) {
		drawSpark(
			pixels,
			width,
			height,
			headX - 6 * scale,
			headY - 10 * scale,
			2 * scale,
			palette.accent
		);
		drawSpark(pixels, width, height, headX + 7 * scale, headY - 7 * scale, 2 * scale, palette.pale);
	}
	if (pose.victory) {
		drawSpark(
			pixels,
			width,
			height,
			cx - bodyW * 0.7,
			bodyY - bodyH * 0.5,
			3 * scale,
			palette.accent
		);
		drawSpark(
			pixels,
			width,
			height,
			cx + bodyW * 0.8,
			bodyY - bodyH * 0.2,
			2 * scale,
			palette.pale
		);
	}
}

function drawSmallFaction(pixels, width, height, cx, ground, scale, palette, pose, alpha) {
	for (const member of [-1, 0, 1]) {
		const mx = cx + member * 9 * scale + (member === 0 ? pose.lean : 0);
		const my = ground - (member === 0 ? 2 : 0) * scale;
		fillRect(pixels, width, height, mx - 3 * scale, my - 13 * scale, 6 * scale, 10 * scale, [
			...palette.primary.slice(0, 3),
			alpha,
		]);
		fillEllipse(
			pixels,
			width,
			height,
			mx,
			my - 15 * scale,
			4 * scale,
			4 * scale,
			palette.secondary
		);
		fillRect(pixels, width, height, mx + scale, my - 16 * scale, scale, scale, palette.ink);
		fillRect(
			pixels,
			width,
			height,
			mx - 3 * scale,
			my - 8 * scale,
			6 * scale,
			2 * scale,
			palette.accent
		);
	}
}

function drawMossFrame(pixels, width, height, sheet, label, frame, frameCount, x, y) {
	const [fw, fh] = sheet.frameSize;
	const pose = animationPose(label, frame, frameCount, 1);
	const ink = [18, 19, 23, 255];
	const fur = pose.hurt ? [158, 74, 67, 255] : [108, 101, 91, 255];
	const stripe = [241, 232, 211, 255];
	const scarf = [102, 139, 77, 255];
	const amber = [231, 167, 47, 255];
	const cx = x + fw / 2 + pose.lean;
	const ground = y + fh - 4;
	const bodyY = ground - 17 + pose.bob;

	fillEllipse(pixels, width, height, cx, ground - 1, 13, 3, [0, 0, 0, 70]);
	if (pose.death) {
		fillEllipse(pixels, width, height, cx + frame, ground - 5, 14, 4, ink);
		fillEllipse(pixels, width, height, cx + frame, ground - 6, 12, 3, fur);
		return;
	}
	fillEllipse(pixels, width, height, cx - 10, bodyY + 2, 10, 6, ink);
	fillEllipse(pixels, width, height, cx - 11, bodyY + 2, 8, 4, fur);
	fillRect(pixels, width, height, cx - 8 + pose.stride, ground - 10, 5, 8, ink);
	fillRect(pixels, width, height, cx + 3 - pose.stride, ground - 10, 5, 8, ink);
	fillEllipse(pixels, width, height, cx, bodyY, 13, 12, ink);
	fillEllipse(pixels, width, height, cx + 1, bodyY - 1, 11, 10, fur);
	fillRect(pixels, width, height, cx - 8, bodyY + 2, 16, 3, scarf);
	fillEllipse(pixels, width, height, cx + 8, bodyY - 10, 8, 7, ink);
	fillEllipse(pixels, width, height, cx + 9, bodyY - 10, 7, 6, fur);
	fillDiamond(pixels, width, height, cx + 4, bodyY - 16, 3, ink);
	fillDiamond(pixels, width, height, cx + 10, bodyY - 17, 3, ink);
	drawLine(pixels, width, height, cx + 5, bodyY - 15, cx + 11, bodyY - 5, stripe, 3);
	fillRect(pixels, width, height, cx + 11, bodyY - 12, 2, 2, amber);
	fillRect(pixels, width, height, cx + 15, bodyY - 8, 2, 2, ink);

	if (/katana/.test(label)) {
		drawLine(pixels, width, height, cx + 8, bodyY, cx + 22, bodyY - 8, stripe, 2);
		fillRect(pixels, width, height, cx + 6, bodyY - 1, 5, 3, amber);
	} else if (/claws|parry/.test(label)) {
		for (let claw = 0; claw < 3; claw++)
			drawLine(
				pixels,
				width,
				height,
				cx + 8,
				bodyY + claw * 2,
				cx + 17,
				bodyY - 3 + claw * 2,
				stripe
			);
	} else if (/shoot/.test(label)) {
		fillRect(pixels, width, height, cx + 7, bodyY - 3, 15, 6, [55, 65, 80, 255]);
		fillRect(pixels, width, height, cx + 18, bodyY - 2, 6, 2, amber);
	} else if (/rocket/.test(label)) {
		fillRect(pixels, width, height, cx - 10, bodyY - 5, 6, 13, [66, 76, 91, 255]);
		fillDiamond(pixels, width, height, cx - 7, bodyY + 12, 4, [241, 126, 44, 255]);
	}
	if (pose.glow) drawSpark(pixels, width, height, cx - 12, bodyY - 13, 3, [108, 219, 194, 255]);
}

function drawItemFrame(pixels, width, height, sheet, label, frame, frameCount, x, y) {
	const [fw, fh] = sheet.frameSize;
	const key = label.toLowerCase();
	const palette = paletteFor(key);
	const bob = Math.round(Math.sin((frame / Math.max(1, frameCount)) * Math.PI * 2) * 2);
	const cx = x + fw / 2;
	const cy = y + fh / 2 + bob;
	fillEllipse(pixels, width, height, cx, cy + 9, 8, 2, [0, 0, 0, 54]);
	fillEllipse(pixels, width, height, cx, cy, 11, 11, [...palette.accent.slice(0, 3), 34]);

	if (/rocket/.test(key)) {
		fillRect(pixels, width, height, cx - 6, cy - 8, 12, 15, palette.primary);
		fillRect(pixels, width, height, cx - 3, cy - 7, 6, 9, palette.secondary);
		fillDiamond(pixels, width, height, cx, cy + 9, 4, [240, 115, 38, 255]);
	} else if (/railgun/.test(key)) {
		fillRect(pixels, width, height, cx - 11, cy - 3, 20, 6, palette.primary);
		fillRect(pixels, width, height, cx + 6, cy - 2, 7, 2, palette.accent);
		fillRect(pixels, width, height, cx - 5, cy + 3, 5, 5, palette.ink);
	} else if (/stim/.test(key)) {
		fillRect(pixels, width, height, cx - 5, cy - 10, 10, 20, palette.secondary);
		fillRect(pixels, width, height, cx - 1, cy - 6, 2, 12, [219, 61, 71, 255]);
		fillRect(pixels, width, height, cx - 5, cy - 1, 10, 2, [219, 61, 71, 255]);
	} else if (/katana|claws|phase_pick|tooth/.test(key)) {
		for (let line = 0; line < (/claws/.test(key) ? 3 : 1); line++)
			drawLine(
				pixels,
				width,
				height,
				cx - 8,
				cy + 8 - line * 3,
				cx + 9,
				cy - 9 - line * 2,
				palette.secondary,
				2
			);
		fillRect(pixels, width, height, cx - 10, cy + 7, 7, 3, palette.accent);
	} else if (/shield|talisman|mirror/.test(key)) {
		fillDiamond(pixels, width, height, cx, cy, 10, palette.primary);
		fillDiamond(pixels, width, height, cx, cy, 6, palette.secondary);
		fillDiamond(pixels, width, height, cx, cy, 2, palette.accent);
	} else if (/cassette/.test(key)) {
		fillRect(pixels, width, height, cx - 10, cy - 7, 20, 14, palette.primary);
		strokeRect(pixels, width, height, cx - 10, cy - 7, 20, 14, palette.ink);
		fillEllipse(pixels, width, height, cx - 5, cy, 3, 3, palette.secondary);
		fillEllipse(pixels, width, height, cx + 5, cy, 3, 3, palette.secondary);
	} else if (/boots/.test(key)) {
		fillRect(pixels, width, height, cx - 9, cy - 7, 7, 13, palette.primary);
		fillRect(pixels, width, height, cx + 2, cy - 7, 7, 13, palette.primary);
		fillRect(pixels, width, height, cx - 9, cy + 4, 10, 4, palette.accent);
		fillRect(pixels, width, height, cx + 2, cy + 4, 10, 4, palette.accent);
	} else if (/swarm/.test(key)) {
		for (let mote = 0; mote < 6; mote++) {
			const angle = (mote / 6) * Math.PI * 2 + frame * 0.3;
			fillDiamond(
				pixels,
				width,
				height,
				cx + Math.cos(angle) * 8,
				cy + Math.sin(angle) * 7,
				2,
				mote % 2 ? palette.accent : palette.secondary
			);
		}
	} else {
		fillDiamond(pixels, width, height, cx, cy, 10, palette.primary);
		fillDiamond(pixels, width, height, cx, cy, 6, palette.secondary);
		drawSpark(pixels, width, height, cx, cy, 3, palette.accent);
	}
}

const worldPalettes = {
	lower_sprawl: [
		[23, 29, 42, 255],
		[53, 61, 74, 255],
		[149, 78, 54, 255],
		[79, 190, 161, 255],
	],
	chrome_arcology: [
		[18, 31, 48, 255],
		[76, 103, 123, 255],
		[176, 211, 224, 255],
		[85, 215, 238, 255],
	],
	straylight_mirage: [
		[29, 18, 48, 255],
		[91, 60, 119, 255],
		[210, 142, 232, 255],
		[82, 214, 231, 255],
	],
	dub_colony: [
		[35, 25, 43, 255],
		[87, 61, 83, 255],
		[102, 147, 83, 255],
		[241, 153, 54, 255],
	],
	antenna_barrens: [
		[35, 34, 40, 255],
		[104, 74, 57, 255],
		[171, 91, 48, 255],
		[98, 190, 198, 255],
	],
	orbital_lift: [
		[15, 23, 36, 255],
		[68, 81, 96, 255],
		[159, 170, 178, 255],
		[239, 188, 53, 255],
	],
	asteroid_redoubt: [
		[23, 20, 34, 255],
		[83, 68, 84, 255],
		[142, 96, 65, 255],
		[217, 68, 116, 255],
	],
};

function worldKey(id) {
	return Object.keys(worldPalettes).find((key) => id.includes(key)) ?? 'lower_sprawl';
}

function drawTileFrame(pixels, width, height, sheet, label, frame, _frameCount, x, y) {
	const [fw, fh] = sheet.frameSize;
	const palette = worldPalettes[worldKey(sheet.id)];
	const key = label.toLowerCase();
	fillRect(pixels, width, height, x, y, fw, fh, palette[0]);

	if (/floor|brick|asphalt|paver|plate|block|grating/.test(key)) {
		for (let yy = 0; yy < fh; yy += 8) {
			for (let xx = 0; xx < fw; xx += 12) {
				const offset = (yy / 8) % 2 ? 6 : 0;
				fillRect(
					pixels,
					width,
					height,
					x + xx + offset,
					y + yy,
					10,
					6,
					(xx + yy + frame) % 3 ? palette[1] : palette[2]
				);
			}
		}
	} else if (/cable|wire|strap|vine/.test(key)) {
		fillRect(pixels, width, height, x, y, fw, fh, palette[1]);
		for (let line = 0; line < 4; line++) {
			const yy = y + 5 + line * 7;
			drawLine(
				pixels,
				width,
				height,
				x - 2,
				yy + ((frame + line) % 3),
				x + fw + 2,
				yy - ((frame + line) % 3),
				line % 2 ? palette[3] : palette[2],
				2
			);
		}
	} else if (/sign|panel|warning|chevron|banner|awning|holo/.test(key)) {
		fillRect(pixels, width, height, x, y, fw, fh, palette[1]);
		strokeRect(pixels, width, height, x + 3, y + 3, fw - 6, fh - 6, palette[3], 2);
		for (let step = -fw; step < fw * 2; step += 12) {
			drawLine(
				pixels,
				width,
				height,
				x + step + frame * 3,
				y + fh - 5,
				x + step + 8 + frame * 3,
				y + 5,
				palette[2],
				3
			);
		}
	} else if (/pipe|rail|mast|dish|door|gate|rack|stack|column|crate|shrine|tower/.test(key)) {
		fillRect(pixels, width, height, x, y, fw, fh, palette[1]);
		strokeRect(pixels, width, height, x + 3, y + 2, fw - 6, fh - 4, palette[2], 2);
		fillRect(pixels, width, height, x + 7, y + 6, fw - 14, 4, palette[0]);
		fillRect(pixels, width, height, x + 7, y + fh - 10, fw - 14, 4, palette[3]);
	} else {
		fillRect(pixels, width, height, x, y, fw, fh, palette[1]);
		for (let spark = 0; spark < 5; spark++) {
			const sx = x + 4 + Math.floor(seededValue(`${sheet.id}:${label}:${frame}`, spark) * (fw - 8));
			const sy =
				y + 4 + Math.floor(seededValue(`${sheet.id}:${label}:${frame}:y`, spark) * (fh - 8));
			drawSpark(
				pixels,
				width,
				height,
				sx,
				sy,
				1 + ((spark + frame) % 3),
				spark % 2 ? palette[2] : palette[3]
			);
		}
	}
	strokeRect(pixels, width, height, x, y, fw, fh, shade(palette[0], -12));
}

function drawParallaxFrame(pixels, width, height, sheet, label, frame, _frameCount, x, y) {
	const [fw, fh] = sheet.frameSize;
	const palette = worldPalettes[worldKey(sheet.id)];
	const layer = /back/.test(label) ? 0 : /mid/.test(label) ? 1 : 2;
	if (layer === 0) {
		for (let yy = 0; yy < fh; yy++) {
			const amount = yy / fh;
			fillRect(pixels, width, height, x, y + yy, fw, 1, mix(palette[0], palette[1], amount * 0.72));
		}
		for (let star = 0; star < 26; star++) {
			const sx = x + Math.floor(seededValue(`${sheet.id}:star`, star) * fw);
			const sy = y + Math.floor(seededValue(`${sheet.id}:star:y`, star) * fh * 0.62);
			setPixel(pixels, width, height, sx, sy, star % 4 ? palette[2] : palette[3]);
		}
	}
	const baseY = y + fh - (layer === 0 ? 30 : layer === 1 ? 18 : 8);
	const buildingColor =
		layer === 0 ? shade(palette[0], 10) : layer === 1 ? palette[1] : shade(palette[1], -24);
	const count = layer === 0 ? 10 : layer === 1 ? 13 : 17;
	for (let i = 0; i < count; i++) {
		const bw = 12 + Math.floor(seededValue(`${sheet.id}:${label}:w`, i) * (layer === 2 ? 22 : 36));
		const bh = 18 + Math.floor(seededValue(`${sheet.id}:${label}:h`, i) * (layer === 0 ? 65 : 92));
		const bx = x + Math.floor((i / count) * fw) - ((frame * (layer + 1) * 3) % 18);
		fillRect(pixels, width, height, bx, baseY - bh, bw, bh, buildingColor);
		if (layer > 0) {
			for (let wy = baseY - bh + 7; wy < baseY - 5; wy += 9) {
				for (let wx = bx + 4; wx < bx + bw - 3; wx += 8) {
					if ((wx + wy + i) % 3)
						fillRect(pixels, width, height, wx, wy, 2, 3, i % 4 ? palette[2] : palette[3]);
				}
			}
		}
	}
	if (layer === 2) {
		for (let wire = 0; wire < 5; wire++) {
			const wy = y + 28 + wire * 24;
			drawLine(
				pixels,
				width,
				height,
				x,
				wy,
				x + fw,
				wy + ((wire % 2) * 12 - 6),
				shade(palette[0], -18),
				2
			);
		}
		fillRect(pixels, width, height, x, y + fh - 8, fw, 8, shade(palette[0], -30));
	}
}

function sheetDimensions(sheet) {
	const [fw, fh] = sheet.frameSize;
	if (sheet.grid) return [fw * sheet.grid.columns, fh * sheet.grid.rows];
	const maxFrames = Math.max(
		...Object.values(sheet.animations).map((animation) => animation.frames)
	);
	return [fw * maxFrames, fh * Math.max(1, Object.keys(sheet.animations).length)];
}

function drawFrame(pixels, width, height, sheet, label, frame, frameCount, x, y) {
	if (sheet.id === 'moss_badger') {
		drawMossFrame(pixels, width, height, sheet, label, frame, frameCount, x, y);
	} else if (/parallax/.test(sheet.id)) {
		drawParallaxFrame(pixels, width, height, sheet, label, frame, frameCount, x, y);
	} else if (/tiles/.test(sheet.id)) {
		drawTileFrame(pixels, width, height, sheet, label, frame, frameCount, x, y);
	} else if (/items_core|item_icons/.test(sheet.id)) {
		drawItemFrame(pixels, width, height, sheet, label, frame, frameCount, x, y);
	} else {
		drawEntityFrame(pixels, width, height, sheet, label, frame, frameCount, x, y);
	}
}

function renderSheet(sheet) {
	const [width, height] = sheetDimensions(sheet);
	const pixels = Buffer.alloc(width * height * 4);
	const [fw, fh] = sheet.frameSize;

	if (sheet.grid) {
		const frameAssignments = new Map();
		for (const [label, animation] of Object.entries(sheet.animations)) {
			const order =
				animation.order ?? Array.from({ length: animation.frames }, (_, frame) => frame);
			order.forEach((atlasFrame, animationFrame) => {
				frameAssignments.set(atlasFrame, { label, animationFrame, frameCount: animation.frames });
			});
		}
		for (let atlasFrame = 0; atlasFrame < sheet.grid.columns * sheet.grid.rows; atlasFrame++) {
			const assignment = frameAssignments.get(atlasFrame);
			if (!assignment) continue;
			drawFrame(
				pixels,
				width,
				height,
				sheet,
				assignment.label,
				assignment.animationFrame,
				assignment.frameCount,
				(atlasFrame % sheet.grid.columns) * fw,
				Math.floor(atlasFrame / sheet.grid.columns) * fh
			);
		}
	} else {
		Object.entries(sheet.animations).forEach(([label, animation], row) => {
			for (let frame = 0; frame < animation.frames; frame++) {
				drawFrame(
					pixels,
					width,
					height,
					sheet,
					label,
					frame,
					animation.frames,
					frame * fw,
					row * fh
				);
			}
		});
	}

	return encodePng(width, height, pixels);
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

function encodePng(width, height, pixels) {
	const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(width, 0);
	ihdr.writeUInt32BE(height, 4);
	ihdr[8] = 8;
	ihdr[9] = 6;
	const raw = Buffer.alloc((width * 4 + 1) * height);
	for (let row = 0; row < height; row++) {
		const target = row * (width * 4 + 1);
		raw[target] = 0;
		pixels.copy(raw, target + 1, row * width * 4, (row + 1) * width * 4);
	}
	return Buffer.concat([
		header,
		chunk('IHDR', ihdr),
		chunk('IDAT', deflateSync(raw, { level: 9 })),
		chunk('IEND', Buffer.alloc(0)),
	]);
}

const missingSheets = manifest.sheets.filter((sheet) => overwrite || !existsSync(sheet.file));
if (missingSheets.length === 0) {
	console.log('No missing sprite sheets found. Use --overwrite to regenerate fallback sheets.');
	process.exit(0);
}

for (const sheet of missingSheets) {
	const png = renderSheet(sheet);
	const sourceTarget = sheet.file;
	const runtimeTarget = join(publicRoot, sheet.file);
	console.log(`${dryRun ? '[dry-run] ' : ''}${sheet.id}: ${sourceTarget} + ${runtimeTarget}`);
	if (dryRun) continue;
	await mkdir(dirname(sourceTarget), { recursive: true });
	await mkdir(dirname(runtimeTarget), { recursive: true });
	await writeFile(sourceTarget, png);
	await writeFile(runtimeTarget, png);
}

console.log(
	`${dryRun ? 'Would generate' : 'Generated'} ${missingSheets.length} deterministic pixel-art fallback sprite sheets.`
);
