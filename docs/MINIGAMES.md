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
