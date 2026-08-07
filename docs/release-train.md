# Badger Sprawl Runner release train

This integration branch combines the released 1.3.0 certification line with the verified rescue feature corpus as an **unpublished 1.4.0 candidate** against Arcade Runtime 1.12.0.

| Candidate | Next patch | Next minor |
|---:|---:|---:|
| 1.4.0 | 1.4.1 | 1.5.0 |

The candidate keeps the 1.3.0 lifecycle and visual-certification evidence contracts while adding the expanded persistent-city, authored-encounter, expedition, progression, accessibility, sprite-production, and runtime-command work from the rescue checkpoint. The next patch is restricted to correctness, evidence-index consistency, artifact consistency, and browser-isolation fixes. The next minor may add attested physical-device and resumable sustained-session evidence; renderer defaults remain an explicit game-owned decision.

No tag, push, publication, or deployment is implied by this candidate branch.

```sh
pnpm release:plan:check
pnpm verify:release
```
