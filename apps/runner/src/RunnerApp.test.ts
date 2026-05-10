import { describe, expect, it } from 'vitest';
import { createRunnerApp } from './RunnerApp';
import { TitleScene } from './scenes/TitleScene';
import { TrainingScene } from './scenes/TrainingScene';
import { VersusScene } from './scenes/VersusScene';

function installWindowStub(): void {
	const globalWithWindow = globalThis as typeof globalThis & {
		window?: { addEventListener: () => void; removeEventListener: () => void };
	};
	globalWithWindow.window ??= {
		addEventListener: () => {},
		removeEventListener: () => {},
	};
}

function createCanvasStub(): HTMLCanvasElement {
	return {
		width: 960,
		height: 540,
	} as HTMLCanvasElement;
}

describe('RunnerApp scene shell', () => {
	it('starts on TitleScene and routes menu selections through SceneManager', () => {
		installWindowStub();
		const app = createRunnerApp(createCanvasStub());

		app.start();
		expect(app.getCurrentScene()).toBeInstanceOf(TitleScene);

		app.routeMode('training');
		expect(app.getCurrentScene()).toBeInstanceOf(TrainingScene);

		app.routeMode('versus');
		expect(app.getCurrentScene()).toBeInstanceOf(VersusScene);
	});
});
