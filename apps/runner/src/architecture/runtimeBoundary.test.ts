import { describe, expect, it } from 'vitest';
import { getRuntimeBoundary, isLegacyRuntimePath, isSupportedRuntimePath } from './runtimeBoundary';

describe('runner runtime boundary', () => {
  it('documents the supported future runtime roots and legacy quarantine roots', () => {
    expect(getRuntimeBoundary()).toEqual({
      supportedRoots: ['src/main.ts', 'src/game/**/*.ts', 'src/architecture/**/*.ts', 'src/storage/**/*.ts'],
      quarantinedLegacyRoots: [
        'src/actors',
        'src/audio',
        'src/engine',
        'src/renderer',
        'src/scenes',
        'src/systems',
        'src/world',
        'src/main.js',
      ],
    });
  });

  it('classifies supported app paths without letting legacy scenes leak into runtime', () => {
    expect(isSupportedRuntimePath('src/main.ts')).toBe(true);
    expect(isSupportedRuntimePath('src/game/GameFlow.ts')).toBe(true);
    expect(isSupportedRuntimePath('src/storage/SaveStore.ts')).toBe(true);
    expect(isSupportedRuntimePath('src/scenes/StageRunScene.ts')).toBe(false);

    expect(isLegacyRuntimePath('src/scenes/StageRunScene.ts')).toBe(true);
    expect(isLegacyRuntimePath('src/systems/CombatSystem.ts')).toBe(true);
    expect(isLegacyRuntimePath('src/game/GameFlow.ts')).toBe(false);
  });
});
