# ADR-0007 — Expedition Ledger and Atomic Civic Services

- Status: Accepted
- Date: 2026-07-23
- Scope: Phase 3 persistent inventory, equipment, care, production, rewards, progression, and service UI

## Context

The persistent adventure world and the action-stage runtime originally owned overlapping but incompatible fragments of player state:

- `AdventureSaveV2` stored inventory and equipped item IDs;
- `StageRunScene` created a new `InventorySystem`, equipped claws, counted stims on the player actor, and collected temporary pickups;
- item condition, injuries, repair history, and civic-service capacity did not exist durably;
- `ShopScene` maintained an independent shop engine and persisted `MetaState` directly;
- place services other than the field shop and loadout locker returned descriptive intents rather than transactions;
- purchases debited currency before a separate world mutation, with manual rollback;
- stage rewards named payloads but did not use the curated item-drop pipeline;
- XP pacing depended mostly on stage completion while authored quest depth had no advancement value.

This produced multiple potential sources of truth and made useful Phase 3 rules impossible to state precisely. A stim could exist in persistent inventory while the combat actor held a different count. A repair UI could spend currency without a durable item condition to repair. A clinic could either be cosmetic or create a second health economy.

## Decision 1: One durable expedition ledger

`AdventureSaveV2` owns:

- inventory stacks;
- equipped item IDs;
- per-item condition, maximum condition, modification, and repair count;
- current integrity, maximum integrity, injuries, completed-run count, and last stage;
- economy counters and a bounded journal;
- per-location, per-service strain.

The action stage receives an `ExpeditionLaunchState`, a bounded projection containing only the state needed by the expedition. It returns an `ExpeditionCommit` at stage completion.

The commit does not contain scene objects, enemies, pickups, animation state, world routes, NPC state, or arbitrary callbacks. `ExpeditionDirector` is the application boundary that validates and commits it.

### Consequences

- stage reload and world reload use the same inventory and health truth;
- broken items cannot be equipped at launch;
- item modifications compose with existing item and skill effects;
- equipped non-starter gear receives bounded wear after a run;
- injuries survive a successful expedition and can require civic recovery;
- the starter claws remain functional and do not create mandatory repair debt.

## Decision 2: Runtime consumables are synchronized, not duplicated

Combat continues using `player.stims` because it is a hot action-loop field. Persistent inventory continues using the `stim_pack` stack.

The stage hydrates `player.stims` from the persistent stack at launch. Immediately before completion it synchronizes the runtime count back into the inventory before adding authored rewards and creating the commit.

This is an explicit projection/synchronization boundary, not two independent truths.

## Decision 3: Civic services execute atomic world transactions

`WorldDirector.executeTransaction` evaluates commands against a candidate state. If any command is rejected, no event is committed. On success, all events are applied in order.

Services use this boundary for:

- purchases;
- repairs;
- modifications;
- clinic treatment;
- greenhouse harvest;
- archive and legal work;
- transit governance actions.

Currency debit remains in `GameFlow`, but paid service methods refund the full amount if the world transaction fails. Supplies and durable state never partially mutate.

### Example clinic transaction

```text
remove one stim supply
+ adjust local clinic strain by one
+ restore bounded integrity and remove one injury
+ append an economy journal entry
= commit all, or commit none
```

## Decision 4: Scarcity is visible service strain, not hidden debt

Clinic and greenhouse actions do not create a new currency.

- clinic recovery consumes existing medical supplies;
- greenhouse harvest creates visible production strain;
- service overlays display supplies and strain before treatment or harvest;
- a completed expedition recovers one strain mark at every strained service;
- high strain temporarily limits service, but does not permanently lock the player out.

This preserves scarcity and infrastructure politics without turning care into a predatory loan system.

## Decision 5: Repairs and modifications are persistent item history

Repairs restore condition and increment repair count. Modifications attach one catalogued modification ID to the item. The current modification remains inspectable and travels with the item.

Modification effects are resolved separately from base item definitions and merged at expedition loadout projection. This avoids mutating catalog definitions or serializing derived combat effects.

The first repair of an item and each unique modification provide one-time repair mastery. Repeating wear and repair cannot become an unlimited XP loop.

## Decision 6: Authored stage rewards use the existing drop engine

`CuratedRewardCatalog` supplies deterministic stage-specific `DropTable` definitions to `ItemDropSystem.rollDropTable`.

Rewards are rolled from stage ID, run seed, and semantic resolution tags. The resulting items enter the runtime inventory before the expedition commit, and a reward journal entry records their provenance.

Generic enemy kills do not receive mandatory persistent rewards. Curated story outcomes remain the primary source of durable gear.

## Decision 7: Quest structure contributes progression

Quest completion XP is derived from:

- quest kind;
- authored step count;
- whether the quest contains a consequential branch.

It is not derived from objective farming or kill count. The reward ID is `quest:<quest-id>` and is therefore idempotent.

The campaign cadence now derives:

- critical-path stage XP;
- main-quest XP;
- optional quest XP;
- one-time service mastery XP;
- campaign blueprint shards;
- full skill-tree cost;
- minimum capstone closure cost.

The eight campaign chapters grant twelve blueprint shards. This supports one coherent capstone closure plus secondary investment without flattening all four disciplines. Remaining full-tree progression belongs to systemic endgame content.

## Decision 8: The old ShopScene is quarantined

`ShopScene` no longer imports `ShopEngine`, reads save state, writes save state, or performs transactions. It is a compatibility tombstone that directs the player back to a field-shop service in a walkable place.

All shop stock, trust, pressure, inventory, currency, and persistence now pass through `WorldServiceDirector`.

## Validation rules

Phase 3 is accepted only while the following remain true:

1. A failed multi-command transaction leaves world state byte-for-byte unchanged.
2. An expedition launch contains only owned, serviceable equipment.
3. A completed stage returns inventory, equipment, condition, modification, integrity, injuries, and consumable use.
4. A consumed stim cannot reappear after stage completion unless a reward or pickup added another.
5. Clinic treatment consumes supplies and records strain without spending credchips.
6. Strain can block repeated use and recover through completed expeditions.
7. Story rewards are deterministic for the same stage seed.
8. Quest and service rewards are idempotent.
9. The campaign shard budget reaches at least one capstone closure but remains far below full-tree cost.
10. No active code path uses the legacy shop persistence engine.

## Follow-up

Phase 5 may build expedition pressure on this ledger through authored preparation choices, condition-sensitive alternate behavior, field repair, and retreat costs. It must not move world ownership back into `StageRunScene`.
