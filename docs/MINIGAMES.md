# Minigame Infrastructure

## Goal

Minigames should feel like in-world hacking, not detached quizzes. They must enforce actual input skill: typing, command repair, regex recognition, route planning, or small code assembly.

## Shared interface

```ts
interface MiniGameSpec {
  id: string;
  kind: 'fasttype' | 'command-repair' | 'regex-match' | 'routing' | 'bytecode-order' | 'micro-code';
  prompt: string;
  timeLimitMs: number;
  attempts: number;
  rewardTags: string[];
  failureHeat: number;
}
```

## First campaign integrations

The late campaign now uses three dedicated Canvas2D interfaces while preserving the shared stage-result contract:

- **Antenna Barrens / FastType:** `M` opens an exact-byte repair terminal. Printable keyboard input, Backspace, Enter validation, attempts, timeout reset, and Escape cancellation are handled while field simulation is paused.
- **Orbital Lift / cargo routing:** three manifest columns expose subject, standing/evidence, and destination. Arrow keys move and rewrite the route; number keys directly select options; Enter validates the complete ownership reversal.
- **Asteroid Redoubt / broadcast composition:** three editable clauses produce a live on-air sentence preview. The same navigation grammar is used, but the authored solutions enforce listening, transferable methods, and forkable public tools.

All three still emit the existing `primary-node-completed`, `tutorial-complete`, and `minigame-complete` events. Optional support nodes remain non-blocking, and the payload plus boss gates remain unchanged.

### Late-stage quality and recovery contract

- A first-pass solution receives a **clean** grade.
- A corrected solution receives a **recovered** grade.
- After three failed validations, **public assist** activates instead of blocking campaign progress: the timer pauses, FastType preserves the verified prefix and reveals the next byte, and routing/composition marks only conflicting columns with textual hints.
- Wrong submissions preserve correct work. Cargo and broadcast selections are not reset; FastType retains the longest verified prefix.
- Selection answers are never exposed through the production snapshot before validation. E2E fixtures carry their own authored solutions.
- Console time uses real frame time rather than focus/slow-motion simulation time. World physics, combat, enemies, and camera simulation remain frozen while the modal owns input.
- Selection state never relies on color alone: focus uses `▶`, selected options use an explicit marker, and invalid columns are labelled `REVISE`.

## Minigame types

| Type | Enforced skill | Example |
|---|---|---|
| fasttype | speed + accuracy | type `unlock --gate drain-7 --silent` |
| command-repair | syntax attention | fix `uplink --spoof==cargo` to `uplink --spoof cargo` |
| regex-match | pattern literacy | choose regex matching only drone IDs |
| routing | graph thinking | connect relay nodes under heat budget |
| bytecode-order | sequencing | order opcodes: scan, spoof, unlock, wipe |
| micro-code | real code concept | write a tiny expression like `x => x % 2 === 0` |

## Reward/failure contract

```yaml
success:
  normal: open gate
  clean: open gate + loot room + heat -1
  perfect: open gate + item charge + faction favor
failure:
  soft: gate opens but alarm rises
  hard: enemy wave and alternate route
  assist: after 2 failures offer brute-force cost
accessibility:
  - time limits can scale by difficulty
  - command glossary is available in pause menu
  - minigames never block main campaign on easiest route
```

## Extraction target

The minigame engine should later become:

```text
packages/codegate/
  src/core.ts          state machine, scoring, timers
  src/types.ts         MiniGameSpec and result types
  src/render-dom.ts    optional browser renderer
  src/render-canvas.ts optional canvas renderer
  tests/               deterministic scoring tests
```

It can then be used by this game, peer-collab apps, training tools, or terminal puzzle artifacts.
