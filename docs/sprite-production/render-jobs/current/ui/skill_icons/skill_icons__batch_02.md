---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
corpus_version: 2
status: pending_render
scope: current
category: ui
source_entry: skill_icons
job_id: skill_icons__batch_02
animation_state: black_ice_bite_icon,ghost_invoice_icon,remote_arc_icon,public_exploit_icon
animation_class: ui_icon
runtime_clip: current:skill_icons:black_ice_bite_icon,ghost_invoice_icon,remote_arc_icon,public_exploit_icon
source_class: current_manifest
atlas_family: assets/sprites/skill_icons.png
target_atlas: assets/sprites/skill_icons.png
output_image: renders/skill_icons/batch_02_4c_1r.png
frames: 4
grid:
  columns: 4
  rows: 1
cell_size:
- 32
- 32
output_size:
- 128
- 32
world: null
source_prompt_file: docs/sprite-production/prompts/current/ui/skill_icons.md
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
---

# `skill_icons__batch_02`

This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.

## Render target

- Output image: `renders/skill_icons/batch_02_4c_1r.png`
- Grid: 4 columns × 1 rows
- Cell size: 32×32 pixels
- Output size: 128×32 pixels
- Occupied frames: 4
- Review state: `pending_render`

## Production metadata

| Field | Value |
|---|---|
| Scope | `current` |
| Category | `ui` |
| Animation state | `black_ice_bite_icon,ghost_invoice_icon,remote_arc_icon,public_exploit_icon` |
| Animation class | `ui_icon` |
| Runtime intent | `current:skill_icons:black_ice_bite_icon,ghost_invoice_icon,remote_arc_icon,public_exploit_icon` |
| Atlas family | `assets/sprites/skill_icons.png` |
| Source class | `current_manifest` |

## Prompt

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: skill_icons__batch_02
Grid: 4 columns by 1 rows
Cell size: 32x32 pixels
Output size: 128x32 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

Sheet purpose: clean HUD icons.
Existing visual cue: Skill Icons.
Cell order:
1. Black Ice Bite
2. Ghost Invoice
3. Remote Arc
4. Public Exploit


One centered symbol per cell, a two-to-four-pixel dark outline, a compact internal highlight, and no background plate unless it is part of the icon identity. Icons must remain recognizable at native size and must not contain letters, numbers, or readable words.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
```

## Acceptance

Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.
