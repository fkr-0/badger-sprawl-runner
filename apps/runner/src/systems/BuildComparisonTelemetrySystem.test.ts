import { describe, expect, it } from 'vitest';

import {
	BuildComparisonTelemetrySystem,
	compareBuildTelemetry,
	sanitizeBuildTelemetryHistory,
} from './BuildComparisonTelemetrySystem';

describe('BuildComparisonTelemetrySystem', () => {
	it('records observational combat, civic, alarm, and pressure metrics without mutation hooks', () => {
		const telemetry = new BuildComparisonTelemetrySystem('run:a', 'lower-sprawl');
		telemetry.step(12.345);
		telemetry.recordCombat({ kind: 'hit', source: 'player', damage: 3, targetId: 'guard' });
		telemetry.recordCombat({ kind: 'damage', source: 'enemy', damage: 1.5, targetId: 'player' });
		telemetry.recordCombat({ kind: 'kill', source: 'player', targetId: 'guard' });
		telemetry.recordAlarm({ kind: 'alarm-triggered', deviceId: 'eye', x: 10, y: 20 });
		telemetry.recordAlarm({ kind: 'alarm-spoofed', deviceId: 'eye', falseX: 100, falseY: 20 });
		telemetry.recordCivilian({
			kind: 'civilian-stand-down-appeal',
			witnessId: 'witness',
			cellId: 'cell:1',
			legitimacy: 0.8,
		});
		telemetry.recordPressure(
			{
				kind: 'salvage-banked',
				checkpointId: 'checkpoint',
				amount: 5,
				bankedSalvage: 5,
			},
			{
				unbankedSalvage: 2,
				bankedSalvage: 5,
				lostSalvage: 1,
				deaths: 1,
				collectedSourceIds: ['guard'],
			}
		);
		telemetry.setBuild(['signal_jammer', 'claws', 'signal_jammer'], { packet_sense: 2 }, [
			'hacking',
			'social',
		]);

		expect(telemetry.getSnapshot()).toMatchObject({
			runId: 'run:a',
			stageId: 'lower-sprawl',
			durationSeconds: 12.35,
			loadoutItemIds: ['claws', 'signal_jammer'],
			skillRanks: { packet_sense: 2 },
			approaches: ['hacking', 'social'],
			damageDealt: 3,
			damageTaken: 1.5,
			kills: 1,
			alarmsTriggered: 1,
			alarmsSpoofed: 1,
			standDownAppeals: 1,
			salvageBanked: 5,
			salvageLost: 1,
			deaths: 1,
			replayTimeline: expect.arrayContaining([
				expect.objectContaining({ kind: 'combat-hit', atSeconds: 12.35 }),
				expect.objectContaining({ kind: 'alarm-spoofed' }),
				expect.objectContaining({ kind: 'stand-down-appeal' }),
				expect.objectContaining({ kind: 'salvage-banked' }),
				expect.objectContaining({ kind: 'build-locked' }),
			]),
		});
		expect(telemetry.getReplayTimeline().map((event) => event.sequence)).toEqual(
			telemetry.getReplayTimeline().map((_, index) => index)
		);
	});

	it('compares runs with stable review thresholds but does not prescribe balance changes', () => {
		const left = new BuildComparisonTelemetrySystem('run:left', 'drainmarket');
		left.step(80);
		left.recordCombat({ kind: 'damage', source: 'enemy', damage: 5 });
		left.recordAlarm({ kind: 'alarm-triggered', deviceId: 'eye', x: 0, y: 0 });
		const right = new BuildComparisonTelemetrySystem('run:right', 'drainmarket');
		right.step(60);
		right.recordCombat({ kind: 'damage', source: 'enemy', damage: 2 });

		const comparison = compareBuildTelemetry(left.getSnapshot(), right.getSnapshot());
		expect(comparison).toMatchObject({
			leftRunId: 'run:left',
			rightRunId: 'run:right',
			deltas: {
				durationSeconds: -20,
				damageTaken: -3,
				alarmsTriggered: -1,
			},
		});
		expect(comparison.interpretation).toEqual(
			expect.arrayContaining([
				'Right build completed the space materially faster.',
				'Right build reduced incoming damage materially.',
				'Right build produced fewer confirmed alarm reports.',
			])
		);
	});

	it('sanitizes, deduplicates, and bounds persistent observational history', () => {
		const valid = new BuildComparisonTelemetrySystem('run:valid', 'lower-sprawl');
		valid.step(10);
		valid.setBuild(['railgun'], { railgun: 2 }, ['ballistics']);
		const updated = { ...valid.getSnapshot(), durationSeconds: 12 };
		const history = sanitizeBuildTelemetryHistory([
			{ runId: '', stageId: 'lower-sprawl' },
			valid.getSnapshot(),
			updated,
			{ ...updated, runId: 'run:bad-approach', approaches: ['unknown', 'hacking'] },
		], 2);

		expect(history).toHaveLength(2);
		expect(history[0]).toMatchObject({ runId: 'run:valid', durationSeconds: 12 });
		expect(history[1]).toMatchObject({
			runId: 'run:bad-approach',
			approaches: ['hacking'],
		});
		expect(history[0]?.replayTimeline?.at(-1)).toMatchObject({ kind: 'build-locked' });
	});
});
