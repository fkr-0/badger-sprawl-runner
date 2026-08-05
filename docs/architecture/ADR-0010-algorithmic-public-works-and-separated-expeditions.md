# ADR-0010 — Algorithmic public works, executable phase gates, and separated expeditions

- **Status:** Accepted
- **Date:** 2026-07-24
- **Scope:** Adventure Phases 6–9, final doctrine evaluation, optional undercity expeditions

## Context

The remaining adventure roadmap required more than additional stage content. The city, colony, homecoming, finale, and optional endgame needed executable acceptance criteria and reusable systems that could explain their own decisions.

Computer-science motifs were also requested as part of the game’s style. Using them only as dialogue decoration would reproduce the exact failure the story criticizes: technical language lending authority to an unchanged mechanism. The motifs therefore need mechanical ownership, deterministic evidence, and explicit political limits.

At the same time, procedural endgame content must not become a second, less accountable campaign. A generated expedition may alter expedition inventory, wear, salvage, and service pressure, but it may not silently advance authored stages, complete authored quests, relocate canonical NPCs, or choose an ending.

## Decision 1 — Algorithms are public procedures with inspectable objectives

Small civic problems use exact, deterministic algorithms where the state space is bounded enough to remain inspectable.

### Protected bin packing

Lift and expedition manifests optimize in this order:

1. protected passengers and care cargo packed;
2. public priority packed;
3. total useful loads packed;
4. fewer bins used;
5. lower residual slack;
6. stable lexical signature.

Mass, volume, and mutual incompatibility remain hard constraints. The result publishes its objective order, unplaced remainder, capacity use, and whether the result is exact or heuristic.

The political rule is explicit: **unplaced is a public failure state, not a person type**. A solver may expose scarcity; it may not decide that whoever falls outside the optimum has ceased to be a claim on the system.

### Authority graph coloring

Conflicting institutions are represented as an undirected graph. Adjacent powers may not occupy the same emergency-authority shift. A deterministic exact coloring finds the minimum number of shifts for the small authored graphs.

A valid coloring is not sufficient governance. Every color assignment also requires:

- expiry;
- rotation;
- training and succession;
- public conflict edges;
- a challenge path.

Director Vane’s abuse of graph coloring is therefore mathematically valid and politically false: from “this graph has a valid coloring” he infers “the coloring requires an owner.” The game rejects the inference, not the algorithm.

### Proof by contradiction

Forecast and command claims may be tested through finite forward-chaining contradiction proofs. Every derived fact records its implication and reason. The engine distinguishes:

- a closed contradiction;
- an assumption that remains unrefuted by available evidence.

Failure to close is not silently converted into innocence or truth. The affected person who supplies a counterexample retains control over identity, publication, expiry, and remedy.

## Decision 2 — The Gödel cameo is an interruptible archive, not an oracle

The Kurt Gödel Archive Echo is a cited reconstruction with explicit uncertainty. It introduces a self-referential transit ticket and helps the coalition distinguish:

- a system unable to certify every true statement expressible within it;
- an institution hiding information and calling the omission a theorem.

The echo cannot choose doctrine, certify safety, or become a permanent constitutional authority. Its own quest requires publication of:

- source material;
- reconstruction uncertainty;
- interruption and appeal paths;
- a prohibition on oracle status.

The resulting public procedure includes an **undecidable** route state. Such a state sends the claim to witness, maintenance, and appeal rather than treating “not provable here” as “false everywhere.”

## Decision 3 — Phase completion is evaluated from world evidence

Phases 6–9 expose deterministic acceptance reports.

Each criterion contains:

- stable ID;
- human-readable claim;
- Boolean result;
- concrete evidence;
- first blocking criterion.

The reports use authored stage completion, transformed district state, unlocked routes, service capacities, visited locations, and world flags. They do not infer completion from scene availability or documentation checkboxes.

The world map presents the active phase and met/total count. This turns the roadmap into player-visible and E2E-visible world state.

## Decision 4 — Final doctrines require material grounding

The selected final doctrine is evaluated against accumulated infrastructure.

Examples:

- **Publish tools** needs distributed physical toolkits, repair and signal capacity, and consent-aware archives.
- **Chorus control** needs commons governance, rotating conflict-colored authority, and independent transit interruption.
- **Abolish Skylock** needs pre-harm appeals, machine-legible refusal channels, and a refuted completeness claim.

A dialogue flag records intent. It does not prove the world can sustain that intent. An under-supported doctrine produces explicit warnings and loses broadcast integrity during Director Vane’s ownership-collapse phase.

## Decision 5 — Orbital traversal varies through independent environment profiles

City locomotion remains the golden baseline. Orbital districts apply bounded environment multipliers for:

- gravity;
- air control;
- maximum fall speed;
- landing noise.

These multipliers compose with item and skill effects rather than replacing them. Baseline city traces remain unchanged.

Traversal rhythm is derived only from deterministic simulation time. Rhythm controls route windows and moving-world opportunities; it never delays input sampling. Every snapshot reports `inputDelayMs: 0`.

## Decision 6 — Director Vane owns one dedicated, inspectable capstone controller

The final confrontation has four systemic phases:

1. **Competence proof:** accumulated coalition evidence erodes the claim that benchmarked operation implies ownership.
2. **Chromatic lock:** exact graph coloring controls visible route windows.
3. **Counterclaim:** a public proof by contradiction closes Skylock’s claim to complete representation.
4. **Ownership collapse:** witnesses interrupt the command channel while a materially unsupported doctrine loses broadcast integrity.

The controller emits typed events and a snapshot available through the runtime harness. It does not read player intent, alter difficulty adaptively, or fabricate coalition evidence.

## Decision 7 — Optional undercity state is stored separately

The canonical world save and active procedural expedition save use different storage keys and schemas.

The undercity manifest contains:

- normalized seed;
- persistent entrance ID;
- stage family;
- depth;
- contract;
- procedural vendor;
- procedural elite;
- pack and room counts;
- maximum affix count;
- reward scale;
- checksum.

Bounds:

- depth: 1–20;
- enemy packs: at most 5;
- side rooms: at most 3;
- affixes per pack: at most 2;
- reward scale: at most 2.25.

Optional completion may commit expedition inventory, wear, integrity, injury, and banked salvage. It may not call authored stage completion, authored quest bridges, district transformation, or final doctrine progression.

On startup, a valid active save rebuilds the exact checksummed manifest and restores its room index plus banked and exposed salvage. Invalid, tampered, completed, or abandoned active saves do not replace the title scene. Mid-room inventory wear and collected-source identity remain future schema work rather than being inferred from canonical state.

Procedural vendors and elites use distinct IDs and identities. They may echo established systems but may not impersonate authored companions, NPCs, or bosses.

## Decision 8 — Content validation is a runtime-readable artifact

The adventure dashboard projects:

- cross-catalog validation errors;
- district, location, place, NPC, quest, and schedule counts;
- service coverage;
- quest approach counts;
- stage-art coverage;
- undercity entrances, contracts, vendors, and elites;
- algorithmic motifs;
- orphan procedural entrances.

It is exposed through `window.__badger.getContentDashboard()` when runtime tools are enabled, alongside traversal-rhythm and Director Vane snapshots.

## Decision 9 — Production chunks follow runtime ownership

The production bundle groups the intentionally cyclic campaign/adventure/system/StageRun execution core together rather than forcing false architectural independence. Separately cacheable responsibilities remain separate:

- authored adventure content;
- campaign definitions;
- scene shells;
- renderer adapters;
- persistence;
- procedural expeditions;
- workspace packages;
- Pixi, Arcade Runtime, Vite helper, and remaining vendor modules.

The resulting production entry is approximately 10 kB rather than 880 kB. The largest first-party execution chunk remains below the configured 600 kB warning threshold, and Rollup emits neither circular-chunk nor size warnings.

## Consequences

### Positive

- Computer-science motifs are playable and testable rather than ornamental.
- Phase readiness and ending support are reproducible from persistent state.
- Orbital movement changes without invalidating the city locomotion corpus.
- Procedural content deepens maintenance and builds without replacing authored world truth.
- Release automation can inspect content and capstone state without scraping rendered text.
- Initial entry parsing is small while stable world/content/runtime responsibilities remain independently cacheable.

### Costs

- Small exact solvers require authored problem sizes to remain bounded.
- More world flags now carry explicit institutional consequences and require continued validation.
- Active expedition resumption needs its own future migration policy.
- Chunk ownership is explicit, but localization and deeper route-level lazy loading remain future release work.

## Rejected alternatives

### Use algorithms only as dialogue flavor

Rejected because the player could not inspect objectives, constraints, counterexamples, or consequences.

### Let procedural expeditions use normal story completion

Rejected because generated content could transform districts, complete authored quests, and advance the ending.

### Treat the Gödel reconstruction as a super-intelligent adviser

Rejected because it would contradict both the mathematical theme and the story’s opposition to permanent epistemic authority.

### Make rhythm affect input latency

Rejected because control responsiveness is a baseline accessibility and action-game contract.

### Infer release readiness from documentation checkboxes

Rejected because roadmap prose is not executable world evidence.
