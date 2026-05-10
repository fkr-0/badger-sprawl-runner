import { createRunnerApp } from './RunnerApp';

const canvas = document.querySelector<HTMLCanvasElement>('#game');
const statusEl = document.querySelector<HTMLElement>('#status');
const miniEl = document.querySelector<HTMLElement>('#minigame');

if (!canvas) throw new Error('Canvas not found');
if (!statusEl) throw new Error('Status panel not found');
if (!miniEl) throw new Error('Minigame panel not found');

const app = createRunnerApp(canvas);
app.start();

statusEl.innerHTML = '<strong>Mode:</strong> SceneManager shell';
miniEl.innerHTML =
	'<strong>Controls:</strong> Arrow keys navigate. Enter/Space confirms. Escape/back behavior is scene-specific.<br/><strong>Implemented slice:</strong> SceneManager routes Story, VS, Training, and Skills through concrete scenes.';
