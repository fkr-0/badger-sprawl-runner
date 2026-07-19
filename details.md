## Highest-value next mechanics

### 1. Physics: ledge / corner correction

Purpose:
- make jumps feel less brittle
- prevent tiny corner clips from ruining runs
- deterministic correction amount and direction

Implementation shape:
- `ledgeCorrectionSystem.ts`
- input:
  - body rect
  - intended velocity
  - obstacles
  - max correction pixels
- output:
  - corrected x/y
  - correction event
  - blocked / corrected / unchanged result

Tests:
- horizontal corner correction
- vertical head-bump correction
- no correction beyond threshold
- deterministic obstacle tie-break
### 2. Physics: slope walking / slide surfaces

Purpose:
- improve ground feel
- support sewer ramps, rooftops, cargo ramps, trash slopes
- integrate with material physics

Implementation shape:
- `slopeSurfaceSystem.ts`
- slope segments:
  - id
  - x1/y1
  - x2/y2
  - material id
- resolve:
  - ground height at x
  - slope normal
  - slide force
  - traction modifier

Tests:
- standing on slope samples exact y
- walking uphill/downhill deterministic
- slippery slope causes deterministic slide
- stable slope id tie-break
### 3. Combat: hit-confirm / cancel routing

Purpose:
- make combo trees feel intentional
- let only confirmed hits unlock some cancels
- support whiff recovery vs hit recovery

Implementation shape:
- extend `CombatFrameDataSystem`
- add:
  - `cancelRules`
  - `requiresHitConfirm`
  - `onHitCancelInto`
  - `onBlockCancelInto`
  - `onWhiffCancelInto`

Tests:
- hit confirm unlocks cross/launcher
- whiff denies cancel
- block allows defensive cancel only
- deterministic route order
### 4. Combat: hurtbox / hitbox layers

Purpose:
- separate body collision from attack collision
- support high/low/airborne attacks
- make parry/dodge windows cleaner

Implementation shape:
- `CombatHitboxLayerSystem.ts`
- layers:
  - high
  - mid
  - low
  - air
  - projectile
  - unblockable
- hurtbox profile per entity
- attack hitbox profile per move

Tests:
- low attack misses airborne target
- air attack hits airborne target
- parryable projectile respects layer
- unblockable bypasses guard but not invuln
### 5. Combat: poise / stagger breakpoints

Purpose:
- make heavy enemies and bosses more readable
- separate health damage from control damage

Implementation shape:
- `PoiseStaggerSystem.ts`
- expand existing poise fields
- add:
  - poise meter
  - stagger threshold
  - stagger decay
  - armor class
  - stagger event ledger

Tests:
- repeated light attacks eventually stagger
- heavy attack instantly staggers weak enemy
- boss armor reduces poise damage
- poise decay deterministic over time
### 6. Items: conditional affix triggers

Purpose:
- make affixes more interesting than flat stats
- deterministic build synergies

Examples:
- “+damage while airborne”
- “refund stamina on perfect dodge”
- “burn on third hit”
- “gain shield after parry”

Implementation shape:
- `ConditionalItemEffectSystem.ts`
- input:
  - combat event ledger
  - physics actor state
  - item effects
  - proc rng state
- output:
  - triggered effects
  - updated cooldowns
  - status payloads

Tests:
- airborne-only bonus applies only airborne
- every-third-hit trigger deterministic
- cooldown prevents repeated trigger
- replay hash stable
### 7. Items: socket polarity / overclocking

Purpose:
- deepen socket mechanics
- let players trade risk for power

Implementation shape:
- extend `ItemSocketSystem`
- socket:
  - polarity
  - overclockLevel
  - instability
- chip:
  - polarity
  - heatCost
  - durabilityDrain

Tests:
- matching polarity boosts effect
- mismatch applies penalty
- overclock increases effect and wear
- deterministic instability roll
### 8. Integrated: frame replay diff reports

Purpose:
- make deterministic debugging easier
- when a replay hash differs, show exactly what changed

Implementation shape:
- `ReplayDiffSystem.ts`
- compare stable snapshots:
  - physics actors
  - combatants
  - items
  - projectiles
  - resources
- output sorted diff entries

Tests:
- detects changed hp
- detects changed projectile position
- ignores configured volatile fields
- stable diff ordering
