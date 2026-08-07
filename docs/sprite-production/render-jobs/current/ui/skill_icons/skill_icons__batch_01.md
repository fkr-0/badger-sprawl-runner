---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
corpus_version: 2
status: pending_render
scope: current
category: ui
source_entry: skill_icons
job_id: skill_icons__batch_01
animation_state: double_swipe_icon,parry_tooth_icon,claw_rush_icon,undercut_audit_icon,peoples_finisher_icon,rail_mastery_icon,piercing_shot_icon,capacitor_ritual_icon,chain_conductor_icon,public_record_icon,fuel_sipper_icon,vector_kick_icon,badger_afterburn_icon,skyline_reversal_icon,communal_thrust_icon,street_syntax_icon
animation_class: ui_icon
runtime_clip: current:skill_icons:double_swipe_icon,parry_tooth_icon,claw_rush_icon,undercut_audit_icon,peoples_finisher_icon,rail_mastery_icon,piercing_shot_icon,capacitor_ritual_icon,chain_conductor_icon,public_record_icon,fuel_sipper_icon,vector_kick_icon,badger_afterburn_icon,skyline_reversal_icon,communal_thrust_icon,street_syntax_icon
source_class: current_manifest
atlas_family: assets/sprites/skill_icons.png
target_atlas: assets/sprites/skill_icons.png
output_image: renders/skill_icons/batch_01_4c_4r.png
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
source_prompt_file: docs/sprite-production/prompts/current/ui/skill_icons.md
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
---

# `skill_icons__batch_01`

This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.

## Render target

- Output image: `renders/skill_icons/batch_01_4c_4r.png`
- Grid: 4 columns × 4 rows
- Cell size: 32×32 pixels
- Output size: 128×128 pixels
- Occupied frames: 16
- Review state: `pending_render`

## Production metadata

| Field | Value |
|---|---|
| Scope | `current` |
| Category | `ui` |
| Animation state | `double_swipe_icon,parry_tooth_icon,claw_rush_icon,undercut_audit_icon,peoples_finisher_icon,rail_mastery_icon,piercing_shot_icon,capacitor_ritual_icon,chain_conductor_icon,public_record_icon,fuel_sipper_icon,vector_kick_icon,badger_afterburn_icon,skyline_reversal_icon,communal_thrust_icon,street_syntax_icon` |
| Animation class | `ui_icon` |
| Runtime intent | `current:skill_icons:double_swipe_icon,parry_tooth_icon,claw_rush_icon,undercut_audit_icon,peoples_finisher_icon,rail_mastery_icon,piercing_shot_icon,capacitor_ritual_icon,chain_conductor_icon,public_record_icon,fuel_sipper_icon,vector_kick_icon,badger_afterburn_icon,skyline_reversal_icon,communal_thrust_icon,street_syntax_icon` |
| Atlas family | `assets/sprites/skill_icons.png` |
| Source class | `current_manifest` |

## Prompt

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: skill_icons__batch_01
Grid: 4 columns by 4 rows
Cell size: 32x32 pixels
Output size: 128x128 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

Sheet purpose: clean HUD icons.
Existing visual cue: Skill Icons.
Cell order:
1. Double Swipe
2. Parry Tooth
3. Claw Rush
4. Undercut Audit
5. Peoples Finisher
6. Rail Mastery
7. Piercing Shot
8. Capacitor Ritual
9. Chain Conductor
10. Public Record
11. Fuel Sipper
12. Vector Kick
13. Badger Afterburn
14. Skyline Reversal
15. Communal Thrust
16. Street Syntax


One centered symbol per cell, a two-to-four-pixel dark outline, a compact internal highlight, and no background plate unless it is part of the icon identity. Icons must remain recognizable at native size and must not contain letters, numbers, or readable words.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
```

## Acceptance

Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.
