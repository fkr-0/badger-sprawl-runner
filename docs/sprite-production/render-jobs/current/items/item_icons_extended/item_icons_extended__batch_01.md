---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
corpus_version: 2
status: pending_render
scope: current
category: items
source_entry: item_icons_extended
job_id: item_icons_extended__batch_01
animation_state: capacitor_coil_icon,phase_mantle_icon,ledger_lens_icon,echo_spurs_icon,rail_heat_sink_icon,rootkit_badge_icon,shock_fern_icon,mirror_thread_icon
animation_class: ui_icon
runtime_clip: current:item_icons_extended:capacitor_coil_icon,phase_mantle_icon,ledger_lens_icon,echo_spurs_icon,rail_heat_sink_icon,rootkit_badge_icon,shock_fern_icon,mirror_thread_icon
source_class: current_manifest
atlas_family: assets/sprites/item_icons_extended.png
target_atlas: assets/sprites/item_icons_extended.png
output_image: renders/item_icons_extended/batch_01_4c_2r.png
frames: 8
grid:
  columns: 4
  rows: 2
cell_size:
- 32
- 32
output_size:
- 128
- 64
world: null
source_prompt_file: docs/sprite-production/prompts/current/items/item_icons_extended.md
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
---

# `item_icons_extended__batch_01`

This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.

## Render target

- Output image: `renders/item_icons_extended/batch_01_4c_2r.png`
- Grid: 4 columns × 2 rows
- Cell size: 32×32 pixels
- Output size: 128×64 pixels
- Occupied frames: 8
- Review state: `pending_render`

## Production metadata

| Field | Value |
|---|---|
| Scope | `current` |
| Category | `items` |
| Animation state | `capacitor_coil_icon,phase_mantle_icon,ledger_lens_icon,echo_spurs_icon,rail_heat_sink_icon,rootkit_badge_icon,shock_fern_icon,mirror_thread_icon` |
| Animation class | `ui_icon` |
| Runtime intent | `current:item_icons_extended:capacitor_coil_icon,phase_mantle_icon,ledger_lens_icon,echo_spurs_icon,rail_heat_sink_icon,rootkit_badge_icon,shock_fern_icon,mirror_thread_icon` |
| Atlas family | `assets/sprites/item_icons_extended.png` |
| Source class | `current_manifest` |

## Prompt

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: item_icons_extended__batch_01
Grid: 4 columns by 2 rows
Cell size: 32x32 pixels
Output size: 128x64 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

Sheet purpose: clean HUD icons.
Existing visual cue: Cyberpunk HUD asset pack grid.
Cell order:
1. Capacitor Coil
2. Phase Mantle
3. Ledger Lens
4. Echo Spurs
5. Rail Heat Sink
6. Rootkit Badge
7. Shock Fern
8. Mirror Thread


One centered symbol per cell, a two-to-four-pixel dark outline, a compact internal highlight, and no background plate unless it is part of the icon identity. Icons must remain recognizable at native size and must not contain letters, numbers, or readable words.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
```

## Acceptance

Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.
