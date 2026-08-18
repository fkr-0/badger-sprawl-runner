# Full-Scope Sprite Production Plan

```yaml
approved_style: "operator-approved six-image neon-animal pixel-art board, supplied 2026-07-21"
current_atlas_targets: 71
current_render_jobs: 445
planned_expansion_templates_and_sheets: 151
planned_expansion_render_jobs: 785
render_grid_limit:
  max_columns: 4
  max_rows: 4
source_of_truth:
  runtime_contract: data/sprites.json
  story_identity: docs/story-flavour.yml
  combat_scope: docs/COMBAT_EXPANSION.md
  enemy_scope: docs/ENEMY_BIBLE.md
  campaign_scope: docs/CAMPAIGN.md
```

## Phase 0 — Lock style and assembly contracts

- Keep every existing sheet ID, animation ID, frame size, anchor, and runtime URL stable during visual replacement.
- Render only small jobs from `prompt-index.yml`; never ask an image model for a complete large runtime atlas in one pass.
- Normalize every accepted render to indexed-looking RGBA pixel art: hard alpha, no matte fringe, no resampling, stable cell size.
- Assemble job cells into the runtime row order and validate atlas dimensions before copying into `assets/sprites/`.

**Exit:** the Chapter 1 slice can swap between old and new art without code or manifest changes.

## Phase 1 — Approved-style vertical slice

1. Moss production atlas.
2. Rent Cop Piker, Turnstile Mite, Captain Grin.
3. Auntie Subharmonic and Juno Jar plus dialogue portraits.
4. Lower Sprawl tiles, parallax, backdrop, item pickups/icons, skill icons, combat VFX, core HUD.
5. In-game review at native scale, one-half scale, and gameplay zoom.

**Exit:** consistent outline, palette, anchor, readability, alpha, animation rhythm, and VFX alignment across a complete playable chapter.

## Phase 2 — Existing campaign production pass

Render the remaining current targets world by world:

```text
Drainmarket -> Chrome Arcology -> Straylight Mirage -> Dub Colony
-> Antenna Barrens -> Orbital Lift -> Asteroid Redoubt
```

Within each world: regular enemies, boss, story characters, tiles, parallax, then world-specific items/VFX. Do not render all characters first and environments later; the world bundle must be visually reviewed as one palette family.

**Exit:** all current production targets use the approved style and have review snapshots.

## Phase 3 — Player full move scope

Add the generated player expansion packs:

- crouch, stealth, slide, dodge, wall cling/climb, ledge hang/climb;
- complete claw tree and aerial/wall attacks;
- katana extensions plus machete, mono-saber, hook blade, baton blade;
- shock pistol, scatter coil, nail SMG, harpoon line, signal launcher, perfect rail reload;
- standing and remote hacking, syntax parry, overload, trap reversal, companion signal, nonlethal takedown.

Add manifest contracts only after accepted art and gameplay state machines exist. Prefer one stable atlas family per equipment style rather than inflating the base Moss atlas indefinitely.

**Exit:** every implemented combat/movement verb has a readable authored pose set and event markers.

## Phase 4 — Full enemy ecosystem

Use the concrete planned enemy prompt files under `prompts/expansion/enemies/`. Introduce enemies in mechanic-first batches: walker, jumper, flyer, shield, caster, turret, heavy, assassin, swarm, then sub-boss variants. Each new enemy requires:

```yaml
acceptance:
  - unique silhouette at gameplay scale
  - readable movement and windup
  - visible counter or vulnerability
  - stable anchor and collision footprint
  - hurt, parried/stunned and defeat states
  - hitbox/hurtbox/event metadata
  - palette fit for its world
  - runtime and visual-regression tests
```

**Exit:** each world has at least six regular mechanical roles plus its boss and one stage-specific sub-boss/elite.

## Phase 5 — Stage-capable world art

For every world, render and curate:

- 16 collision/geometry tiles;
- four four-phase hazard families;
- four four-phase interactive/hackable families;
- 16 decor and landmark fragments;
- current parallax plates plus optional foreground silhouette strip;
- stage-specific recolor/lighting variants only after the base material set is stable.

**Exit:** four stages per world can be visually distinct without stretching seven cells across an entire chapter.

## Phase 6 — UI, portraits, VFX and polish

- Four-expression dialogue portrait sheet per story character.
- Core HUD glyph family and state variants.
- Weapon/item pickups and icons for the expanded combat set.
- VFX for each new weapon, hack ownership state, trap state, companion assist, boss phase and accessibility cue.
- Provenance metadata: source prompt, reference board revision, render model, render date, cleanup author, license status.

**Exit:** no runtime mechanic depends on placeholder geometry, unstyled browser text, or a generic effect where a readable state cue is required.

## Phase 7 — Production QA gate

```yaml
required_checks:
  technical:
    - exact PNG dimensions
    - true alpha where required
    - no blank or near-empty occupied cells
    - no grid larger than four cells per side in prompt jobs
    - manifest animation counts preserved
  visual:
    - stable anchors and scale
    - no frame jitter
    - consistent outline thickness and palette
    - action silhouette readable without VFX
    - approved-style comparison board
  gameplay:
    - hitbox and VFX events align with active frames
    - no texture bleeding or smoothing
    - native-scale browser snapshot
    - representative low-contrast and color-blind checks
```

## Queue policy

`prompt-index.yml` is the machine-readable queue. The Markdown files are the operator-facing copy/paste jobs. Mark outputs accepted only after cleanup and in-engine review; raw image-model renders remain sources, not automatic production assets.
