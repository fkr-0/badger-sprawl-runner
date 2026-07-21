# @badger/sprite-contracts

Shared sprite-manifest, frame-addressing, production-geometry, and browser-loading helpers for Badger Sprawl Runner. Runtime-neutral contract logic delegates to the vendored Arcade Runtime; DOM image loading remains in the Badger adapter.

## Playback APIs

```ts
import {
  advanceSpriteAnimation,
  createSpriteAnimationPlayback,
  pauseSpriteAnimation,
  playSpriteAnimation,
  resumeSpriteAnimation,
} from '@badger/sprite-contracts';

let playback = createSpriteAnimationPlayback(sheet, 'idle');
const step = advanceSpriteAnimation(playback, sheet, deltaSeconds);
playback = step.state;

for (const event of step.events) {
  dispatchAnimationEvent(event);
}
```

Playback state is immutable and renderer-neutral. A step reports every crossed frame, ordered manifest events, completion edges, normalized progress, and the resolved source rectangle/anchor. Loop, one-shot, and ping-pong clocks all use the same Arcade Runtime semantics, while pause, resume, speed scaling, and explicit restart remain consumer-controlled.

For ambient or renderer-owned animation that follows an absolute scene clock, use `sampleSpriteAnimation` or `sampleSpriteAnimationFrame`. The stateless sampler applies the same loop/once/ping-pong and ordered-frame rules without allocating an entity playback state.

`seekSpriteAnimation`, `seekSpriteAnimationProgress`, and `setSpriteAnimationSpeed` support editor and debug-tool workflows without implicitly resuming playback. `createSpriteAnimationTimeline`, `inspectSpriteAnimation`, and `inspectSpriteSheet` compile frame slots, direction, events, atlas addresses, duration, occupancy, and optional decoded-image geometry into immutable inspection reports.

## Browser loading

`loadSpriteSheet` validates the decoded image dimensions against the manifest-derived atlas geometry before exposing a drawable sheet. It also accepts an `AbortSignal` for lifecycle-safe cancellation. Diagnostic tooling may explicitly set `validateDimensions: false`, but runtime loading keeps exact validation enabled by default.

`bindLoadedSpriteSheet` rebinds an already-decoded image to a fresh normalized sheet contract. This lets renderers reuse image memory while replacing frame-addressing closures atomically.

## Contract identity and manifest diffs

`createSpriteSheetContractKey` and `createSpriteManifestContractKey` produce canonical, key-order-independent JSON contract identities. `diffSpriteManifests` reports ordered additions, removals, semantic changes, and unchanged sheets. `createSpriteManifestReloadPlan` combines that diff with currently available decoded ids, forced refreshes, and the reuse policy to return deterministic reusable, reload, and eviction sets before any I/O begins. Source metadata is part of the identity, so asset pipelines should advance a `source.revision` or another source field whenever bytes at an unchanged file path are replaced. Consumers can also force a refresh when external cache metadata is unavailable.

## Production APIs

```ts
import {
  auditSpriteAtlasDimensions,
  auditSpriteManifestDimensions,
  createSpriteAtlasAssemblyPlan,
  deriveSpriteAtlasLayout,
} from '@badger/sprite-contracts';
```

- `deriveSpriteAtlasLayout(sheet)` resolves exact frame, row, column, capacity, and pixel dimensions for explicit-grid and row-per-animation sheets.
- `createSpriteAtlasAssemblyPlan(sheet)` maps every animation frame to a deduplicated destination cell using the shared Arcade Runtime addressing contract.
- `auditSpriteAtlasDimensions(sheet, actual)` reports alignment, undersize, and unexpected-extra-space diagnostics.
- `auditSpriteManifestDimensions(manifest, resolver)` audits an entire manifest while leaving filesystem, browser, and image-decoding ownership to the caller.

These functions are pure and renderer-independent, so Canvas, Pixi, build tooling, and asset-pipeline code can share one atlas contract.

## Repository production pipeline

```sh
pnpm sprites:prompts:check
pnpm sprites:assemble:check
pnpm sprites:assemble -- moss_badger_production
```

The assembler writes to `generated/sprite-atlases/` by default. Production assets require the explicit `--write-target --overwrite` safety gate.
