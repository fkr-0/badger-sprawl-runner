# Extraction into Semi/Fully Own Project

## Current state

`badger-sprawl-runner` lives as an artifacts subproject, but is structured so the runtime and systems can be split later.

## Candidate packages

```text
badger-sprawl-runner/
├── apps/runner-demo/          # current browser game
├── packages/platformer-core/  # physics, collision, actors, items
├── packages/codegate/         # minigame engine
├── packages/sprite-contracts/ # sprite schemas and validation
└── packages/progression/      # boons, shops, run aggregation
```

## Library API sketch

```js
import { createPlatformerWorld } from '@badger/platformer-core';
import { createCodeGate } from '@badger/codegate';

const world = createPlatformerWorld({ physicsPreset: 'clean-arcade' });
const gate = createCodeGate(spec, { difficulty: 'normal' });
```

## Similarity to peernetjs-style libs

- Keep browser-first, dependency-light modules.
- Make data contracts explicit JSON.
- Allow host applications to provide their own renderer.
- Provide adapters instead of hard-coding UI.
- Ship smoke tests for each package.

## Split triggers

- More than 3 minigame types implemented.
- More than 2 games/artifacts want code gates.
- Sprite manifest validation grows beyond one file.
- Need replay/network sync of platformer inputs.
