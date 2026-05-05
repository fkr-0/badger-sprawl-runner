# Badger Sprawl Runner

A clean, classic side-scrolling jump-and-run prototype about a cyber-badger moving left-to-right through neon undercities, orbital resorts, dub colonies, and a rebel asteroid. The feel target is simple, readable, arcade-fast platforming with responsive physics, sprite-driven animation, modular items, and run-to-run progression.

This project is deliberately original. It uses cyberpunk-sprawl vocabulary and orbital-heist themes as genre inspiration, but keeps names, factions, locations, characters, and plotlines owned by this project.

## Playable prototype

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8042
# then open http://localhost:8042
```

## Controls

| Action | Key |
|---|---|
| Move | A / D or Arrow Left / Arrow Right |
| Jump | W, Space, or Arrow Up |
| Fast fall | S or Arrow Down |
| Melee | J |
| Shoot | K |
| Use active item | E |
| Select item | 1, 2, 3 |
| Open/close code gate minigame | M |
| In code gate | type the shown command, Enter to submit |
| Restart prototype | R |

## Contents

```text
badger-sprawl-runner/
├── index.html
├── bridge.yml
├── package.json
├── README.md
├── DESIGN.md
├── STORY.md
├── SPRITES.md
├── MINIGAMES.md
├── ROADMAP.md
├── data/
│   ├── game-manifest.json
│   ├── items.json
│   ├── progression.json
│   └── sprites.json
├── docs/
│   └── own-project-extraction.md
├── src/
│   ├── game.css
│   └── main.js
└── tests/
    └── validate-data.mjs
```

## Design pillars

- **Clean fun physics:** coyote time, input buffering, variable jump height, air control, fast fall, forgiving ledge feel.
- **Sprites first:** all environment, actor, item, attack, VFX, and UI assets are listed in `data/sprites.json` and described in `SPRITES.md`.
- **Combat without clutter:** railgun timing, claw/katana melee windows, enemy stun, risk-reward reload cadence.
- **Item usage:** rocket backpack, railgun, stim packs, phase picks, signal jammers, dub shield, gravity talisman.
- **Run aggregation:** shops, meta-boni, blueprint unlocks, faction favors, and dead-cell-like timing/risk mechanics.
- **Coding minigames:** gates and heists can enforce fast typing, command repair, regex matching, routing puzzles, bytecode ordering, or small live-coding tasks.
- **Extraction-ready:** minigames and progression are data-driven enough to become a semi-independent library later.

## Quick smoke test

```sh
npm test
```

The test validates JSON structure and cross-references. The prototype itself has no build step.

## Expanded design docs

- `STORY.md` — five-act Brechtian drama, cast, heist payloads, dialogue promise.
- `CAMPAIGN.md` — expanded worlds, stages, sub-bosses, endbosses, placards, level descriptions.
- `ENEMY_BIBLE.md` — enemy classes, world rosters, counters, hack/trap interactions.
