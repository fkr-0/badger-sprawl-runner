import { describe, expect, it } from 'vitest';
import type { BuildTelemetrySnapshot } from '../systems/BuildComparisonTelemetrySystem';
import {
	LOWER_SPRAWL_BUILD_DEFINITIONS,
	buildLowerSprawlBuildComparison,
} from './LowerSprawlBuildComparison';

function run(
	runId: string,
	loadoutItemIds: string[],
	approaches: BuildTelemetrySnapshot['approaches'],
	overrides: Partial<BuildTelemetrySnapshot> = {}
): BuildTelemetrySnapshot {
	return {
		runId,
		stageId: 'lower-sprawl',
		durationSeconds: 150,
		loadoutItemIds,
		skillRanks: {},
		approaches,
		damageDealt: 12,
		damageTaken: 3,
		kills: 4,
		alarmsTriggered: 1,
		alarmsSpoofed: 0,
		alarmsDisabled: 0,
		civiliansDocumenting: 0,
		civiliansEvacuated: 0,
		civiliansSheltered: 0,
		standDownAppeals: 0,
		salvageBanked: 5,
		salvageLost: 1,
		deaths: 0,
		...overrides,
	};
}

describe('Lower Sprawl build comparison', () => {
	it('defines three distinct builds around route, pressure, and civic consequence', () => {
		const snapshot = buildLowerSprawlBuildComparison();
		expect(snapshot.cards).toHaveLength(3);
		expect(new Set(snapshot.cards.map((card) => card.id)).size).toBe(3);
		expect(new Set(snapshot.cards.map((card) => card.loadoutItemIds.join('|'))).size).toBe(3);
		for (const card of snapshot.cards) {
			expect(card.preferredPlans).toHaveLength(2);
			expect(card.pressureProfile.length).toBeGreaterThan(30);
			expect(card.civicConsequence.length).toBeGreaterThan(30);
			expect(card.failureMode.length).toBeGreaterThan(30);
			expect(card.evidenceKind).toBe('authored-baseline');
			expect(card.evidenceLines.join(' ')).toContain('BASELINE');
		}
		expect(snapshot.subtitle).toContain('Damage is one row, not the verdict');
		expect(snapshot.observedComparisons).toEqual([]);
	});

	it('labels only matching real telemetry as observed evidence', () => {
		const ghost = run(
			'ghost-run',
			['signal_jammer', 'phase_pick', 'ledger_lens'],
			['hacking', 'ghoststep'],
			{ durationSeconds: 180, alarmsSpoofed: 2, salvageBanked: 4 }
		);
		const claw = run(
			'claw-run',
			['claws', 'nanofur_weave', 'solder_mite_swarm'],
			['claw', 'social'],
			{ durationSeconds: 155, standDownAppeals: 2, damageTaken: 4 }
		);
		const rail = run(
			'rail-run',
			['railgun', 'rail_heat_sink', 'capacitor_coil'],
			['ballistics', 'claw'],
			{ durationSeconds: 118, damageDealt: 24, alarmsTriggered: 3, salvageLost: 3 }
		);
		const irrelevant = run('other-stage', ['railgun'], ['ballistics'], {
			stageId: 'drainmarket',
		});
		const snapshot = buildLowerSprawlBuildComparison([ghost, claw, rail, irrelevant]);

		expect(snapshot.cards.map((card) => card.evidenceKind)).toEqual([
			'observed-run',
			'observed-run',
			'observed-run',
		]);
		expect(snapshot.cards[0]?.evidenceLines.join(' ')).toContain('180.00s');
		expect(snapshot.cards[1]?.evidenceLines.join(' ')).toContain('2 stand-downs');
		expect(snapshot.cards[2]?.evidenceLines.join(' ')).toContain('3 triggered');
		expect(snapshot.observedComparisons).toHaveLength(3);
		expect(snapshot.observedComparisons.every((comparison) => comparison.interpretation.length > 0)).toBe(
			true
		);
	});

	it('keeps signature definitions stable and authored', () => {
		expect(LOWER_SPRAWL_BUILD_DEFINITIONS.map((build) => build.id)).toEqual([
			'ghost-signal',
			'commons-claw',
			'rail-breach',
		]);
		expect(LOWER_SPRAWL_BUILD_DEFINITIONS[2]?.failureMode).toContain(
			'retains damage but loses stun and poise control'
		);
	});
});
