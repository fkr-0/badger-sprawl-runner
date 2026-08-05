// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import { LEGACY_SHOP_SCENE_QUARANTINED, ShopScene } from './ShopScene';

describe('legacy ShopScene quarantine', () => {
	it('keeps the compatibility route inert and returns without touching persistence', () => {
		const onReturn = vi.fn();
		const scene = new ShopScene(onReturn);
		expect(LEGACY_SHOP_SCENE_QUARANTINED).toBe(true);
		scene.onEnter({
			eventBus: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
			canvas: document.createElement('canvas'),
		});
		window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
		scene.onExit();
		expect(onReturn).toHaveBeenCalledOnce();
	});
});
