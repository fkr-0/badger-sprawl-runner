# Changelog

All notable changes to Badger Sprawl Runner are documented here.

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
