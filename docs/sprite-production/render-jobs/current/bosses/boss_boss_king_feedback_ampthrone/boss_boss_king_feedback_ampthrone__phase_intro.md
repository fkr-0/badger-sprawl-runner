---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
corpus_version: 2
status: pending_render
scope: current
category: bosses
source_entry: boss_boss_king_feedback_ampthrone
job_id: boss_boss_king_feedback_ampthrone__phase_intro
animation_state: phase_intro
animation_class: presentation
runtime_clip: current:boss_boss_king_feedback_ampthrone:phase_intro
source_class: current_manifest
atlas_family: assets/sprites/bosses/boss_king_feedback_ampthrone.png
target_atlas: assets/sprites/bosses/boss_king_feedback_ampthrone.png
output_image: renders/boss_boss_king_feedback_ampthrone/phase_intro_4c_2r.png
frames: 8
grid:
  columns: 4
  rows: 2
cell_size:
- 96
- 96
output_size:
- 384
- 192
world: dub_colony
source_prompt_file: docs/sprite-production/prompts/current/bosses/boss_boss_king_feedback_ampthrone.md
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
---

# `boss_boss_king_feedback_ampthrone__phase_intro`

This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.

## Render target

- Output image: `renders/boss_boss_king_feedback_ampthrone/phase_intro_4c_2r.png`
- Grid: 4 columns × 2 rows
- Cell size: 96×96 pixels
- Output size: 384×192 pixels
- Occupied frames: 8
- Review state: `pending_render`

## Production metadata

| Field | Value |
|---|---|
| Scope | `current` |
| Category | `bosses` |
| Animation state | `phase_intro` |
| Animation class | `presentation` |
| Runtime intent | `current:boss_boss_king_feedback_ampthrone:phase_intro` |
| Atlas family | `assets/sprites/bosses/boss_king_feedback_ampthrone.png` |
| Source class | `current_manifest` |

## Prompt

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: boss_boss_king_feedback_ampthrone__phase_intro
Grid: 4 columns by 2 rows
Cell size: 96x96 pixels
Output size: 384x192 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

Asset identity: King Feedback boss; speaker armor, cable crown, amp throne, anxious eyes.
World palette family: warm amber, red, leaf green, bass purple, cyan electronics, soot-black shadows.
Animation: phase_intro.
Frame count: 8.
Frame order:
1. dormant threat
2. recognition
3. power wakes
4. silhouette expands
5. phase motif appears
6. energy peak
7. challenge pose
8. ready stance

Orthographic side-view 2D platform-game camera, facing right unless the action requires a neutral frontal beat. Keep character identity, costume, palette, scale, camera, lighting, pixel density, and ground anchor identical in every cell. Full body and all important equipment must remain inside each cell. Use true alpha transparency.
Anchor: keep the ground/object reference fixed at x=48, y=88 in every occupied cell.
Animation-specific requirement: make the action readable from silhouette before adding glow, particles, or smears. The most active frame may use a compact effect, but body pose remains primary.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
```

## Acceptance

Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.
