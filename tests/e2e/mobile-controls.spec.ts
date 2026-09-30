import { expect, test } from '@playwright/test';

for (const viewport of [
	{ name: 'portrait', width: 390, height: 844 },
	{ name: 'short-landscape', width: 844, height: 390 },
]) {
	test(`mobile runner surface stays contained in ${viewport.name}`, async ({ page }) => {
		await page.setViewportSize({ width: viewport.width, height: viewport.height });
		await page.goto('/');

		const layout = await page.locator('#game').evaluate((canvas) => {
			const rect = canvas.getBoundingClientRect();
			const style = getComputedStyle(canvas);
			return {
				left: rect.left,
				top: rect.top,
				right: rect.right,
				bottom: rect.bottom,
				width: rect.width,
				height: rect.height,
				touchAction: style.touchAction,
				documentWidth: document.documentElement.scrollWidth,
				documentHeight: document.documentElement.scrollHeight,
			};
		});

		expect(layout.left).toBeGreaterThanOrEqual(0);
		expect(layout.top).toBeGreaterThanOrEqual(0);
		expect(layout.right).toBeLessThanOrEqual(viewport.width + 1);
		expect(layout.bottom).toBeLessThanOrEqual(viewport.height + 1);
		expect(layout.width / layout.height).toBeCloseTo(16 / 9, 2);
		expect(layout.touchAction).toBe('none');
		expect(layout.documentWidth).toBeLessThanOrEqual(viewport.width);
		expect(layout.documentHeight).toBeLessThanOrEqual(viewport.height);
	});
}

test('browser gesture mapper recognizes jump, dodge and slide swipes', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');

	const gestures = await page.evaluate(async () => {
		const { createRunnerTouchController } = await import('/src/systems/RunnerTouchInput.ts');
		const canvas = document.querySelector('#game');
		if (!(canvas instanceof HTMLCanvasElement)) throw new Error('runner canvas missing');
		let pointers = [];
		const pointer = { snapshot: () => ({ pointers }) };
		const controller = createRunnerTouchController({ pointer, surface: canvas, pulseFrames: 3 });
		const rect = canvas.getBoundingClientRect();
		const x = rect.left + rect.width * 0.5;
		const y = rect.top + rect.height * 0.5;
		let sequence = 0;
		const touch = (id, px, py) => ({
			pointerId: id,
			pointerType: 'touch',
			x: px,
			y: py,
			pressure: 1,
			buttons: 1,
			isPrimary: true,
			sequence: ++sequence,
		});

		pointers = [touch(1, x, y)];
		controller.read();
		pointers = [touch(1, x, y - rect.height * 0.2)];
		const jump = controller.read();

		controller.reset();
		pointers = [];
		controller.read();
		pointers = [touch(2, x, y)];
		controller.read();
		pointers = [touch(2, x + rect.width * 0.2, y)];
		const dodge = controller.read();

		controller.reset();
		pointers = [];
		controller.read();
		pointers = [touch(3, x, y)];
		controller.read();
		pointers = [touch(3, x, y + rect.height * 0.2)];
		const slide = controller.read();

		return { jump, dodge, slide };
	});

	expect(gestures.jump).toMatchObject({ jump: true, jumpPressed: true });
	expect(gestures.dodge).toMatchObject({ moveRight: true, dodge: true, dodgePressed: true });
	expect(gestures.slide).toMatchObject({ fastFall: true, dodge: true, dodgePressed: true });
});
