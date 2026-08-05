---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
corpus_version: 2
status: pending_render
scope: expansion
category: character_state_gap
source_entry: character_murr_murrby_state_extension
job_id: character_murr_murrby_state_extension__celebrate_or_resolve
animation_state: celebrate_or_resolve
animation_class: presentation
runtime_clip: future:character_resolve
source_class: remaining_gap_catalog
atlas_family: assets/sprites/characters/expansion/character_murr_murrby_state_extension.png
target_atlas: assets/sprites/characters/expansion/character_murr_murrby_state_extension.png
output_image: renders/character_murr_murrby_state_extension/celebrate_or_resolve_4c_2r.png
frames: 6
grid:
  columns: 4
  rows: 2
cell_size:
- 48
- 48
output_size:
- 192
- 96
world: orbital_lift
source_prompt_file: docs/sprite-production/prompts/expansion/gaps/characters/character_murr_murrby_state_extension.md
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
---

# `character_murr_murrby_state_extension__celebrate_or_resolve`

This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.

## Render target

- Output image: `renders/character_murr_murrby_state_extension/celebrate_or_resolve_4c_2r.png`
- Grid: 4 columns × 2 rows
- Cell size: 48×48 pixels
- Output size: 192×96 pixels
- Occupied frames: 6
- Review state: `pending_render`

## Production metadata

| Field | Value |
|---|---|
| Scope | `expansion` |
| Category | `character_state_gap` |
| Animation state | `celebrate_or_resolve` |
| Animation class | `presentation` |
| Runtime intent | `future:character_resolve` |
| Atlas family | `assets/sprites/characters/expansion/character_murr_murrby_state_extension.png` |
| Source class | `remaining_gap_catalog` |

## Prompt

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: character_murr_murrby_state_extension__celebrate_or_resolve
Grid: 4 columns by 2 rows
Cell size: 48x48 pixels
Output size: 192x96 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

Asset identity: Murr Murrby: black void-cat merchant; vacuum vest, folding crate shop, charming smile.
World palette family: white-gold machinery, scanner blue, black space, hazard orange, cargo red and steel grey.
Animation: celebrate_or_resolve.
Frame count: 6. Leave the final 2 cell(s) fully transparent.
Frame order:
1. key pose
2. anticipation
3. active change
4. peak
5. follow-through
6. recover

Orthographic side-view 2D platform-game camera, facing right unless the action requires a neutral frontal beat. Keep character identity, costume, palette, scale, camera, lighting, pixel density, and ground anchor identical in every cell. Full body and all important equipment must remain inside each cell. Use true alpha transparency.
Anchor: keep the ground/object reference fixed at x=24, y=44 in every occupied cell.
Animation-specific requirement: make the action readable from silhouette before adding glow, particles, or smears. The most active frame may use a compact effect, but body pose remains primary.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Specific missing-state design: recognition, character-specific positive gesture, strongest held pose, secondary flourish, settle, reusable idle bridge.
Runtime intent: future:character_resolve.
This is a future atlas-family render target, not permission to rename or overwrite an existing runtime clip.
```

## Acceptance

Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.
