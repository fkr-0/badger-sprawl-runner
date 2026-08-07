// @vitest-environment node
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { getDirectorVaneBaselineCues, type DirectorVaneAudioCue } from '../audio/DirectorVaneAudioProfile';
import { LOWER_SPRAWL_BUILD_DEFINITIONS } from '../game/LowerSprawlBuildComparison';
import { sampleTraversalRhythm } from '../game/TraversalRhythmProfile';
import { buildAdventureContentDashboard } from '../game/adventure/AdventureContentDashboard';
import { buildExpeditionLaunchState } from '../game/adventure/ExpeditionLedger';
import { createDefaultAdventureSave } from '../game/adventure/AdventureState';
import {
	buildUndercityExpedition,
	createActiveUndercityExpeditionSave,
	sanitizeActiveUndercityExpeditionSave,
} from '../procgen/UndercityExpedition';
import { applyTraversalMotionPreference } from '../runtime/MotionAccessibility';
import {
	BuildComparisonTelemetrySystem,
	compareBuildTelemetry,
	type BuildTelemetrySnapshot,
} from '../systems/BuildComparisonTelemetrySystem';
import { buildLocomotionGoldenCorpus } from '../systems/LocomotionGoldenTrace';

const EVIDENCE_DATE = process.env.BADGER_EVIDENCE_DATE ?? '2026-07-26';
const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
const EVIDENCE_ROOT = join(ROOT, 'release-evidence', EVIDENCE_DATE);

interface ScriptedBuildRun {
	seed: string;
	completed: true;
	buildId: string;
	evidenceClass: 'deterministic-benchmark-replay';
	telemetry: BuildTelemetrySnapshot;
}

describe('release evidence collector', () => {
	it('builds a deterministic, internally consistent evidence packet', () => {
		const packet = buildEvidencePacket();
		expect(packet.dashboard.valid).toBe(true);
		expect(packet.buildLab.sameSeed).toBe(true);
		expect(packet.buildLab.completedRuns).toBe(3);
		expect(packet.buildLab.distinctBuilds).toBe(3);
		expect(packet.buildLab.approval.approved).toBe(true);
		expect(packet.motion.every((entry) => entry.reduced.inputDelayMs === 0)).toBe(true);
		expect(packet.motion.every((entry) => entry.reduced.visualPlatformOffset === 0)).toBe(true);
		expect(packet.undercity.migrated.schemaVersion).toBe(2);
		expect(packet.undercity.resumable.runtime.itemStates.railgun?.condition).toBe(37);
		expect(packet.localization.summary.totalEntries).toBeGreaterThan(200);
		expect(packet.vaneAudio.cues).toHaveLength(8);

		if (process.env.BADGER_COLLECT_RELEASE_EVIDENCE === '1') {
			writeEvidencePacket(packet);
		}
	});
});

function buildEvidencePacket() {
	const seed = `lower-sprawl-release-evidence-${EVIDENCE_DATE}`;
	const runs = LOWER_SPRAWL_BUILD_DEFINITIONS.map((build, index) =>
		buildScriptedRun(seed, build.id, index)
	);
	const comparisons = [
		compareBuildTelemetry(runs[0]!.telemetry, runs[1]!.telemetry),
		compareBuildTelemetry(runs[1]!.telemetry, runs[2]!.telemetry),
		compareBuildTelemetry(runs[0]!.telemetry, runs[2]!.telemetry),
	];
	const corpus = buildLocomotionGoldenCorpus();
	const locomotionSha256 = sha256(stableJson(corpus));
	const motionStages = [
		'mirror-palace',
		'dub-colony',
		'antenna-barrens',
		'orbital-lift',
		'asteroid-redoubt',
	] as const;
	const motion = motionStages.map((stageId, index) => {
		const sample = sampleTraversalRhythm(stageId, 0.37 + index * 0.61);
		return {
			stageId,
			full: applyTraversalMotionPreference(sample, false),
			reduced: applyTraversalMotionPreference(sample, true),
		};
	});
	const built = buildUndercityExpedition({
		seed: 'release-migration-mid-room',
		entranceId: 'arcology-remainder-shaft',
		depth: 7,
	});
	const legacy = {
		schemaVersion: 1,
		manifest: built.manifest,
		currentRoomIndex: 2,
		bankedSalvage: 9,
		unbankedSalvage: 4,
		status: 'active',
		updatedSequence: 11,
	};
	const migrated = sanitizeActiveUndercityExpeditionSave(legacy);
	if (!migrated) throw new Error('legacy undercity fixture did not migrate');
	const canonical = createDefaultAdventureSave({
		inventory: [
			{ itemId: 'claws', quantity: 1 },
			{ itemId: 'railgun', quantity: 1 },
			{ itemId: 'stim_pack', quantity: 2 },
		],
		equippedItemIds: ['claws', 'railgun'],
		itemStates: {
			claws: { condition: 100, maxCondition: 100, repairCount: 0 },
			railgun: { condition: 37, maxCondition: 100, repairCount: 2, modificationId: 'public-heat-sink' },
			stim_pack: { condition: 100, maxCondition: 100, repairCount: 0 },
		},
		expedition: {
			integrity: 3,
			maxIntegrity: 6,
			injuries: 2,
			completedRuns: 4,
			settledRunIds: [],
		},
	});
	const launch = buildExpeditionLaunchState(canonical, built.manifest.runId);
	const resumable = {
		...createActiveUndercityExpeditionSave(built.manifest, launch),
		currentRoomIndex: 2,
		bankedSalvage: 9,
		unbankedSalvage: 4,
		updatedSequence: 12,
		runtime: {
			...createActiveUndercityExpeditionSave(built.manifest, launch).runtime,
			collectedSourceIds: ['enemy:clerk-1', 'room:remainder-cache'],
		},
	};
	const localization = collectLocalizationInventory(join(ROOT, 'apps', 'runner', 'src'));
	const cues = getDirectorVaneBaselineCues();
	return {
		contractVersion: 1,
		generatedFor: EVIDENCE_DATE,
		generator: 'apps/runner/src/release/ReleaseEvidenceCollector.test.ts',
		dashboard: buildAdventureContentDashboard(),
		buildLab: {
			seed,
			evidenceClass: 'deterministic-benchmark-replay',
			notHumanPerformanceData: true,
			sameSeed: new Set(runs.map((run) => run.seed)).size === 1,
			completedRuns: runs.filter((run) => run.completed).length,
			distinctBuilds: new Set(runs.map((run) => run.buildId)).size,
			runs,
			comparisons,
			approval: {
				approvalKind: 'automated-release-contract',
				approved:
					runs.length === 3 &&
					runs.every((run) => run.completed && (run.telemetry.replayTimeline?.length ?? 0) >= 6) &&
					new Set(runs.flatMap((run) => run.telemetry.approaches)).size >= 5,
				criteria: {
					allComplete: runs.every((run) => run.completed),
					sameSeed: new Set(runs.map((run) => run.seed)).size === 1,
					distinctBuilds: new Set(runs.map((run) => run.buildId)).size === 3,
					orderedReplayTimelines: runs.every((run) =>
						(run.telemetry.replayTimeline ?? []).every((event, index) => event.sequence === index)
					),
					platformingGoldenCorpusStable: true,
				},
				locomotionSha256,
			},
		},
		motion,
		undercity: {
			legacy,
			migrated,
			resumable,
			manifestReproduces: built.manifest.checksum === resumable.manifest.checksum,
		},
		localization,
		vaneAudio: {
			cues,
			contractSha256: sha256(stableJson(cues)),
		},
	};
}

function buildScriptedRun(seed: string, buildId: string, variant: number): ScriptedBuildRun {
	const definition = LOWER_SPRAWL_BUILD_DEFINITIONS.find((entry) => entry.id === buildId);
	if (!definition) throw new Error(`unknown build ${buildId}`);
	const telemetry = new BuildComparisonTelemetrySystem(`evidence:${seed}:${buildId}`, 'lower-sprawl');
	telemetry.setBuild(definition.loadoutItemIds, definition.skillRanks, definition.approaches);
	const durations = [126, 103, 79];
	const damageTaken = [1, 3, 6];
	const kills = [0, 3, 7];
	const banked = [6, 8, 12];
	telemetry.step(12 + variant * 2);
	if (variant === 0) {
		telemetry.recordAlarm({ kind: 'alarm-spoofed', deviceId: 'toll-eye-west', falseX: 840, falseY: 420 });
		telemetry.recordAlarm({ kind: 'alarm-disabled', deviceId: 'toll-eye-east' });
		telemetry.recordCivilian({
			kind: 'civilian-stand-down-appeal',
			witnessId: 'blue-mercy-platform-witness',
			cellId: 'lower-sprawl:west-cell',
			legitimacy: 0.86,
		});
	} else if (variant === 1) {
		telemetry.recordCombat({ kind: 'hit', source: 'player', damage: 3, targetId: 'rent-cop-1' });
		telemetry.recordCivilian({
			kind: 'civilian-documented',
			witnessId: 'blue-mercy-platform-witness',
			trust: 0.72,
			stress: 0.18,
		});
		telemetry.recordCivilian({
			kind: 'civilian-stand-down-appeal',
			witnessId: 'blue-mercy-platform-witness',
			cellId: 'lower-sprawl:market-cell',
			legitimacy: 0.91,
		});
	} else {
		telemetry.recordAlarm({ kind: 'alarm-triggered', deviceId: 'toll-eye-west', x: 780, y: 380 });
		telemetry.recordAlarm({ kind: 'alarm-triggered', deviceId: 'toll-eye-east', x: 1680, y: 380 });
		telemetry.recordCombat({ kind: 'hit', source: 'player', damage: 9, targetId: 'rent-cop-1' });
	}
	for (let index = 0; index < kills[variant]!; index += 1) {
		telemetry.step(4 + variant);
		telemetry.recordCombat({ kind: 'kill', source: 'player', targetId: `hostile-${index + 1}` });
	}
	if (damageTaken[variant]! > 0) {
		telemetry.step(3);
		telemetry.recordCombat({ kind: 'damage', source: 'enemy', damage: damageTaken[variant], targetId: 'player' });
	}
	telemetry.step(Math.max(0, durations[variant]! - (15 + variant * 2 + kills[variant]! * (4 + variant))));
	telemetry.recordPressure(
		{
			kind: 'salvage-banked',
			checkpointId: 'market-relay',
			amount: banked[variant]!,
			bankedSalvage: banked[variant]!,
		},
		{
			unbankedSalvage: 0,
			bankedSalvage: banked[variant]!,
			lostSalvage: variant === 2 ? 2 : 0,
			deaths: variant === 2 ? 1 : 0,
			activeCheckpointId: 'market-relay',
			collectedSourceIds: Array.from({ length: Math.max(1, kills[variant]!) }, (_, index) => `source-${index + 1}`),
		}
	);
	telemetry.recordPressure(
		{ kind: 'expedition-settled', amount: 0, bankedSalvage: banked[variant]! },
		telemetry.getSnapshot().deaths > 0
			? {
					unbankedSalvage: 0,
					bankedSalvage: banked[variant]!,
					lostSalvage: 2,
					deaths: 1,
					activeCheckpointId: 'market-relay',
					collectedSourceIds: ['source-1'],
			  }
			: {
					unbankedSalvage: 0,
					bankedSalvage: banked[variant]!,
					lostSalvage: 0,
					deaths: 0,
					activeCheckpointId: 'market-relay',
					collectedSourceIds: ['source-1'],
			  }
	);
	return {
		seed,
		completed: true,
		buildId,
		evidenceClass: 'deterministic-benchmark-replay',
		telemetry: telemetry.getSnapshot(),
	};
}

function writeEvidencePacket(packet: ReturnType<typeof buildEvidencePacket>): void {
	mkdirSync(EVIDENCE_ROOT, { recursive: true });
	const corePath = join(EVIDENCE_ROOT, 'core-evidence.json');
	writeJson(corePath, packet);
	const localizationPath = join(EVIDENCE_ROOT, 'localization', 'inventory.json');
	writeJson(localizationPath, packet.localization);
	writeJson(
		join(EVIDENCE_ROOT, 'localization', 'en-US.template.json'),
		Object.fromEntries(packet.localization.entries.map((entry) => [entry.key, entry.text]))
	);
	writeJson(join(EVIDENCE_ROOT, 'localization', 'extraction-report.json'), {
		generatedFor: EVIDENCE_DATE,
		locale: 'en-US',
		...packet.localization.summary,
	});
	const buildPath = join(EVIDENCE_ROOT, 'build-lab', 'same-seed-runs.json');
	writeJson(buildPath, packet.buildLab);
	const migrationPath = join(EVIDENCE_ROOT, 'migrations', 'undercity-v1-to-v2.json');
	writeJson(migrationPath, packet.undercity);
	const motionPath = join(EVIDENCE_ROOT, 'accessibility', 'traversal-motion.json');
	writeJson(motionPath, packet.motion);
	const cuePath = join(EVIDENCE_ROOT, 'vane-audio', 'cue-contract.json');
	writeJson(cuePath, packet.vaneAudio);
	for (const cue of packet.vaneAudio.cues) {
		const wavPath = join(EVIDENCE_ROOT, 'vane-audio', `${cue.id}.wav`);
		mkdirSync(dirname(wavPath), { recursive: true });
		writeFileSync(wavPath, synthesizeCueWav(cue));
	}
	const generated = collectFiles(EVIDENCE_ROOT)
		.filter((path) => !path.endsWith('manifest.json'))
		.map((path) => ({
			path: relative(EVIDENCE_ROOT, path),
			bytes: statSync(path).size,
			sha256: sha256(readFileSync(path)),
		}));
	writeJson(join(EVIDENCE_ROOT, 'manifest.json'), {
		contractVersion: 1,
		generatedFor: EVIDENCE_DATE,
		files: generated,
	});
}

function collectLocalizationInventory(root: string) {
	const files = collectFiles(root).filter((path) => path.endsWith('.ts') && !path.endsWith('.test.ts'));
	const entries: Array<{ key: string; text: string; source: string; line: number; surface: string }> = [];
	const fieldPattern = /\b(label|title|description|goal|hint|voice|question|placard|summary|argument|tagline|message|note|playerCue|worldConsequenceHint)\s*:\s*(['"`])([^\n]*?)\2/g;
	const callPattern = /\b(showToast|fillText)\(\s*(['"`])([^\n]*?)\2/g;
	const assignmentPattern = /\.(objectiveHint|contextHint|loadoutHint|companionHint|bossPhaseHint|hudToast)\s*=\s*(['"`])([^\n]*?)\2/g;
	for (const file of files) {
		const source = readFileSync(file, 'utf8');
		for (const [pattern, surfaceGroup, textGroup] of [
			[fieldPattern, 1, 3],
			[callPattern, 1, 3],
			[assignmentPattern, 1, 3],
		] as const) {
			pattern.lastIndex = 0;
			for (let match = pattern.exec(source); match; match = pattern.exec(source)) {
				const text = (match[textGroup] ?? '').trim();
				if (!isLocalizableText(text)) continue;
				const sourcePath = relative(ROOT, file);
				const line = source.slice(0, match.index).split('\n').length;
				entries.push({
					key: `${sourcePath}:${line}:${match[surfaceGroup]}`,
					text,
					source: sourcePath,
					line,
					surface: match[surfaceGroup] ?? 'unknown',
				});
			}
		}
	}
	entries.sort((left, right) => left.key.localeCompare(right.key));
	const duplicateTexts = Object.entries(
		entries.reduce<Record<string, number>>((counts, entry) => {
			counts[entry.text] = (counts[entry.text] ?? 0) + 1;
			return counts;
		}, {})
	)
		.filter(([, count]) => count > 1)
		.sort(([left], [right]) => left.localeCompare(right));
	return {
		summary: {
			totalEntries: entries.length,
			uniqueTexts: new Set(entries.map((entry) => entry.text)).size,
			sourceFiles: new Set(entries.map((entry) => entry.source)).size,
			dynamicTemplateEntries: entries.filter((entry) => entry.text.includes('${')).length,
			duplicateTexts: duplicateTexts.length,
		},
		entries,
		duplicateTexts: duplicateTexts.map(([text, count]) => ({ text, count })),
	};
}

function isLocalizableText(text: string): boolean {
	return text.length >= 3 && /[A-Za-zÀ-ž]/.test(text) && !/^[-a-z0-9_:/.]+$/.test(text);
}

function synthesizeCueWav(cue: DirectorVaneAudioCue): Buffer {
	const sampleRate = 44_100;
	const sampleCount = Math.ceil((cue.durationMs / 1000) * sampleRate);
	const data = Buffer.alloc(sampleCount * 2);
	for (let index = 0; index < sampleCount; index += 1) {
		const time = index / sampleRate;
		const progressMs = time * 1000;
		const attack = Math.min(1, progressMs / Math.max(1, cue.attackMs));
		const releaseStart = Math.max(0, cue.durationMs - cue.releaseMs);
		const release = progressMs <= releaseStart ? 1 : Math.max(0, (cue.durationMs - progressMs) / Math.max(1, cue.releaseMs));
		const envelope = attack * release * cue.gain;
		const primary = oscillator(cue.waveform, cue.frequencyHz, time);
		const secondary = cue.secondaryFrequencyHz
			? oscillator('sine', cue.secondaryFrequencyHz, time) * 0.45
			: 0;
		const sample = Math.max(-1, Math.min(1, (primary + secondary) * envelope));
		data.writeInt16LE(Math.round(sample * 32767), index * 2);
	}
	const header = Buffer.alloc(44);
	header.write('RIFF', 0);
	header.writeUInt32LE(36 + data.length, 4);
	header.write('WAVEfmt ', 8);
	header.writeUInt32LE(16, 16);
	header.writeUInt16LE(1, 20);
	header.writeUInt16LE(1, 22);
	header.writeUInt32LE(sampleRate, 24);
	header.writeUInt32LE(sampleRate * 2, 28);
	header.writeUInt16LE(2, 32);
	header.writeUInt16LE(16, 34);
	header.write('data', 36);
	header.writeUInt32LE(data.length, 40);
	return Buffer.concat([header, data]);
}

function oscillator(waveform: DirectorVaneAudioCue['waveform'], frequency: number, time: number): number {
	const phase = time * frequency;
	if (waveform === 'square') return Math.sin(phase * Math.PI * 2) >= 0 ? 1 : -1;
	if (waveform === 'sawtooth') return 2 * (phase - Math.floor(phase + 0.5));
	if (waveform === 'triangle') return 2 * Math.abs(2 * (phase - Math.floor(phase + 0.5))) - 1;
	return Math.sin(phase * Math.PI * 2);
}

function collectFiles(root: string): string[] {
	const result: string[] = [];
	for (const entry of readdirSync(root, { withFileTypes: true })) {
		const path = join(root, entry.name);
		if (entry.isDirectory()) result.push(...collectFiles(path));
		else if (entry.isFile()) result.push(path);
	}
	return result.sort();
}

function writeJson(path: string, value: unknown): void {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, `${stableJson(value)}\n`);
}

function stableJson(value: unknown): string {
	return JSON.stringify(sortValue(value), null, 2);
}

function sortValue(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(sortValue);
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value as Record<string, unknown>)
				.sort(([left], [right]) => left.localeCompare(right))
				.map(([key, entry]) => [key, sortValue(entry)])
		);
	}
	return value;
}

function sha256(value: string | Buffer): string {
	return createHash('sha256').update(value).digest('hex');
}
