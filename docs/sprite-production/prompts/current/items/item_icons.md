---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
sheet_id: item_icons
status: production_target
target_atlas: assets/sprites/item_icons.png
frame_size:
- 32
- 32
atlas_size:
- 128
- 128
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
render_job_count: 1
---

# Item Icons

Production role: `manifest sheet`. Render the jobs below separately, then assemble them into `assets/sprites/item_icons.png` using manifest animation order.

The approved reference board establishes style only. Preserve the Badger Sprawl Runner identity described in each prompt.

## Render job `item_icons__batch_01`

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
