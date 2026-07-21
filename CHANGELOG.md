# Changelog

All notable changes to Badger Sprawl Runner are documented here.

## [1.4.0] - Planned

- Add attested physical-device evidence and resumable multi-hour retained-renderer certification.

## [1.3.1] - Unreleased

- No changes yet.

## [1.3.0] - 2026-07-21

### Added

- Machine-readable lifecycle and visual certification evidence with browser, GPU, CPU, memory, device-pixel-ratio, power-mode and thermal-state metadata.
- Automatic evidence output for Chromium and Firefox lifecycle runs and Chromium Canvas/native visual-parity runs.
- Actual `WEBGL_lose_context` loss and restoration where available, with a separately recorded synthetic fallback.
- Long-session evidence fields for frame progression, heap observations, upload p95 and context-loss counters.

### Changed

- Migrated the vendored Arcade Runtime to 1.11.0 and its public certification-evidence contract.
- Browser certification now contributes to a validated cross-game evidence index instead of remaining terminal-only output.
- Retained-renderer default eligibility remains blocked until physical tiers, two-hour sessions and real driver-reset evidence are attached.

### Fixed

- Certification records preserve the exact context-loss mode, preventing synthetic events from being mistaken for extension or driver recovery.
- Aggregate browser certification uses isolated ports so stale worktree servers cannot provide false evidence.

## [1.2.0] - 2026-07-21

### Added

- Cached browser resource accounting instead of scanning timing entries on every rendered frame.
- Retained native Pixi terrain ownership with culled platform nodes, authored surface/body tile frames and deterministic decorations.
- Chromium and Firefox lifecycle certification for resize, pause/resume, synthetic context loss/restoration, sustained memory sampling, zero-upload enforcement and teardown.
- Semantic plus image-statistics Canvas/native visual-parity certification and isolated-port browser runners.
- Release-train and cross-repository Runtime provenance checks.

### Changed

- Removed the final full-frame Canvas-to-texture terrain upload; all StageRun world, actor, projectile, VFX and vitals presentation is retained native Pixi.
- Migrated to Arcade Runtime 1.10.0 and removed consumer-local API-level-1 version aliases.
- Reduced the native bridge to approximately 19 kB minified / 7 kB gzip after retained terrain ownership.

### Fixed

- Release CI now installs and executes Firefox instead of provisioning Chromium only.
- Release verification checks both browser engines, package versions, generated-artifact cleanliness and vendored Runtime consistency.

## [1.1.4] - 2026-07-21

### Added

- Added retained native Pixi ownership for authored stage backdrops and three-layer parallax strips, using Arcade Runtime sprite-frame addressing without per-frame texture uploads.
- Added bounded native player/enemy actor ownership, native railgun-beam presentation, and low/balanced/high hardware-budget telemetry for frame time, allocation, uploads, transferred bundles, and heap use.
- Added warmup-separated production-bundle benchmarking so one-time texture and display-object construction cannot pollute the 90-frame steady-state budget.

### Changed

- Reduced the active StageRun bridge to one full-frame Canvas texture pass: terrain. Backdrop, parallax, actors, projectiles, VFX, and runner vitals are now runtime-owned Pixi paths.
- Synchronized the vendored Arcade Runtime 1.9.0 build containing hardware-budget and Canvas-upload telemetry contracts.
- Kept Canvas as the default pending device certification. Repeated frozen Chromium runs passed both budgets but varied from `7.1 ms` Canvas / `12.4 ms` bridge p95 to `16.9 ms` Canvas / `14.4 ms` bridge p95 over 90 post-warmup samples, showing that the previous large bridge penalty is gone but one-machine timing is not a default-switch criterion.

### Fixed

- Browser performance acceptance no longer reuses another worktree's Vite server or resets samples through hot-module reloads during measurement.
- Bridge mode no longer redraws native backdrop, parallax, player, enemies, railgun, or combat-particle presentation through the authoritative Canvas overlay.
- Hardware acceptance can no longer silently pass when bridge telemetry reports a failed budget.

## [1.1.3] - 2026-07-21

### Added

- Added native Pixi combat-VFX ownership backed by Arcade Runtime's bounded `createPixiFramePool()` primitive, with active/capacity/drop telemetry on the bridge canvas.
- Added Arcade Runtime performance-budget monitoring for Canvas and bridge stage rendering, including minimum-sample, mean, p95, and maximum-frame guardrails.
- Added an isolated Playwright base-URL override so concurrent worktrees cannot silently reuse and test another checkout's Vite server.

### Changed

- Marked the VFX pass as native and ready in the executable Arcade Runtime render plan while retaining the existing shared VFX simulation and recycling pool.
- Kept Canvas as the production default after an isolated Chromium run measured `20.8 ms` Canvas p95 versus `80.4 ms` bridge p95 over 90 samples.

### Fixed

- Bridge mode no longer redraws combat particles through the Canvas overlay after synchronizing them to the runtime-owned Pixi effects layer.
- Renderer acceptance tests now verify native-VFX activation, zero frame-pool overflow, and the correct mode-specific performance budget.

## [1.1.2] - 2026-07-21

### Added

- Added runtime-backed campaign progress projection, inspection, and deterministic stage advancement through the vendored Arcade Runtime stage graph.
- Added inspectable horde encounter progress to `WaveDirector` lifecycle snapshots.
- Added a native Pixi HUD path for health, rocket fuel, checkpoint, and combo presentation when the opt-in bridge renderer is active.

### Changed

- Story-mode continuation, debrief transitions, completion summaries, and terminal campaign completion now use the shared Arcade Runtime stage/encounter contracts instead of parallel index arithmetic.
- Synchronized the vendored runtime to checksum-verified Arcade Runtime 1.9.0, including native Pixi scene/HUD ownership and the stage-composition API.
- Kept Canvas as the default renderer after browser profiling showed the bridge path still has materially higher p95 frame cost; `?renderer=bridge` remains available for integration testing.

### Fixed

- Preserved Canvas item and gear-icon rendering when bridge mode replaces only the vitals panel with the native Pixi HUD.
- Relaxed the source-shape runtime contract to accept additional `UIRenderer` options while still requiring the production `SpriteRenderer` argument.

## [1.1.1] - 2026-07-21

### Added

- Reviewed `matching.txt` against the archived DALL-E board directory and imported five world-material boards into the Lower Sprawl, Drainmarket, Chrome Arcology, Dub Colony, and Orbital Lift tile atlases.
- Added a stage-art registry and sprite-tiled terrain rendering with deterministic animated set dressing across all eight runtime worlds.
- Added a failing runtime sprite-usage contract plus browser and production-artifact checks proving mapped terrain PNGs are actually drawn.
- Added BSR-owned sprite review PNG generation and a strict production-Moss golden screenshot backed by the shared arcade contact-sheet renderer.
- Bound every horde-mode enemy archetype to an existing production enemy sheet, including flying and turret-specific silhouettes.

### Changed

- Orbital Lift now uses the previously unreachable Contract Servitor sheet instead of repeating the Manifest Monk.
- Only the raw Comfy run grid and the superseded generated Mirror Palace parallax remain explicitly archival; all 69 runtime sheets are production-referenced.
- Split the default production entry from the optional Pixi renderer: the Canvas route now ships a roughly 361 kB entry while the Pixi bridge is loaded only for `?renderer=bridge`.
- Horde enemy sprites now select patrol, windup, attack, recovery, hurt, stun, and death animations from live combat and AI state.

### Fixed

- Wave-spawned enemies no longer fall back to geometric placeholders when their production sprite sheets are available.

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
