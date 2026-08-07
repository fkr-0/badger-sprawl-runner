import { type Page, expect } from '@playwright/test';
import type { BadgerTestHarness } from '../../../apps/runner/src/main';

interface AsteroidObjectiveWindow extends Window {
	__badger: BadgerTestHarness;
}

const ASTEROID_INTERFACE_SOLUTIONS: Readonly<Record<string, readonly number[]>> = {
	'transmitter-root-listen': [0, 2, 1],
	'transmitter-root-teach': [1, 0, 2],
	'transmitter-root-release': [2, 1, 0],
};

export async function completeAsteroidObjectives(page: Page): Promise<void> {
	const nonBossIds = await page.evaluate(() =>
		((window as AsteroidObjectiveWindow).__badger.getEnemies() ?? [])
			.filter((enemy) => !enemy.bossId && typeof enemy.id === 'string')
			.map((enemy) => enemy.id as string)
	);
	for (const enemyId of nonBossIds) {
		await page.evaluate(
			(id) => (window as AsteroidObjectiveWindow).__badger.setEnemyHp(id, 0),
			enemyId
		);
	}

	const snapshot = await page.evaluate(() =>
		(window as AsteroidObjectiveWindow).__badger.getLateStageObjectives()
	);
	if (!snapshot) throw new Error('Asteroid objective snapshot was not installed');

	for (const node of snapshot.primaryNodes) {
		await page.evaluate(
			([x, y]) => (window as AsteroidObjectiveWindow).__badger.teleportPlayer(x - 17, y - 23),
			[node.x, node.y]
		);
		await page.waitForTimeout(45);
		await page.keyboard.press('KeyM');
		await expect
			.poll(() =>
				page.evaluate(() =>
					(window as AsteroidObjectiveWindow).__badger.getLateStageObjectives()?.interface
				)
			)
			.toMatchObject({ status: 'active', nodeId: node.id });

		const interfaceState = await page.evaluate(() =>
			(window as AsteroidObjectiveWindow).__badger.getLateStageObjectives()?.interface
		);
		if (!interfaceState || interfaceState.status !== 'active') {
			throw new Error(`Asteroid interface did not open for ${node.id}`);
		}
		if (interfaceState.kind === 'fasttype') {
			await page.keyboard.type(interfaceState.target);
		} else {
			const solution = ASTEROID_INTERFACE_SOLUTIONS[interfaceState.nodeId];
			if (!solution) throw new Error(`Missing Asteroid interface solution for ${interfaceState.nodeId}`);
			for (let columnIndex = 0; columnIndex < interfaceState.columns.length; columnIndex += 1) {
				await page.keyboard.press(`Digit${(solution[columnIndex] ?? 0) + 1}`);
				if (columnIndex < interfaceState.columns.length - 1) {
					await page.keyboard.press('ArrowRight');
				}
			}
		}
		await page.keyboard.press('Enter');
		await expect
			.poll(() =>
				page.evaluate(
					(id) =>
						(window as AsteroidObjectiveWindow).__badger
							.getLateStageObjectives()
							?.primaryNodes.find((entry) => entry.id === id)?.completed,
					node.id
				)
			)
			.toBe(true);
	}

	for (const node of snapshot.supportNodes) {
		await page.evaluate(
			([x, y]) => (window as AsteroidObjectiveWindow).__badger.teleportPlayer(x - 17, y - 23),
			[node.x, node.y]
		);
		await page.waitForTimeout(45);
		await page.keyboard.press('KeyM');
		await expect
			.poll(() =>
				page.evaluate(
					(id) =>
						(window as AsteroidObjectiveWindow).__badger
							.getLateStageObjectives()
							?.supportNodes.find((entry) => entry.id === id)?.completed,
					node.id
				)
			)
			.toBe(true);
	}

	await expect
		.poll(() => page.evaluate(() => (window as AsteroidObjectiveWindow).__badger.getLateStageObjectives()))
		.toMatchObject({ primaryComplete: true, supportComplete: true, tutorialComplete: true });
}
