# Badger Sprawl Runner v1.0 Release TODO

Status key: `[ ]` not started, `[~]` in progress, `[x]` complete, `[!]` blocked or intentionally deferred.

## Release-critical gates

- [x] Establish isolated release branch/worktree so pre-existing work is protected.
- [x] Verify clean baseline test suite before release work.
- [x] Verify TypeScript typechecking passes.
- [x] Verify production build passes.
- [x] Verify runner smoke test passes.
- [x] Make `pnpm run lint` pass with zero Biome errors.
- [x] Replace deprecated Biome config keys so lint output is clean enough for release automation.
- [x] Add a runtime contract test to lock v1-visible app surface: Vite runner entrypoint, generated bundle, controls, and release docs.
- [x] Run final release verification: `pnpm run test`, `pnpm run typecheck`, `pnpm run build`, `pnpm run smoke:runner`, `pnpm run lint`.

## v1 product readiness

- [x] Promote package/app versions from `0.1.0` to `1.0.0` consistently.
- [x] Update README so it describes the current pnpm/Vite workspace, not only the old static prototype.
- [x] Document the exact v1 play/build/test/release commands.
- [x] Document the v1 content scope: playable runner app, static legacy prototype, reusable packages, data validation, and smoke tests.
- [x] Add a concise release checklist for future patch/minor/major releases.

## Implementation quality

- [ ] Keep existing package APIs stable unless a release gate proves a change is necessary.
- [ ] Avoid test-only production APIs.
- [ ] Prefer fixing lint configuration/source style over suppressing errors globally.
- [ ] Commit release work in small, reviewable increments.

## Known deferred/non-blocking after v1.0

- [ ] Replace generated placeholder art/audio with final production assets.
- [ ] Add browser-driven end-to-end gameplay tests.
- [ ] Add CI workflow publishing hosted build artifacts.
- [ ] Decide whether reusable packages should publish to npm or remain workspace-internal.
