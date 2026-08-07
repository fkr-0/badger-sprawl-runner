---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
corpus_version: 2
status: pending_render
scope: current
category: characters
source_entry: character_dr_mina_suture
job_id: character_dr_mina_suture__exit
animation_state: exit
animation_class: sprite_animation
runtime_clip: current:character_dr_mina_suture:exit
source_class: current_manifest
atlas_family: assets/sprites/characters/dr_mina_suture.png
target_atlas: assets/sprites/characters/dr_mina_suture.png
output_image: renders/character_dr_mina_suture/exit_4c_1r.png
frames: 4
grid:
  columns: 4
  rows: 1
cell_size:
- 48
- 48
output_size:
- 192
- 48
world: drainmarket
source_prompt_file: docs/sprite-production/prompts/current/characters/character_dr_mina_suture.md
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
---

# `character_dr_mina_suture__exit`

This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.

## Render target

- Output image: `renders/character_dr_mina_suture/exit_4c_1r.png`
- Grid: 4 columns × 1 rows
- Cell size: 48×48 pixels
- Output size: 192×48 pixels
- Occupied frames: 4
- Review state: `pending_render`

## Production metadata

| Field | Value |
|---|---|
| Scope | `current` |
| Category | `characters` |
| Animation state | `exit` |
| Animation class | `sprite_animation` |
| Runtime intent | `current:character_dr_mina_suture:exit` |
| Atlas family | `assets/sprites/characters/dr_mina_suture.png` |
| Source class | `current_manifest` |

## Prompt

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: character_dr_mina_suture__exit
Grid: 4 columns by 1 rows
Cell size: 48x48 pixels
Output size: 192x48 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

Asset identity: Dr. Mina Suture: mole medic; headlamp goggles, patched white coat, stim belt.
World palette family: deep teal, clinic green, warning red, violet UV light, rust brown, damp charcoal.
Animation: exit.
Frame count: 4.
Frame order:
1. turn
2. first step
3. move away
4. final trailing pose

Orthographic side-view 2D platform-game camera, facing right unless the action requires a neutral frontal beat. Keep character identity, costume, palette, scale, camera, lighting, pixel density, and ground anchor identical in every cell. Full body and all important equipment must remain inside each cell. Use true alpha transparency.
Anchor: keep the ground/object reference fixed at x=24, y=44 in every occupied cell.
Animation-specific requirement: make the action readable from silhouette before adding glow, particles, or smears. The most active frame may use a compact effect, but body pose remains primary.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
```

## Acceptance

Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.
