# Badger Sprawl Runner release train

Badger Sprawl Runner 1.3.0 was released on 2026-07-21 against Arcade Runtime 1.11.0.

| Released | Next patch | Next minor |
|---:|---:|---:|
| 1.3.0 | 1.3.1 | 1.4.0 |

The next patch is restricted to correctness, evidence-index consistency, artifact consistency and browser-isolation fixes. The next minor may add attested physical-device and resumable sustained-session evidence, but renderer defaults remain an explicit game-owned decision.

```sh
pnpm release:plan:check
pnpm verify:release
```
