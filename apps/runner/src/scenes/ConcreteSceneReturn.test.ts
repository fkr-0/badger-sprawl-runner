import { describe, expect, it, vi } from 'vitest';
import { SkillTreeScene } from './SkillTreeScene';
import { TrainingScene } from './TrainingScene';
import { VersusScene } from './VersusScene';
import { StageRunScene } from './StageRunScene';

const sceneContext = {
	eventBus: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
	canvas: document.createElement('canvas'),
	renderer: { loadSprites: vi.fn().mockResolvedValue(undefined) },
};

describe('concrete scene return-to-title callbacks', () => {
	it('returns from TrainingScene on Escape', () => {
		const onReturnToTitle = vi.fn();
		const scene = new TrainingScene({ onReturnToTitle });
		scene.onEnter(sceneContext);
		window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));
		scene.onExit();
		expect(onReturnToTitle).toHaveBeenCalledOnce();
	});

	it('returns from SkillTreeScene on Escape', () => {
		const onReturnToTitle = vi.fn();
		const scene = new SkillTreeScene({ onReturnToTitle });
		scene.onEnter(sceneContext);
		window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));
		scene.onExit();
		expect(onReturnToTitle).toHaveBeenCalledOnce();
	});

	it('returns from VersusScene on Escape', () => {
		const onReturnToTitle = vi.fn();
		const scene = new VersusScene({ onReturnToTitle });
		scene.onEnter(sceneContext);
		window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));
		scene.onExit();
		expect(onReturnToTitle).toHaveBeenCalledOnce();
	});

	it('returns from StageRunScene on Escape', () => {
		const onReturnToTitle = vi.fn();
		const scene = new StageRunScene({ onReturnToTitle });
		scene.onEnter(sceneContext);
		window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));
		scene.onExit();
		expect(onReturnToTitle).toHaveBeenCalledOnce();
	});
});
