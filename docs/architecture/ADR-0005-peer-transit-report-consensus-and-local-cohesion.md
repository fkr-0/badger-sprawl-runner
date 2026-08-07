# ADR-0005: Peer transit, report consensus, and local cohesion

- Status: accepted for Phase 4, 7, and 8 continuation
- Date: 2026-07-23
- Scope: Mirror Palace, Dub Colony, homecoming projection, enemy report trust, and non-boss retreat

## Context

The persistent adventure runtime could already represent places, schedules, infrastructure,
quests, bounded alarms, and one-hop enemy communication. The next story act exposed four risks:

1. orbital travel could become a separate hub-and-spoke campaign in which the city remained the
   unquestioned center;
2. Mirror Palace testimony could become ordinary collectible evidence, reproducing the spectacle
   the story criticizes;
3. alarm spoofing still entered a last-write-wins cell state, so contradictory sources could not
   coexist as uncertainty;
4. ordinary enemies remained committed until death even after losing coordination, confidence,
   and a reason to continue.

## Decision 1: city and colony connect as peers

The route sequence is:

```text
Vertical Ghost
  -> Sky Mirror
    -> Diaspora Chorus
      -> Commons Loop
        -> Public Forecast
          -> Homebound Static
            -> Commons Line
```

Mirror Palace first exposes the hidden staff local beneath a premium orbital express. Dub Colony
then closes the line into an uneven loop with arrows in both directions and no central
interchange.

The bidirectional return coupler has three governing rules:

- either endpoint may interrupt service;
- either endpoint may revise the destination;
- refusal does not terminate the relationship.

The homecoming is therefore a colony-authored connection, not a city annexation route.

## Decision 2: testimony remains withdrawable

The Table of Refusals models testimony with:

- chosen audience;
- expiry;
- revision history;
- withdrawal;
- protected context.

Only testimony whose speaker selected the city audience may board the homecoming archive car.
Public evidence is not treated as permanently available content merely because it was once
published.

## Decision 3: scheduled occupants may own authored spatial anchors

Social-space validation previously allowed only permanent place residents to have authored NPC
anchors. Homecoming requires characters who normally live elsewhere to converge physically on
Blue Mercy.

A layout NPC anchor is now valid when the NPC is either:

- present in a place variant; or
- assigned to that location by an authored world-beat schedule rule.

This keeps early visits free of future cast while allowing stable, designed positions during
homecoming. Explicit durable relocation still outranks schedule defaults.

## Decision 4: enemy knowledge is a local claim ledger

`EnemyReportLedger` stores expiring reports by communication cell and source. Each report
contains position and confidence.

Compatible positions cluster. Contradictory positions remain separate. The strongest coherent
cluster becomes the provisional working account; alternatives lower its trust. Two contradictory
positions are never averaged into a fictional midpoint.

Consensus projects:

- primary source;
- last-known position;
- confidence;
- trust;
- conflict;
- report count.

Patrol notice transfer is multiplied by consensus trust. Relays carry the uncertainty attached
to a report, not merely its coordinate.

## Decision 5: cohesion is local and material

`EnemyCohesionSystem` derives ordinary patrol cohesion from:

- casualties in the communication cell;
- relay loss;
- contradictory intelligence;
- nearby engaged mutual support;
- an explicit authored stand-down legitimacy offer.

The dispositions are:

```text
committed -> wavering -> retreating
                     \-> standing-down (authored legitimacy required)
```

Retreating actors move away and leave the active combat set. This creates a non-kill resolution
without awarding progress per enemy. Standing down requires an application port used by social,
faction, or quest consequences; low morale alone is insufficient.

Bosses and authored elites are excluded from generic cohesion retreat. Their surrender,
transformation, or refusal remains a designed encounter outcome.

## Consequences

Positive:

- the colony is another home rather than a secondary headquarters;
- the subway remains the material and dramatic spine of the orbital act;
- Mirror Palace becomes the privatized reflection of transit labor;
- testimony can influence infrastructure without becoming permanent spectacle;
- homecoming cast convergence is spatially authored and schedule-safe;
- alarms, witnesses, and relays can disagree without granting omniscience;
- spoofing creates uncertainty instead of replacing truth;
- ordinary enemies can retreat when the local fight has materially collapsed;
- pursuing a retreating worker becomes an explicit player decision;
- boss drama is protected from generic morale arithmetic.

Costs and follow-up:

- the report clustering profile is neutral and still needs district-specific source doctrine;
- geometry-aware vision and sound occlusion remain incomplete;
- civilian witnesses need their own reaction and consent model;
- social actions and faction legitimacy must be connected to `offerStandDown` in authored
  encounters;
- retreat destinations and post-story employment need authored world exits rather than only
  movement away from Moss;
- homecoming art must replace geometric placeholders while preserving the schedule-aware anchors.

## Rejected alternatives

- **Make Dub Colony a new central hub:** repeats the city’s hierarchy under nicer politics.
- **Treat homecoming as a cutscene:** removes the player’s ability to inspect material consequences.
- **Make all testimony permanently public:** converts refusal into collectible content.
- **Let the newest sensor report overwrite the cell:** makes spoofing a magic switch and erases
  source conflict.
- **Average contradictory coordinates:** invents knowledge no actor supplied.
- **Use one faction-wide morale meter:** restores global omniscience through another variable.
- **Make low health trigger surrender:** confuses bodily damage with political legitimacy.
- **Allow generic boss retreat:** undermines authored philosophical and mechanical conclusions.
