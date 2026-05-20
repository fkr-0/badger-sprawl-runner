# Companion System

Badger Sprawl Runner currently implements a lightweight runtime companion layer that turns branch consequences into concrete gameplay modifiers. The system is intentionally small: companions do not pathfind as separate actors yet, but their abilities are visible in combat, HUD state, branch balancing, and e2e-observable StageRun configuration.

## Runtime files

```yaml
runtime_sources:
  companion_system: apps/runner/src/systems/CompanionSystem.ts
  stage_runtime_wiring: apps/runner/src/scenes/StageRunScene.ts
  branch_consequence_source: apps/runner/src/game/campaign/branchConsequences.ts
  stage_option_projection: apps/runner/src/game/StageRunOptions.ts
  hud_surface: apps/runner/src/renderer/UIRenderer.ts
  tests:
    - apps/runner/src/systems/CompanionSystem.test.ts
    - apps/runner/src/game/StageRunOptions.test.ts
    - tests/e2e/story-balance.spec.ts
    - tests/e2e/stage-runtime-config.spec.ts
```

## Implemented companions

```yaml
companions:
  naya_root:
    current_role: defensive shield support
    runtime_fields:
      - CompanionRuntimeState.nayaShield
      - player.companionShield
    behavior:
      - recharges shield over time
      - mitigates incoming damage while shield is available
      - branch hook naya_shield_bonus increases the shield cap
    hud:
      - UIRenderer shows Naya shield value

  rook_null:
    current_role: enemy/ambush overlay support
    runtime_fields:
      - CompanionRuntimeState.rookOverlayUntil
      - player.rookOverlayActive
      - enemy.rookMarked
    behavior:
      - marks living enemies when the overlay is active
      - branch hook ambush_warning_overlay extends overlay time
      - ambush warning text is appended to Auntie hints when that hook is active
    hud:
      - enemy markers are fed through CombatEntity.rookMarked

  auntie_subharmonic:
    current_role: contextual hint support
    runtime_fields:
      - CompanionRuntimeState.auntieHint
      - CompanionRuntimeState.hintTimer
      - player.companionHint
    behavior:
      - emits context-sensitive hints based on low health, enemy position, or rocket possession
      - branch hooks can make hints arrive earlier or later
    hud:
      - UIRenderer shows the current companion hint
```

## Branch hooks to modifiers

`GameFlow.getActiveBranchConsequences()` resolves saved `StoryProgress.resultFlags` into branch consequence records. `StageRunOptions` passes their `gameplayHook` values into `StageRunScene`, where `resolveCompanionGameplayModifiers()` converts hook strings into concrete companion modifiers.

```yaml
hook_mapping:
  companion_assist_ready:
    source_example: lio_protected
    modifier: assistHintLeadSeconds +1.4
    effect: Auntie support/hints arrive sooner
  companion_assist_delay:
    source_example: lio_exposed
    modifier: assistHintLeadSeconds -1
    effect: Auntie support/hints arrive later
  naya_shield_bonus:
    source_example: colony_alignment_chorus
    modifier: nayaShieldBonus +1
    effect: Naya shield cap starts and recharges higher
  ambush_warning_overlay:
    source_example: late-floor/endless or branch consequence hooks
    modifiers:
      - rookOverlayBonusSeconds +0.9
      - ambushWarningOverlay true
    effect: Rook marks danger longer and Auntie hints mention ambush routes
```

## StageRun tick integration

```yaml
stage_run_order:
  construction:
    - StageRunScene receives branchGameplayHooks
    - resolveCompanionGameplayModifiers creates CompanionGameplayModifiers
    - CompanionSystem is constructed with active companions and modifiers
  update_loop:
    - CombatSystem calls companions.mitigateDamage during damage resolution
    - CompanionSystem.step updates shield, overlays, and hints
    - player.companionShield mirrors Naya shield state
    - player.rookOverlayActive mirrors Rook overlay state
    - player.companionHint mirrors Auntie hint state
    - living enemies receive rookMarked while overlay is active
  render_loop:
    - UIRenderer displays Naya shield and companion hints
```

## Trust, heat, and balance relationship

The companion system is connected to story choices through saved result flags, while broader heat/favor balancing is handled by `StoryBalanceRules`.

```yaml
story_relationship:
  trust:
    - Lio choices can make companion assists arrive earlier or later
    - colony chorus alignment grants Naya shield support
  heat:
    - heat/favor does not directly mutate CompanionSystem state
    - heat/favor is projected into StageRun through StoryBalanceRules
  runtime_contract:
    - branch choices produce resultFlags
    - resultFlags produce gameplayHook strings
    - gameplayHook strings produce companion modifiers
```

## Current limits

```yaml
not_yet_implemented:
  murr_murrby:
    status: merchant/economy character exists in story vocabulary, but no runtime companion ability yet
    planned_area: merchant routes, discounts, or shop rerolls
  separate_actor_ai:
    status: companions are modifier systems, not physical followers
  trust_meter_ui:
    status: branch trust is saved as story fields/result flags, not shown as a full relationship screen
  companion_selection:
    status: active companions are fixed defaults in CompanionSystem construction
```

## Adding a new companion ability

```yaml
checklist:
  - add a stable gameplayHook in branchConsequences.ts when the ability depends on story choices
  - extend CompanionGameplayModifiers only for branch-driven numeric/boolean modifiers
  - extend CompanionRuntimeState for state that must show in HUD or tests
  - update CompanionSystem.step or mitigateDamage for the actual behavior
  - mirror visible state onto Player or CombatEntity if Renderer/UIRenderer needs it
  - add CompanionSystem tests for pure behavior
  - add StageRunScene or e2e tests when the behavior is reachable from Story mode
  - update this document and runtime-contracts markers
```
