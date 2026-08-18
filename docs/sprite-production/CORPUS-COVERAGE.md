# Sprite Prompt Corpus Coverage

The corpus combines all current runtime atlas contracts, full-scope content expansions, and a structured pass over remaining animation, gameplay-tile, named boss-action, and VFX gaps.

```yaml
corpus_version: 2
current_entries: 71
expansion_entries: 151
total_render_jobs: 1230
total_prompted_frames: 6308
remaining_gap_jobs: 266
max_grid_columns: 4
max_grid_rows: 4
```

## Coverage by category

| Category | Entries | Render jobs | Prompted frames |
|---|---:|---:|---:|
| `boss_action_gap` | 8 | 24 | 192 |
| `bosses` | 8 | 88 | 568 |
| `character_state_gap` | 20 | 80 | 520 |
| `characters` | 20 | 100 | 480 |
| `enemies` | 16 | 112 | 464 |
| `enemy_expansion` | 61 | 427 | 1769 |
| `enemy_state_gap` | 16 | 64 | 288 |
| `item_expansion` | 1 | 4 | 48 |
| `items` | 4 | 10 | 143 |
| `misc` | 2 | 7 | 34 |
| `player` | 2 | 34 | 160 |
| `player_expansion` | 5 | 34 | 230 |
| `player_gap` | 1 | 18 | 112 |
| `portrait_expansion` | 21 | 21 | 84 |
| `ui` | 1 | 2 | 20 |
| `ui_expansion` | 1 | 1 | 16 |
| `vfx` | 1 | 11 | 59 |
| `vfx_gap` | 1 | 32 | 204 |
| `world_expansion` | 8 | 32 | 512 |
| `world_gameplay_gap` | 8 | 48 | 256 |
| `worlds` | 17 | 81 | 149 |

## Audited remaining-gap completion

- Moss remaining movement, carry, stealth, skill, weapon, item-use, and recovery actions: **18 jobs**.
- Four additional awareness/evasion/recovery states for each current regular enemy: **64 jobs**.
- Four locomotion/reaction/presentation states for each current companion, NPC, merchant, or boss-context character: **80 jobs**.
- Three named mechanical action rows for each current campaign boss: **24 jobs**.
- Six gameplay-specific animated tile or prop states for each campaign world: **48 jobs**.
- Missing player, combat, stealth, enemy, boss, item, hack, companion, and environment effects: **32 jobs**.

Every job is materialized as an individual Markdown file under `render-jobs/`, in addition to its operator-facing bundle under `prompts/`.
