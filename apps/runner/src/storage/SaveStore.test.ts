import { describe, expect, it } from 'vitest';
import { createGameFlow } from '../game/GameFlow';
import { createMemorySaveDriver, loadGameFlow, saveGameFlow } from './SaveStore';

describe('save store', () => {
  it('round-trips game meta through a storage driver', () => {
    const driver = createMemorySaveDriver();
    const flow = createGameFlow({ blueprintShards: 1 });

    expect(flow.purchaseSkill('double_swipe').ok).toBe(true);
    saveGameFlow(driver, flow);

    const loaded = loadGameFlow(driver);
    expect(loaded.getMeta()).toMatchObject({
      blueprintShards: 0,
      purchasedSkills: ['double_swipe'],
    });
  });

  it('falls back to a new flow when stored data is corrupt', () => {
    const driver = createMemorySaveDriver();
    driver.setItem('badger-sprawl-runner.save.v1', '{not-json');

    const loaded = loadGameFlow(driver);

    expect(loaded.getMeta()).toMatchObject({ blueprintShards: 0, purchasedSkills: [] });
  });
});
