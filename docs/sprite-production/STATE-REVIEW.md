# Sprite Production State Review

Reviewed against `data/sprites.json` and repository assets on 2026-07-21.

## Verified baseline

```yaml
manifest_sheets: 72
production_prompt_targets: 70
small_render_jobs_generated: 441
missing_manifest_files: 0
non_png_or_unreadable_manifest_files: 0
all_manifest_files_rgba: true  # verified by the preceding project audit; prompt generator validates PNG dimensions
archival_or_superseded:
  - comfy_badger_run_grid
  - mirror_palace_parallax
```

| Category | Manifest sheets |
|---|---:|
| bosses | 8 |
| characters | 20 |
| enemies | 16 |
| items | 4 |
| misc | 2 |
| player | 2 |
| ui | 1 |
| vfx | 1 |
| worlds | 18 |

## Provenance mix

| Source tool | Sheets |
|---|---:|
| OpenAI DALL-E | 55 |
| OpenAI image generation | 9 |
| unrecorded | 3 |
| authored motion-master promotion | 1 |
| Chronicle render promotion | 1 |
| ComfyUI API | 1 |
| deterministic Pillow pixel-art generator | 1 |
| generated urban atlas normalization | 1 |


## Findings

1. **Contract coverage is strong.** Every one of the 72 manifest entries has a corresponding PNG and the current atlases use consistent category dimensions. The runtime can therefore load art for the complete implemented campaign.
2. **Production coherence is the main weakness.** The atlas set mixes imported image-model boards, generated fallbacks, promoted authored motion, and sheets without complete provenance. Technical validity currently hides visible variation in outline weight, pixel density, palette discipline, pose clarity, and background cleanup.
3. **The older prompt document is obsolete.** It describes a 13-state Moss sheet and a handful of assets, while the manifest now contains 17 Moss states, 16 enemies, eight bosses, 20 story characters, eight world tile families, layered environments, expanded items, skills, VFX, and a backdrop.
4. **The implemented enemy roster is only a campaign skeleton.** Most worlds expose two regular enemy sheets, while `docs/ENEMY_BIBLE.md` and `docs/COMBAT_EXPANSION.md` specify six to nine mechanically distinct enemy roles per world. This pack adds direct prompts for the missing named roster.
5. **World atlases are runtime-complete but stage-thin.** Seven entries per world are enough to prove rendering, not enough for four visually distinct stages, collision variation, hackable traps, foreground silhouettes, and reusable set dressing. Each world now has four additional full-set render jobs.
6. **Player breadth does not yet match the combat design.** The active Moss atlas covers core movement, claws, katana, railgun, boost, hack, parry, interaction, hit and defeat. It does not yet cover crouch/stealth locomotion, wall and ledge movement, the full claw tree, additional blade families, additional guns, trap reversal, companion signals, or nonlethal takedowns.
7. **Dialogue portraits are absent as a dedicated production family.** Current 48-pixel story sheets are useful in-world, but not sufficient for expressive dialogue presentation. Concrete four-expression portrait prompts are included for every story character found in `story-flavour.yml`.
8. **Enemy and boss combat metadata remains a separate integration gap.** New art must be followed by per-frame hurtboxes, hitboxes, muzzle/VFX events, phase events, and visual-regression review; rendering alone will not complete combat fidelity.

## Immediate recommendation

Use the current render queue to re-author the existing production targets in the approved neon-animal style first, starting with Moss, Chapter 1 enemies, Captain Grin, Chapter 1 characters, Lower Sprawl tiles, combat VFX, items, and HUD. Assemble and review that vertical slice before bulk-rendering the remaining worlds.
