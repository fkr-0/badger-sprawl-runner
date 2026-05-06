import { describe, expect, it } from 'vitest';
import { createGameFlow } from './GameFlow';

describe('Badger Sprawl Runner game flow', () => {
  it('starts on a working menu with story, versus, training, and skills entries', () => {
    const flow = createGameFlow();

    expect(flow.getState().mode).toBe('menu');
    expect(flow.getMenuOptions().map((option) => option.id)).toEqual([
      'story',
      'versus',
      'training',
      'skills',
    ]);
  });

  it('runs the first two story stages through dialogue beats', () => {
    const flow = createGameFlow();

    flow.selectMenu('story');
    expect(flow.getState()).toMatchObject({ mode: 'dialogue', dialogueId: 'prologue' });

    flow.advanceDialogue();
    flow.advanceDialogue();
    expect(flow.getState()).toMatchObject({ mode: 'stage', stageId: 'rootway-market', stageIndex: 0 });

    flow.completeStage();
    expect(flow.getState()).toMatchObject({ mode: 'dialogue', dialogueId: 'antenna-briefing' });

    flow.advanceDialogue();
    expect(flow.getState()).toMatchObject({ mode: 'stage', stageId: 'antenna-rooftops', stageIndex: 1 });
  });

  it('opens versus mode and dummy training mode from the menu', () => {
    const flow = createGameFlow();

    flow.selectMenu('versus');
    expect(flow.getState()).toMatchObject({ mode: 'versus', arenaId: 'duel-yard', winScore: 3 });

    flow.returnToMenu();
    flow.selectMenu('training');
    expect(flow.getState()).toMatchObject({
      mode: 'training',
      dummy: { invincible: true, label: 'Dummy Badger' },
    });
  });

  it('tracks versus tags until a player reaches the win score', () => {
    const flow = createGameFlow();

    flow.selectMenu('versus');
    expect(flow.scoreVersusTag('player')).toEqual({ winner: undefined, playerScore: 1, rivalScore: 0 });
    expect(flow.scoreVersusTag('rival')).toEqual({ winner: undefined, playerScore: 1, rivalScore: 1 });
    expect(flow.scoreVersusTag('player')).toEqual({ winner: undefined, playerScore: 2, rivalScore: 1 });
    expect(flow.scoreVersusTag('player')).toEqual({ winner: 'player', playerScore: 3, rivalScore: 1 });
    expect(flow.getState()).toMatchObject({ mode: 'versus', playerScore: 3, rivalScore: 1 });
  });

  it('operates the skill tree from earned blueprint shards', () => {
    const flow = createGameFlow({ blueprintShards: 1 });

    flow.selectMenu('skills');
    const result = flow.purchaseSkill('double_swipe');

    expect(result.ok).toBe(true);
    expect(flow.getMeta().blueprintShards).toBe(0);
    expect(flow.getMeta().purchasedSkills).toEqual(['double_swipe']);
  });
});
