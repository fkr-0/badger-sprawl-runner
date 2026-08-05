# Badger Sprawl Runner release train

Badger Sprawl Runner 1.2.2 is prepared for release on 2026-07-21 against Arcade Runtime 1.10.0.

| Released | Next patch | Next minor |
|---:|---:|---:|
| 1.2.2 | 1.2.3 | 1.3.0 |

The next patch remains restricted to correctness, artifact consistency and browser-isolation fixes. The next minor may incorporate physical-device and sustained-session evidence, but renderer defaults remain an explicit game-owned decision.

```sh
pnpm release:plan:check
pnpm verify:release
```
