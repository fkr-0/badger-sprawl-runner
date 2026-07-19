# Changelog

All notable changes to Badger Sprawl Runner are documented here.

## Unreleased

### Added

- Reviewed `matching.txt` against the archived DALL-E board directory and imported five world-material boards into the Lower Sprawl, Drainmarket, Chrome Arcology, Dub Colony, and Orbital Lift tile atlases.
- Added a stage-art registry and sprite-tiled terrain rendering with deterministic animated set dressing across all eight runtime worlds.
- Added a failing runtime sprite-usage contract plus browser and production-artifact checks proving mapped terrain PNGs are actually drawn.
- Added BSR-owned sprite review PNG generation and a strict production-Moss golden screenshot backed by the shared arcade contact-sheet renderer.

### Changed

- Orbital Lift now uses the previously unreachable Contract Servitor sheet instead of repeating the Manifest Monk.
- Only the raw Comfy run grid and the superseded generated Mirror Palace parallax remain explicitly archival; all 69 runtime sheets are production-referenced.
- Split the default production entry from the optional Pixi renderer: the Canvas route now ships a roughly 361 kB entry while the Pixi bridge is loaded only for `?renderer=bridge`.

## [1.1.0] - 2026-07-19

### Added

- Complete Mirror Palace and Dub Colony story routes with dedicated geometry, objectives, branches, enemies, bosses, checkpoints, payloads, and persistence.
- Full Moss motion-atlas integration across traversal, interaction, ranged, melee, rocket, parry, victory, and defeat states.
- Stage-specific objective controllers and enemy systems for Reflection Judge, King Feedback, mirror sentinels, banquet ushers, feedback guards, and signal jammers.
- Shared arcade-runtime adapter and opt-in Pixi bridge with performance comparison and deterministic Canvas fallback.
- Promoted HUD item-icon rendering, stage asset generation, release asset validation, and vertical-slice browser coverage.

### Changed

- Story mode now advances through five complete playable chapters rather than stopping after Chrome Arcology.
- The production HUD uses the sprite contract for inventory, weapon, equipment, and item-slot icons.
- Campaign summaries, stage routing, branch recaps, debriefs, and save migration include Mirror Palace and Dub Colony state.
- Generated production assets and the vendored shared runtime are included in release verification.

### Fixed

- Story branches can launch their committed stage without falling back to the previous route.
- HUD sprite contract validation now accepts formatted multiline renderer calls while still requiring the correct icon sheet.
- Checkpoint, objective, and progression state remain deterministic across reload and chapter transitions.

## [1.0.0] - 2026-07-17

- Initial production vertical slice with Lower Sprawl, Drainmarket, Chrome Arcology, modular gameplay packages, progression, sprite contracts, and release verification.
