---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
corpus_version: 2
status: pending_render
scope: expansion
category: ui_expansion
source_entry: hud_core_elements
job_id: hud_core_elements
animation_state: hud_core_elements
animation_class: ui_icon
runtime_clip: expansion:hud_core_elements:hud_core_elements
source_class: expansion_template
atlas_family: hud_core_elements
target_atlas: null
output_image: renders/ui/hud_core_elements_4c_4r.png
frames: 16
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
source_prompt_file: docs/sprite-production/prompts/expansion/ui/hud_core_elements.md
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
---

# `hud_core_elements`

This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.

## Render target

- Output image: `renders/ui/hud_core_elements_4c_4r.png`
- Grid: 4 columns × 4 rows
- Cell size: 32×32 pixels
- Output size: 128×128 pixels
- Occupied frames: 16
- Review state: `pending_render`

## Production metadata

| Field | Value |
|---|---|
| Scope | `expansion` |
| Category | `ui_expansion` |
| Animation state | `hud_core_elements` |
| Animation class | `ui_icon` |
| Runtime intent | `expansion:hud_core_elements:hud_core_elements` |
| Atlas family | `hud_core_elements` |
| Source class | `expansion_template` |

## Prompt

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: hud_core_elements
Grid: 4 columns by 4 rows
Cell size: 32x32 pixels
Output size: 128x128 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

HUD cell order:
1. health claw pip full
2. health claw pip empty
3. rally-health overlay
4. rocket fuel full
5. rocket fuel empty
6. rail reload ring
7. perfect reload marker
8. heat low
9. heat high
10. hack charge
11. trace warning
12. parry ready
13. companion ready
14. story payload
15. shop discount
16. objective marker

Render a coherent compact HUD glyph family using dark outlines, one bright state color, and clear filled/empty distinction. Transparent cells, no letters, numbers, or readable words. The icons must work over both dark and bright gameplay backgrounds.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
```

## Acceptance

Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.
