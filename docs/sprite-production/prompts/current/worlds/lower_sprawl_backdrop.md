---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
sheet_id: lower_sprawl_backdrop
status: production_target
target_atlas: assets/sprites/worlds/lower_sprawl_backdrop.png
frame_size:
- 960
- 540
atlas_size:
- 960
- 540
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
render_job_count: 1
---

# Lower Sprawl Backdrop

Production role: `backdrop`. Render the jobs below separately, then assemble them into `assets/sprites/worlds/lower_sprawl_backdrop.png` using manifest animation order.

The approved reference board establishes style only. Preserve the Badger Sprawl Runner identity described in each prompt.

## Render job `lower_sprawl_backdrop__background`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: lower_sprawl_backdrop__background
Grid: 1 columns by 1 rows
Cell size: 960x540 pixels
Output size: 960x540 pixels
Background: opaque scene plate in an RGBA PNG

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

World: rain-slick undercity alleys, debt gates, brick, wet asphalt, food stalls, cable nests, improvised neon and rusty drainage.
Palette: indigo rain shadows, cyan and magenta neon, rust orange, dirty yellow, wet charcoal.
Layer: background; complete cinematic gameplay backdrop with an intentionally readable central play lane.
Existing visual cue: Lower Sprawl Backdrop.

Create a side-scrolling orthographic environment with strong horizontal depth bands and no baked player, enemy, HUD, text, logos, or foreground collision geometry unless this is explicitly the front overlay. Keep the central gameplay lane visually quieter than the top and bottom framing. Pixel clusters must remain crisp at native size; no smooth painting or photographic texture.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
```
