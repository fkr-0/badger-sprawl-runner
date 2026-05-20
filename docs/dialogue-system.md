# Dialogue System

The dialogue system is the readable story layer for Badger Sprawl Runner. It keeps campaign text, branch choices, save-state consequences, and runtime stage launch separated so the action scene can stay deterministic and testable.

## Runtime responsibilities

```yaml
dialogue_runtime:
  campaign_source:
    barrel: apps/runner/src/game/Campaign.ts
    content_modules:
      - apps/runner/src/game/campaign/schema.ts
      - apps/runner/src/game/campaign/campaignData.ts
      - apps/runner/src/game/campaign/branchConsequences.ts
  state_machine:
    file: apps/runner/src/game/GameFlow.ts
    modes:
      - menu
      - title-card
      - dialogue
      - stage
      - debrief
      - versus
      - training
      - skills
      - endless
  presentation:
    file: apps/runner/src/scenes/StoryFlowScene.ts
    owns:
      - title-card advancement
      - briefing and debrief panels
      - stage choice panel
      - branch recap panel
      - stage debug panel
      - story-to-StageRun launch seam
  runtime_bridge:
    file: apps/runner/src/game/StageRunOptions.ts
    owns:
      - acquired payload projection
      - branch gameplay hooks
      - boss phase projection
      - tutorial beat projection
      - story balance rules
```

## State flow

```mermaid
flowchart TD
  A[TitleScene: Story Run] --> B[GameFlow.selectMenu('story')]
  B --> C[title-card]
  C -->|Enter/Space| D[dialogue]
  D -->|Enter/Space through lines| E[stage]
  E -->|choice number or Enter| F[GameFlow.chooseStageChoice]
  F --> G[BranchChoiceRecap]
  E -->|R| H[buildStageRunSceneOptions]
  H --> I[StageRunScene]
  I -->|stage completion through flow| J[debrief]
  J -->|Enter/Space through lines| K[next stage or campaign complete]
```

## Core contracts

```yaml
DialogueSpec:
  fields:
    - id
    - speaker
    - lines
  consumers:
    - GameFlow.getCurrentDialogue
    - StoryFlowScene.renderDialoguePanel

DebriefSpec:
  fields:
    - id
    - speaker
    - lines
  branch_expansion:
    source: BRANCH_DEBRIEF_LINES
    function: buildDebriefLines
  consumers:
    - GameFlow.getCurrentDebrief
    - GameFlow.advanceDebrief
    - StoryFlowScene.renderDialoguePanel

ChoiceOutcome:
  fields:
    - id
    - prompt
    - branch
    - resultFlag
    - consequence
    - metaDelta
  mutation_path:
    - GameFlow.chooseStageChoice
    - StoryProgress.resultFlags
    - StoryProgress.lioTrust
    - StoryProgress.colonyAlignment
    - StoryProgress.finalBroadcastDoctrine
    - MetaState.dubFavor
    - MetaState.orbitHeat

BranchChoiceRecap:
  fields:
    - stageId
    - selectedPrompt
    - branch
    - resultFlag
    - consequence
    - dubFavorDelta
    - orbitHeatDelta
  runtime_event: badger:story-choice-recap
  consumer: StoryFlowScene.renderChoiceRecap
```

## Choice consequences

Choices are not just flavor text. A committed choice can:

```yaml
choice_effects:
  save_flags:
    - resultFlags records the chosen branch outcome
    - major branch fields are promoted for Lio, colony alignment, and final broadcast doctrine
  economy:
    - metaDelta.dubFavor changes merchant favor
    - metaDelta.orbitHeat changes heat pressure
    - StoryBalanceRules turns heat/favor into price, ally, hazard, and ending-tone rules
  runtime:
    - BRANCH_CONSEQUENCES maps result flags to gameplayHook contracts
    - StageRunOptions passes branchGameplayHooks into StageRunScene
    - CompanionSystem resolves concrete companion modifiers
  readable_feedback:
    - StoryFlowScene shows the branch recap immediately
    - GameFlow appends branch-specific debrief lines
```

## Input model

```yaml
StoryFlowScene_controls:
  title-card:
    Enter: advance into briefing dialogue
    Space: advance into briefing dialogue
  dialogue:
    Enter: next line or stage panel
    Space: next line or stage panel
  stage:
    ArrowUp: previous choice
    ArrowDown: next choice
    1-9: commit numbered choice
    Enter: commit selected choice
    Space: commit selected choice
    D: toggle stage debug panel
    R: launch StageRunScene with buildStageRunSceneOptions
  debrief:
    Enter: next debrief line or next stage
    Space: next debrief line or next stage
```

## Branch-specific debriefs

Debriefs start with authored campaign lines, then `GameFlow.getCurrentDebrief()` appends branch lines derived from saved `resultFlags`.

```yaml
branch_debrief_examples:
  lio_protected: mercy costs heat but preserves one human channel
  colony_alignment_chorus: the colony hears itself as a chorus
  ledger_public_dump: the city argues with receipts in hand
  cargo_full_release: everyone can see the theft
  broadcast_publish_tools: every kid gets the manual, not just the myth
```

The important rule is that debrief expansion is derived from save state, not from transient UI state. This lets migrated saves and resumed sessions still show correct branch context.

## Save and migration behavior

```yaml
save_path:
  store: apps/runner/src/storage/SaveStore.ts
  migration: apps/runner/src/game/StoryProgressMigration.ts
  preserved_fields:
    - currentStageId
    - completedStageIds
    - completedChapterIds
    - acquiredPayloads
    - resultFlags
    - lioTrust
    - colonyAlignment
    - finalBroadcastDoctrine
    - campaignComplete
  repaired_fields:
    - invalid currentStageId falls back to lower-sprawl
    - duplicate arrays are deduped
    - branch fields can be inferred from legacy resultFlags
```

## Test and e2e coverage

```yaml
unit_tests:
  - apps/runner/src/game/GameFlow.test.ts
  - apps/runner/src/scenes/StoryFlowScene.test.ts
  - apps/runner/src/game/StageRunOptions.test.ts
  - apps/runner/src/game/StoryProgressMigration.test.ts

e2e_tests:
  - tests/e2e/story-choice-recap.spec.ts
  - tests/e2e/story-content.spec.ts
  - tests/e2e/stage-debug-panel.spec.ts
  - tests/e2e/legacy-save-migration.spec.ts
  - tests/e2e/story-balance.spec.ts

contract_tests:
  - tests/runtime-contracts.mjs
```

## Adding a new dialogue choice

```yaml
checklist:
  - add the choice to the relevant CampaignStage.choice.outcomes entry
  - use a stable resultFlag name
  - add metaDelta only when heat/favor should change
  - add a BRANCH_CONSEQUENCES entry only when runtime behavior should change
  - add a BRANCH_DEBRIEF_LINES entry when debrief text should reflect the choice
  - add or update GameFlow tests for save/meta mutation
  - add e2e only when the choice is reachable from the title/story UI
```

## Current limits

```yaml
limits:
  - debrief completion is covered at GameFlow level; browser runtime does not yet expose normal stage-complete UI
  - minigame dialogue contracts are visible in StoryFlow but not full minigame runtime scenes
  - final art/audio and voice barks are still placeholder/deferred work
```
