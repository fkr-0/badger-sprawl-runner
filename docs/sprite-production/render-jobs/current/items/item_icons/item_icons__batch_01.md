---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
corpus_version: 2
status: pending_render
scope: current
category: items
source_entry: item_icons
job_id: item_icons__batch_01
animation_state: rocket_backpack_icon,railgun_icon,stim_pack_icon,claws_icon,katana_icon,signal_jammer_icon,phase_pick_icon,dub_shield_icon,echo_cassette_icon,gravity_talisman_icon,nanofur_weave_icon,solder_mite_swarm_icon,black_ice_tooth_icon,bassline_boots_icon,contraband_seed_key_icon
animation_class: ui_icon
runtime_clip: current:item_icons:rocket_backpack_icon,railgun_icon,stim_pack_icon,claws_icon,katana_icon,signal_jammer_icon,phase_pick_icon,dub_shield_icon,echo_cassette_icon,gravity_talisman_icon,nanofur_weave_icon,solder_mite_swarm_icon,black_ice_tooth_icon,bassline_boots_icon,contraband_seed_key_icon
source_class: current_manifest
atlas_family: assets/sprites/item_icons.png
target_atlas: assets/sprites/item_icons.png
output_image: renders/item_icons/batch_01_4c_4r.png
frames: 15
grid:
  columns: 4
  rows: 4
cell_size:
- 32
- 32
output_size:
- 128
- 128
world: null
source_prompt_file: docs/sprite-production/prompts/current/items/item_icons.md
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
---

# `item_icons__batch_01`

This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.

## Render target

- Output image: `renders/item_icons/batch_01_4c_4r.png`
- Grid: 4 columns × 4 rows
- Cell size: 32×32 pixels
- Output size: 128×128 pixels
- Occupied frames: 15
- Review state: `pending_render`

## Production metadata

| Field | Value |
|---|---|
| Scope | `current` |
| Category | `items` |
| Animation state | `rocket_backpack_icon,railgun_icon,stim_pack_icon,claws_icon,katana_icon,signal_jammer_icon,phase_pick_icon,dub_shield_icon,echo_cassette_icon,gravity_talisman_icon,nanofur_weave_icon,solder_mite_swarm_icon,black_ice_tooth_icon,bassline_boots_icon,contraband_seed_key_icon` |
| Animation class | `ui_icon` |
| Runtime intent | `current:item_icons:rocket_backpack_icon,railgun_icon,stim_pack_icon,claws_icon,katana_icon,signal_jammer_icon,phase_pick_icon,dub_shield_icon,echo_cassette_icon,gravity_talisman_icon,nanofur_weave_icon,solder_mite_swarm_icon,black_ice_tooth_icon,bassline_boots_icon,contraband_seed_key_icon` |
| Atlas family | `assets/sprites/item_icons.png` |
| Source class | `current_manifest` |

## Prompt

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: item_icons__batch_01
Grid: 4 columns by 4 rows
Cell size: 32x32 pixels
Output size: 128x128 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

Sheet purpose: clean HUD icons.
Existing visual cue: 15 clean HUD icons on grid.
Cell order:
1. Rocket Backpack
2. Railgun
3. Stim Pack
4. Claws
5. Katana
6. Signal Jammer
7. Phase Pick
8. Dub Shield
9. Echo Cassette
10. Gravity Talisman
11. Nanofur Weave
12. Solder Mite Swarm
13. Black Ice Tooth
14. Bassline Boots
15. Contraband Seed Key
Leave remaining cells fully transparent.

One centered symbol per cell, a two-to-four-pixel dark outline, a compact internal highlight, and no background plate unless it is part of the icon identity. Icons must remain recognizable at native size and must not contain letters, numbers, or readable words.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
```

## Acceptance

Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.
