# Changelog

All notable changes to Badger Sprawl Runner are documented here.

## [1.6.0] - Planned

- Add attested physical-device evidence, resumable multi-hour retained-renderer certification, and cross-release evidence trend comparison.

## [1.5.3] - Unreleased

## [1.5.2] - 2026-08-19

### Added

- Added a reusable `release:packet:check` validator that verifies compact release packets against the exact recorded Git commit, release-member versions, release train, vendored Runtime compatibility, tagged tree metadata, and dated changelog section.
- Added release-packet contract tests covering the valid `v1.5.1` packet plus fail-closed target, member-version, and semver-train mutations.
- Added tag-triggered release CI for `vMAJOR.MINOR.PATCH` refs, including full-history checkout and strict annotated-tag packet verification against the packet published on `origin/main`.
- Added a compact machine-readable `v1.5.1` release packet recording the exact tag/commit boundary, release-member versions, verification outcomes, artifact hashes, known caveats, and explicit local-only publication state.

### Changed

- Documented detached-target and strict-tag release-packet validation workflows, including the required publication order of the evidence commit before its corresponding tag.
- Advanced the release train to `1.5.2`, with `1.5.3` as the next maintenance patch and `1.6.0` remaining the planned minor.

## [1.5.1] - 2026-08-19

### Added

- Added an experimental hardened Electron desktop shell with `desktop:dev`, unpacked Linux packaging, and AppImage export commands.
- Added a restrictive desktop content-security policy plus custom `arcade://` bundle serving, renderer permission denial, sandbox/context-isolation defaults, and navigation/window guards.
- Added PixiJS's bundled strict-CSP fallback module to the optional Pixi bridge, avoiding any need to permit `'unsafe-eval'`.
- Pinned electron-builder's static AppImage toolset `1.0.3` so the Linux package does not depend on the legacy FUSE2 runtime.

### Changed

- Promoted `data/sprites.json` and its runner-public copy from the legacy `{ schemaVersion, spriteSheets }` alias to the canonical Arcade Runtime `{ version, sheets }` manifest shape.
- Updated sprite generation, audit, release, smoke, and E2E tooling to consume the canonical `sheets` property directly while retaining explicit legacy-alias coverage in the deprecated sprite-contract compatibility facade.
- Completed narrow `@arcade/runtime` subpath imports across the runner and shared packages, synchronized the workspace-local and vendored Runtime surfaces, and added an E2E contract preventing root-import regressions.
- Bumped the workspace and runner package versions to 1.5.1.

### Fixed

- Updated the Chromium sprite visual-review E2E path to use the real same-origin review application instead of dynamically importing a `blob:` runtime module, preserving the hardened production CSP without weakening test coverage.
- Removed the ineffective `frame-ancestors` directive from the meta-delivered CSP, eliminating the production-artifact browser warning while retaining the directives browsers can enforce from a meta policy.

## [1.5.0] - 2026-08-19

### Changed

- Aligned runtime consumption with the official Arcade Runtime 1.12.0 subpath surface across runner, platformer-core, sprite-contracts, progression, tests, and tooling.
- Added a portable workspace-local `@arcade/runtime` package facade over the checksum-verified vendored 1.12.0 bundle because the package is not available from the npm registry; clean installs now resolve official `core`, `pixi`, `sprites`, `gameplay`, `stages`, `storage`, `ui`, `testing`, `tooling`, `assets`, `audio`, and `netcode` subpaths without machine-specific links.
- Moved shared sprite manifest schema ownership, normalization, and validation to `@arcade/runtime/sprites`; runner loading, sprite review, and sprite-usage auditing now normalize through the runtime directly.
- Retained Badger-specific sprite browser loading/cancellation, immutable playback and sampling conveniences, semantic manifest diff/reload planning, inspection, and atlas production/dimension auditing in `@badger/sprite-contracts`.
- Kept combat resource/action adapters and platformer coyote/grace behavior on Arcade Runtime gameplay primitives while moving their imports to the narrow runtime subpaths available in 1.12.0.
- Migrated game-flow and meta-progression persistence to Arcade Runtime versioned stores with runtime checksums/envelopes while automatically promoting existing plain v2 runner saves and legacy v1/meta records without discarding progress.

### Deprecated

- Deprecated the duplicate `SpriteManifest`, `SpriteSheet`, `AnimationDef`, related sprite type aliases, and `normalizeSpriteManifest`/`validateSpriteManifest` compatibility facades in `@badger/sprite-contracts`; new code should use `@arcade/runtime/sprites` directly.

### Testing

- Added direct runtime validation of the complete `data/sprites.json` manifest and frame addressing against all 73 normalized sheets.
- Updated animation contracts to execute the Arcade Runtime animation clock API and verify real frame advancement rather than relying only on source-shape assertions.
- Added persistence migration coverage for versioned runner saves and legacy meta-progression skill/rank recovery.

## [1.4.0] - Release candidate

### Added

- Integrated the first Chronicle Moss animation batch as a dedicated runtime extension atlas containing `air_dodge`, `railgun_reload_failure` and `railgun_charge`.
- Added deterministic Chronicle batch promotion and verification commands plus multi-sheet player-animation resolution for Canvas and Pixi rendering.
- Added the persistent Phase 3 expedition ledger for integrity, injuries, consumables, equipment condition, repair history, modifications and economy telemetry.
- Added atomic civic-service transactions and executable repair, clinic, greenhouse, archive, legal-aid and transit-control overlays in walkable locations.
- Added deterministic curated stage rewards, authored quest-completion XP and an explicit campaign level/skill cadence.
- Added authored encounter topology across all eight story stages with zones, sight and acoustic portals, occluders, civilian evacuation routes, and validated multi-approach plans.
- Added deterministic occluded vision, geometry-aware hearing, environmental sound provenance, physically destructible alarms, and visible civilian evacuation behavior.
- Added checkpoint reset policies, bounded unbanked salvage, idempotent run settlement, accessible expedition-pressure HUD language, and observational build-comparison telemetry.
- Added Marlo Turnstile and Vera Counterweight as recurring post-enforcement workers linking Blue Mercy, Chorus Rail, and the homecoming line.
- Added deterministic authored door and floor-trap sound actors whose portal state is shared by vision and hearing, with persistent spoofing and explicit disable behavior.
- Added district-specific Antenna Barrens, Orbital Lift, and Asteroid Redoubt portal, occluder, evacuation, and acoustic-trap geometry.
- Added Maceo Margin, Rita Latch, and Della Redact as post-enforcement workers with transformed roles, social-space anchors, and world-beat schedules.
- Added fixed-step locomotion golden traces and bounded elite repetition resistance that preserves damage while reducing repeated control.
- Added the persistent Lower Sprawl Build Lab with three authored build identities, route/consequence comparison, and sanitized observed-run evidence.
- Added direct deterministic training launch for every Build Lab card using its real skill ranks, lesson, dummy, and weapon kit.
- Added exact small-instance civic bin packing, authority graph coloring, and finite proof-by-contradiction systems with inspectable objectives and proof traces.
- Added four algorithmic public-works quests and the bounded Kurt Gödel Archive Echo cameo, including an explicit undecidable route state and prohibition on oracle authority.
- Added executable Phase 6–9 acceptance reports and material final-doctrine readiness surfaced through the persistent subway map.
- Added bounded orbital gravity and deterministic traversal-rhythm profiles while preserving city locomotion and zero input delay.
- Added a dedicated Director Vane capstone controller using coalition evidence, chromatic route locks, contradiction closure, witness interruptions, and doctrine integrity.
- Added five persistent-place undercity entrances, checksummed seeded manifests, bounded procedural contracts/vendors/elites, and a separately versioned active-expedition save.
- Added automatic startup reconstruction and resume for active undercity manifests with saved room index and banked/exposed salvage.
- Added a runtime-readable content dashboard covering district services, quests, approaches, schedules, stage art, undercity catalogs, and algorithmic motifs.
- Added warning-free responsibility-based Vite chunks for game runtime, adventure/campaign content, scene shells, renderer, persistence, procedural expeditions, packages, and external runtimes, reducing the production entry from 879.75 kB to about 10 kB.
- Added semantic keyboard/gamepad/pointer/touch command bars for title, transit, walkable locations, services, and compatibility exits through Arcade Runtime 1.12.0.
- Added measured Unicode-safe text fitting and bounded text blocks to title, transit, location, service, and story surfaces.
- Added deterministic priority-aware transient notices for story autosaves while preserving the existing save-feedback contract.
- Added a shared persistent-city E2E navigation helper so story feature tests enter through SubwayMapScene without duplicating menu indexes or world-graph assumptions.

### Changed

- Airborne dodge presentation now selects the authored `air_dodge` clip while grounded dodge presentation remains on the production `skid` animation.
- Story stages now hydrate and commit persistent inventory and equipment, including synchronized stim consumption and condition wear.
- Campaign blueprint-shard rewards now total twelve, supporting one coherent capstone route without flattening the full skill graph.
- The legacy independent `ShopScene` is quarantined and no longer reads or writes save state.
- Title selection now uses stable focus identities from Arcade Runtime rather than a local numeric cursor implementation.
- Story mode browser contracts now recognize the persistent SubwayMapScene as the canonical entry surface and the six-option title menu.
- Migrated the vendored Arcade Runtime to 1.12.0.

### Fixed

- Replaced stale character-count truncation and scene-local wrapping with measured Canvas typography.
- Updated runtime contracts to verify canonical `WorldServiceDirector` economy ownership instead of requiring the quarantined shadow shop.
- Fixed strict tuple inference in build-comparison telemetry sorting.
- Removed implicit Vitest-global and undeclared-DOM dependencies from newly added runner tests.
- Updated autosave and renderer-parity browser evidence for the versioned v2 save key and current dark authored palette while retaining structural readability checks.

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

## [1.2.2] - 2026-07-21

### Added

- Added immutable shared animation playback, absolute-time sampling, seeking, speed control and compiled inspection timelines for loop, one-shot and ping-pong clips.
- Added deterministic sprite-sheet contract identities, ordered manifest diffs and a renderer-neutral reload planner for reusable, changed, forced, missing and evicted atlases.
- Added structured sprite-load progress, bounded retries, attempt accounting and application-level ready, progress, cancellation and error events.

### Changed

- Upgraded the sprite-review page into a live runtime workbench with playback controls, timeline scrubbing, frame stepping, overlays, event history and exact atlas diagnostics while preserving the existing contact-sheet baseline.
- Manifest reloads now reuse unchanged decoded images, rebind them to fresh normalized contracts and decode only added, changed, unavailable or explicitly forced sheets.
- Animation event dispatch and ambient frame selection now use the shared playback and sampling contracts instead of renderer-local frame-clock arithmetic.

### Fixed

- Strict manifest failures now preserve the complete previously committed atlas cache, while stale and superseded loads remain unable to replace newer state.
- Decoded atlas dimensions are validated before commit, deterministic geometry failures are not retried and cancellation detaches pending image handlers safely.
- Browser review, package exports, generated bundles and release documentation now cover the shared inspector and cache-aware loading contracts.
- Release browser verification now allocates and owns an isolated Vite port instead of reusing an unrelated worktree server on the default port.
- Renderer bundle accounting now measures generated production chunks only, preventing Firefox from treating Vite development dependency modules as shipped bundle bytes.

## [1.2.1] - 2026-07-21

### Added

- Added the complete generated production sprite-prompt corpus, deterministic prompt freshness checks and safe atlas-assembly contracts to the source release.
- Added the live sprite-review workbench UI for sheet and animation selection, loop/once/ping-pong playback, speed control, timeline scrubbing, frame stepping, overlays, event logs and atlas diagnostics.

### Changed

- Extended Chromium sprite-review acceptance to verify inspector state, lazy sheet switching, URL persistence, paused timeline control, ping-pong direction and exact atlas geometry.
- Pointed the historical sprite audit and generation notes to the canonical approved-style production suite.

### Fixed

- Restored clean-checkout `pnpm test` and release verification by including the prompt generator, atlas assembler, generated corpus and assembly contract already referenced by the `1.2.0` package scripts.
- Updated the animation normalization contract to validate the transactional injectable manifest loader instead of requiring an obsolete inline `response.json()` expression.
- Published inspector markup now matches the already-shipped inspector controller and runtime implementation without changing gameplay or renderer ownership.

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
