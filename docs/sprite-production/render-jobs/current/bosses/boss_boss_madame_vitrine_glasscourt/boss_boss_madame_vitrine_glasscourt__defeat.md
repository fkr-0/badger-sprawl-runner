---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
corpus_version: 2
status: pending_render
scope: current
category: bosses
source_entry: boss_boss_madame_vitrine_glasscourt
job_id: boss_boss_madame_vitrine_glasscourt__defeat
animation_state: defeat
animation_class: presentation
runtime_clip: current:boss_boss_madame_vitrine_glasscourt:defeat
source_class: current_manifest
atlas_family: assets/sprites/bosses/boss_madame_vitrine_glasscourt.png
target_atlas: assets/sprites/bosses/boss_madame_vitrine_glasscourt.png
output_image: renders/boss_boss_madame_vitrine_glasscourt/defeat_4c_3r.png
frames: 10
grid:
  columns: 4
  rows: 3
cell_size:
- 96
- 96
output_size:
- 384
- 288
world: chrome_arcology
source_prompt_file: docs/sprite-production/prompts/current/bosses/boss_boss_madame_vitrine_glasscourt.md
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
---

# `boss_boss_madame_vitrine_glasscourt__defeat`

This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.

## Render target

- Output image: `renders/boss_boss_madame_vitrine_glasscourt/defeat_4c_3r.png`
- Grid: 4 columns × 3 rows
- Cell size: 96×96 pixels
- Output size: 384×288 pixels
- Occupied frames: 10
- Review state: `pending_render`

## Production metadata

| Field | Value |
|---|---|
| Scope | `current` |
| Category | `bosses` |
| Animation state | `defeat` |
| Animation class | `presentation` |
| Runtime intent | `current:boss_boss_madame_vitrine_glasscourt:defeat` |
| Atlas family | `assets/sprites/bosses/boss_madame_vitrine_glasscourt.png` |
| Source class | `current_manifest` |

## Prompt

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: boss_boss_madame_vitrine_glasscourt__defeat
Grid: 4 columns by 3 rows
Cell size: 96x96 pixels
Output size: 384x288 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

Asset identity: Madame Vitrine boss; glass-armored executive with mirror fan blades and contract ribbons.
World palette family: cold cyan, polished silver, white-blue light, restrained gold, deep navy reflections.
Animation: defeat.
Frame count: 10. Leave the final 2 cell(s) fully transparent.
Frame order:
1. fatal/stagger impact
2. lose balance
3. fall begins
4. body descends
5. ground contact
6. settled defeated pose
7. effect fade
8. still pose
9. still pose
10. final hold

Orthographic side-view 2D platform-game camera, facing right unless the action requires a neutral frontal beat. Keep character identity, costume, palette, scale, camera, lighting, pixel density, and ground anchor identical in every cell. Full body and all important equipment must remain inside each cell. Use true alpha transparency.
Anchor: keep the ground/object reference fixed at x=48, y=88 in every occupied cell.
Animation-specific requirement: make the action readable from silhouette before adding glow, particles, or smears. The most active frame may use a compact effect, but body pose remains primary.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
```

## Acceptance

Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.
