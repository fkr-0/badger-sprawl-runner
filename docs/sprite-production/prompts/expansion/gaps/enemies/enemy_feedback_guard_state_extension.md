---
generated: true
generated_by: scripts/generate-sprite-render-prompts.py
status: planned_full_scope
source_catalog: docs/sprite-production/remaining-gaps.yml
category: enemy_state_gap
world: dub_colony
target_atlas: assets/sprites/enemies/expansion/enemy_feedback_guard_state_extension.png
reference_images:
- assets/sprites/moss_badger_production.png
- generated/sprite-visual-review/badger-sprite-contact-sheet.png
render_job_count: 4
---

# Enemy Feedback Guard: State Extension

These jobs close a specifically audited animation or tile gap. Render each job independently; do not merge the whole bundle into one image request.

## Render job `enemy_feedback_guard_state_extension__alert`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: enemy_feedback_guard_state_extension__alert
Grid: 4 columns by 1 rows
Cell size: 48x48 pixels
Output size: 192x48 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

Asset identity: colony feedback guard; speaker shield, emergency badge, conflicted posture.
World palette family: warm amber, red, leaf green, bass purple, cyan electronics, soot-black shadows.
Animation: alert.
Frame count: 4.
Frame order:
1. key pose
2. anticipation
3. active change
4. peak

Orthographic side-view 2D platform-game camera, facing right unless the action requires a neutral frontal beat. Keep character identity, costume, palette, scale, camera, lighting, pixel density, and ground anchor identical in every cell. Full body and all important equipment must remain inside each cell. Use true alpha transparency.
Anchor: keep the ground/object reference fixed at x=24, y=44 in every occupied cell.
Animation-specific requirement: make the action readable from silhouette before adding glow, particles, or smears. The most active frame may use a compact effect, but body pose remains primary.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Specific missing-state design: neutral patrol, perception snap, strongest readable alert pose, pursuit-ready recovery.
Runtime intent: future:enemy_alert.
This is a future atlas-family render target, not permission to rename or overwrite an existing runtime clip.
```
## Render job `enemy_feedback_guard_state_extension__turn_or_reorient`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: enemy_feedback_guard_state_extension__turn_or_reorient
Grid: 4 columns by 1 rows
Cell size: 48x48 pixels
Output size: 192x48 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

Asset identity: colony feedback guard; speaker shield, emergency badge, conflicted posture.
World palette family: warm amber, red, leaf green, bass purple, cyan electronics, soot-black shadows.
Animation: turn_or_reorient.
Frame count: 4.
Frame order:
1. key pose
2. anticipation
3. active change
4. peak

Orthographic side-view 2D platform-game camera, facing right unless the action requires a neutral frontal beat. Keep character identity, costume, palette, scale, camera, lighting, pixel density, and ground anchor identical in every cell. Full body and all important equipment must remain inside each cell. Use true alpha transparency.
Anchor: keep the ground/object reference fixed at x=24, y=44 in every occupied cell.
Animation-specific requirement: make the action readable from silhouette before adding glow, particles, or smears. The most active frame may use a compact effect, but body pose remains primary.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Specific missing-state design: load near support, narrow turning silhouette, plant toward opposite direction, stable patrol recovery.
Runtime intent: future:enemy_turn.
This is a future atlas-family render target, not permission to rename or overwrite an existing runtime clip.
```
## Render job `enemy_feedback_guard_state_extension__evade_or_reposition`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: enemy_feedback_guard_state_extension__evade_or_reposition
Grid: 4 columns by 2 rows
Cell size: 48x48 pixels
Output size: 192x96 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

Asset identity: colony feedback guard; speaker shield, emergency badge, conflicted posture.
World palette family: warm amber, red, leaf green, bass purple, cyan electronics, soot-black shadows.
Animation: evade_or_reposition.
Frame count: 6. Leave the final 2 cell(s) fully transparent.
Frame order:
1. key pose
2. anticipation
3. active change
4. peak
5. follow-through
6. recover

Orthographic side-view 2D platform-game camera, facing right unless the action requires a neutral frontal beat. Keep character identity, costume, palette, scale, camera, lighting, pixel density, and ground anchor identical in every cell. Full body and all important equipment must remain inside each cell. Use true alpha transparency.
Anchor: keep the ground/object reference fixed at x=24, y=44 in every occupied cell.
Animation-specific requirement: make the action readable from silhouette before adding glow, particles, or smears. The most active frame may use a compact effect, but body pose remains primary.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Specific missing-state design: threat read, evasive load, fastest reposition pose, passing phase, brake, attack-ready recovery.
Runtime intent: future:enemy_evade.
This is a future atlas-family render target, not permission to rename or overwrite an existing runtime clip.
```
## Render job `enemy_feedback_guard_state_extension__recover`

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: enemy_feedback_guard_state_extension__recover
Grid: 4 columns by 1 rows
Cell size: 48x48 pixels
Output size: 192x48 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

Asset identity: colony feedback guard; speaker shield, emergency badge, conflicted posture.
World palette family: warm amber, red, leaf green, bass purple, cyan electronics, soot-black shadows.
Animation: recover.
Frame count: 4.
Frame order:
1. key pose
2. anticipation
3. active change
4. peak

Orthographic side-view 2D platform-game camera, facing right unless the action requires a neutral frontal beat. Keep character identity, costume, palette, scale, camera, lighting, pixel density, and ground anchor identical in every cell. Full body and all important equipment must remain inside each cell. Use true alpha transparency.
Anchor: keep the ground/object reference fixed at x=24, y=44 in every occupied cell.
Animation-specific requirement: make the action readable from silhouette before adding glow, particles, or smears. The most active frame may use a compact effect, but body pose remains primary.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
Specific missing-state design: attack follow-through, vulnerable recoil, regain balance, return to patrol guard.
Runtime intent: future:enemy_recover.
This is a future atlas-family render target, not permission to rename or overwrite an existing runtime clip.
```
