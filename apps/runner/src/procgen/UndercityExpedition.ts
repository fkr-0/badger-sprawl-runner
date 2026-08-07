import type { AdventureInventoryStack } from '../game/adventure/AdventureState';
import {
	type AdventureItemState,
	type ExpeditionLaunchState,
	createDefaultItemState,
	sanitizeItemStates,
} from '../game/adventure/ExpeditionLedger';
import type { StageRunSceneOptions } from '../scenes/StageRunScene';
import type { RuntimeStageId } from '../world/stageLayoutRegistry';
import { EncounterGenerator, type GeneratedEnemyPack, SeededRng } from './EncounterGenerator';
import { type GeneratedSideRoom, SideRoomGenerator } from './SideRoomGenerator';

export const UNDERCITY_MANIFEST_SCHEMA_VERSION = 1 as const;
export const ACTIVE_UNDERCITY_EXPEDITION_SCHEMA_VERSION = 2 as const;
export const LEGACY_ACTIVE_UNDERCITY_EXPEDITION_SCHEMA_VERSION = 1 as const;

export interface UndercityEntranceDef {
	id: string;
	locationId: string;
	stageId: RuntimeStageId;
	label: string;
	accessHint: string;
}

function sanitizeActiveRuntimeState(value: unknown): ActiveUndercityRuntimeState {
	const record = isRecord(value) ? value : {};
	const inventory = sanitizeActiveInventory(record.inventory);
	const owned = new Set(inventory.map((stack) => stack.itemId));
	const itemStates = sanitizeItemStates(record.itemStates);
	for (const stack of inventory) {
		itemStates[stack.itemId] = createDefaultItemState(itemStates[stack.itemId]);
	}
	const maxIntegrity = clampInteger(record.maxIntegrity, 1, 99);
	return {
		inventory,
		equippedItemIds: stringArray(record.equippedItemIds).filter(
			(itemId) => owned.has(itemId) && (itemStates[itemId]?.condition ?? 0) > 0
		),
		itemStates: Object.fromEntries(
			Object.entries(itemStates).filter(([itemId]) => owned.has(itemId))
		),
		integrity: clampInteger(record.integrity, 1, maxIntegrity),
		maxIntegrity,
		injuries: clampInteger(record.injuries, 0, 99),
		collectedSourceIds: stringArray(record.collectedSourceIds).slice(0, 512),
	};
}

function sanitizeActiveInventory(value: unknown): AdventureInventoryStack[] {
	if (!Array.isArray(value)) return [];
	const quantities = new Map<string, number>();
	for (const candidate of value) {
		if (
			!isRecord(candidate) ||
			typeof candidate.itemId !== 'string' ||
			candidate.itemId.length === 0
		) {
			continue;
		}
		const quantity = clampInteger(candidate.quantity, 0, 9999);
		if (quantity <= 0) continue;
		quantities.set(
			candidate.itemId,
			Math.min(9999, (quantities.get(candidate.itemId) ?? 0) + quantity)
		);
	}
	return [...quantities.entries()]
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([itemId, quantity]) => ({ itemId, quantity }));
}

function stringArray(value: unknown): string[] {
	return Array.isArray(value)
		? [
				...new Set(
					value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)
				),
			]
		: [];
}

export interface UndercityContractDef {
	id: string;
	label: string;
	description: string;
	gameplayHooks: string[];
	publicQuestion: string;
}

export interface ProceduralVendorDef {
	id: string;
	name: string;
	specialty: string;
	voice: string;
}

export interface ProceduralEliteDef {
	id: string;
	name: string;
	role: string;
	telegraph: string;
	publicRecord: string;
}

export interface UndercityExpeditionManifest {
	schemaVersion: typeof UNDERCITY_MANIFEST_SCHEMA_VERSION;
	runId: string;
	seed: string;
	entranceId: string;
	stageId: RuntimeStageId;
	depth: number;
	contractId: string;
	vendorId: string;
	eliteId: string;
	enemyPackCount: number;
	sideRoomCount: number;
	maxAffixesPerPack: number;
	rewardScale: number;
	checksum: string;
}

export interface BuiltUndercityExpedition {
	manifest: UndercityExpeditionManifest;
	options: StageRunSceneOptions;
	enemyPacks: GeneratedEnemyPack[];
	sideRooms: GeneratedSideRoom[];
}

export type ActiveUndercityStatus = 'active' | 'completed' | 'abandoned';

export interface ActiveUndercityRuntimeState {
	inventory: AdventureInventoryStack[];
	equippedItemIds: string[];
	itemStates: Record<string, AdventureItemState>;
	integrity: number;
	maxIntegrity: number;
	injuries: number;
	collectedSourceIds: string[];
}

export interface ActiveUndercityExpeditionSaveV2 {
	schemaVersion: typeof ACTIVE_UNDERCITY_EXPEDITION_SCHEMA_VERSION;
	manifest: UndercityExpeditionManifest;
	currentRoomIndex: number;
	bankedSalvage: number;
	unbankedSalvage: number;
	status: ActiveUndercityStatus;
	updatedSequence: number;
	runtime: ActiveUndercityRuntimeState;
}

export type ActiveUndercityExpeditionSave = ActiveUndercityExpeditionSaveV2;

export const UNDERCITY_ENTRANCES: readonly UndercityEntranceDef[] = [
	{
		id: 'blue-mercy-maintenance-mouth',
		locationId: 'lower-sprawl:safehouse',
		stageId: 'lower-sprawl',
		label: 'Blue Mercy Maintenance Mouth',
		accessHint: 'Auntie opens the old cable throat after the city route becomes public.',
	},
	{
		id: 'drainmarket-sump-archive',
		locationId: 'drainmarket:settlement',
		stageId: 'drainmarket',
		label: 'Sump Archive Descent',
		accessHint: 'Clinic runners expose a submerged inventory route beneath the medicine market.',
	},
	{
		id: 'arcology-remainder-shaft',
		locationId: 'chrome-arcology:station',
		stageId: 'chrome-arcology',
		label: 'Remainder Shaft',
		accessHint:
			'The public manifest reveals freight that was repeatedly optimized out of the official lift.',
	},
	{
		id: 'chorus-rail-subharmonic-loop',
		locationId: 'dub-colony:station',
		stageId: 'dub-colony',
		label: 'Subharmonic Service Loop',
		accessHint:
			'The colony opens maintenance tunnels only after emergency authority begins rotating.',
	},
	{
		id: 'commons-return-signal-root',
		locationId: 'lower-sprawl:station',
		stageId: 'asteroid-redoubt',
		label: 'Commons Return-Signal Root',
		accessHint: 'Postgame return signals reveal unfinished transmitter roots under Blue Mercy.',
	},
];

export const UNDERCITY_CONTRACTS: readonly UndercityContractDef[] = [
	{
		id: 'protected-bin-manifest',
		label: 'Protected Bin Manifest',
		description: 'Carry protected medicine and witness packets through fixed room capacity.',
		gameplayHooks: ['salvage_pressure', 'protected_payload'],
		publicQuestion: 'Which objective function decided what became the remainder?',
	},
	{
		id: 'conflict-color-rotation',
		label: 'Conflict-Color Rotation',
		description:
			'Keep adjacent relay cells on distinct authority shifts while the route rearranges.',
		gameplayHooks: ['relay_rotation', 'civilian_witnesses'],
		publicQuestion: 'Can a valid coloring rotate before it becomes a caste?',
	},
	{
		id: 'contradiction-audit',
		label: 'Contradiction Audit',
		description:
			'Recover evidence that forces an automated contract to derive incompatible claims.',
		gameplayHooks: ['code_gate_pressure', 'report_conflict'],
		publicQuestion: 'Who owns the counterexample after it defeats the claim?',
	},
	{
		id: 'bounded-knowledge-drill',
		label: 'Bounded Knowledge Drill',
		description: 'Break relays and spoof sensors without creating global omniscience.',
		gameplayHooks: ['ambush_warning_overlay', 'local_alarm_cells'],
		publicQuestion: 'Which actor knows, through which source, for how long?',
	},
];

export const PROCEDURAL_VENDORS: readonly ProceduralVendorDef[] = [
	{
		id: 'vendor-bitwise-betty',
		name: 'Bitwise Betty',
		specialty: 'repairable logic tools and checksum labels',
		voice: 'Every offer arrives as two mutually exclusive jokes and one verifiable receipt.',
	},
	{
		id: 'vendor-pigeonhole-pete',
		name: 'Pigeonhole Pete',
		specialty: 'compact loadouts and suspiciously spacious pockets',
		voice: 'Insists that scarcity proves somebody has been counted twice, then checks the count.',
	},
	{
		id: 'vendor-dj-dijkstra',
		name: 'DJ Dijkstra',
		specialty: 'route rumors and low-cost traversal repairs',
		voice: 'Never promises the shortest path until the edge weights are public.',
	},
];

export const PROCEDURAL_ELITES: readonly ProceduralEliteDef[] = [
	{
		id: 'elite-greedy-clerk',
		name: 'The Greedy Clerk',
		role: 'shield accountant',
		telegraph: 'stacks the nearest visible resource into a receipt barrier',
		publicRecord: 'Locally efficient, globally embarrassing.',
	},
	{
		id: 'elite-backtracking-bailiff',
		name: 'Backtracking Bailiff',
		role: 'pursuit bruiser',
		telegraph: 'reverses to the last branching point after a failed attack',
		publicRecord: 'Calls exhaustive search “reasonable suspicion.”',
	},
	{
		id: 'elite-chromatic-foreman',
		name: 'Chromatic Foreman',
		role: 'relay support',
		telegraph: 'marks adjacent enemies with incompatible attack colors',
		publicRecord: 'Treats a schedule solution as hereditary rank.',
	},
	{
		id: 'elite-liar-lemma',
		name: 'Liar Lemma',
		role: 'sensor trapper',
		telegraph: 'publishes a decoy claiming the next decoy is false',
		publicRecord: 'A contradiction with excellent benefits.',
	},
];

export function buildUndercityExpedition(input: {
	seed: string;
	entranceId: string;
	depth?: number;
}): BuiltUndercityExpedition {
	const entrance = getUndercityEntrance(input.entranceId);
	if (!entrance) throw new Error(`unknown undercity entrance: ${input.entranceId}`);
	const seed = normalizeSeed(input.seed);
	const depth = clampInteger(input.depth ?? 1, 1, 20);
	const manifestSeed = `${seed}:${entrance.id}:depth:${depth}`;
	const rng = new SeededRng(manifestSeed);
	const contract = UNDERCITY_CONTRACTS[rng.int(UNDERCITY_CONTRACTS.length)] as UndercityContractDef;
	const vendor = PROCEDURAL_VENDORS[rng.int(PROCEDURAL_VENDORS.length)] as ProceduralVendorDef;
	const elite = PROCEDURAL_ELITES[rng.int(PROCEDURAL_ELITES.length)] as ProceduralEliteDef;
	const enemyPackCount = Math.min(5, 1 + Math.floor(depth / 2));
	const sideRoomCount = Math.min(3, 1 + Math.floor(depth / 4));
	const rewardScale = round(Math.min(2.25, 1 + depth * 0.075));
	const runId = `undercity:${hashText(manifestSeed)}`;
	const manifestWithoutChecksum = {
		schemaVersion: UNDERCITY_MANIFEST_SCHEMA_VERSION,
		runId,
		seed,
		entranceId: entrance.id,
		stageId: entrance.stageId,
		depth,
		contractId: contract.id,
		vendorId: vendor.id,
		eliteId: elite.id,
		enemyPackCount,
		sideRoomCount,
		maxAffixesPerPack: 2,
		rewardScale,
	};
	const checksum = hashText(stableStringify(manifestWithoutChecksum));
	const manifest: UndercityExpeditionManifest = { ...manifestWithoutChecksum, checksum };
	const encounterSeed = `${manifestSeed}:${contract.id}:${elite.id}`;
	const encounters = new EncounterGenerator();
	const enemyPacks = encounters
		.generatePacks(
			{
				stageId: entrance.stageId,
				seed: encounterSeed,
				orbitHeat: Math.min(12, depth),
				gameplayHooks: contract.gameplayHooks,
			},
			enemyPackCount
		)
		.map((pack) => ({ ...pack, affixes: pack.affixes.slice(0, manifest.maxAffixesPerPack) }));
	const sideRooms = new SideRoomGenerator().generateSideRooms({
		stageId: entrance.stageId,
		seed: encounterSeed,
		count: sideRoomCount,
		gameplayHooks: contract.gameplayHooks,
	});
	const options: StageRunSceneOptions = {
		stageId: entrance.stageId,
		procgenSeed: encounterSeed,
		branchGameplayHooks: contract.gameplayHooks,
		generatedEnemyPacks: enemyPacks,
		generatedSideRooms: sideRooms,
	};
	return { manifest, options, enemyPacks, sideRooms };
}

export function rebuildUndercityExpedition(
	manifest: UndercityExpeditionManifest
): BuiltUndercityExpedition {
	if (!verifyUndercityManifest(manifest))
		throw new Error('cannot rebuild an invalid undercity manifest');
	const rebuilt = buildUndercityExpedition({
		seed: manifest.seed,
		entranceId: manifest.entranceId,
		depth: manifest.depth,
	});
	if (
		rebuilt.manifest.checksum !== manifest.checksum ||
		rebuilt.manifest.runId !== manifest.runId
	) {
		throw new Error('undercity manifest no longer reproduces under the current generator');
	}
	return rebuilt;
}

export function createActiveUndercityExpeditionSave(
	manifest: UndercityExpeditionManifest,
	runtime?: ExpeditionLaunchState
): ActiveUndercityExpeditionSaveV2 {
	if (!verifyUndercityManifest(manifest))
		throw new Error('cannot activate an invalid undercity manifest');
	return {
		schemaVersion: ACTIVE_UNDERCITY_EXPEDITION_SCHEMA_VERSION,
		manifest: { ...manifest },
		currentRoomIndex: 0,
		bankedSalvage: 0,
		unbankedSalvage: 0,
		status: 'active',
		updatedSequence: 0,
		runtime: sanitizeActiveRuntimeState(runtime),
	};
}

export function sanitizeActiveUndercityExpeditionSave(
	value: unknown
): ActiveUndercityExpeditionSaveV2 | null {
	if (!isRecord(value)) return null;
	const schemaVersion = value.schemaVersion;
	if (
		schemaVersion !== ACTIVE_UNDERCITY_EXPEDITION_SCHEMA_VERSION &&
		schemaVersion !== LEGACY_ACTIVE_UNDERCITY_EXPEDITION_SCHEMA_VERSION
	)
		return null;
	const manifest = sanitizeManifest(value.manifest);
	if (!manifest || !verifyUndercityManifest(manifest)) return null;
	const status =
		value.status === 'completed' || value.status === 'abandoned' ? value.status : 'active';
	return {
		schemaVersion: ACTIVE_UNDERCITY_EXPEDITION_SCHEMA_VERSION,
		manifest,
		currentRoomIndex: clampInteger(value.currentRoomIndex, 0, manifest.sideRoomCount),
		bankedSalvage: clampInteger(value.bankedSalvage, 0, 999999),
		unbankedSalvage: clampInteger(value.unbankedSalvage, 0, 999999),
		status,
		updatedSequence: clampInteger(value.updatedSequence, 0, 999999999),
		runtime:
			schemaVersion === ACTIVE_UNDERCITY_EXPEDITION_SCHEMA_VERSION
				? sanitizeActiveRuntimeState(value.runtime)
				: sanitizeActiveRuntimeState(undefined),
	};
}

export function verifyUndercityManifest(manifest: UndercityExpeditionManifest): boolean {
	if (!getUndercityEntrance(manifest.entranceId)) return false;
	if (!UNDERCITY_CONTRACTS.some((entry) => entry.id === manifest.contractId)) return false;
	if (!PROCEDURAL_VENDORS.some((entry) => entry.id === manifest.vendorId)) return false;
	if (!PROCEDURAL_ELITES.some((entry) => entry.id === manifest.eliteId)) return false;
	if (manifest.maxAffixesPerPack !== 2) return false;
	const { checksum, ...unsigned } = manifest;
	return checksum === hashText(stableStringify(unsigned));
}

export function getUndercityEntrance(entranceId: string): UndercityEntranceDef | undefined {
	return UNDERCITY_ENTRANCES.find((entry) => entry.id === entranceId);
}

function sanitizeManifest(value: unknown): UndercityExpeditionManifest | null {
	if (!isRecord(value)) return null;
	const entrance =
		typeof value.entranceId === 'string' ? getUndercityEntrance(value.entranceId) : undefined;
	if (!entrance) return null;
	const candidate: UndercityExpeditionManifest = {
		schemaVersion: UNDERCITY_MANIFEST_SCHEMA_VERSION,
		runId: stringOr(value.runId, ''),
		seed: stringOr(value.seed, ''),
		entranceId: entrance.id,
		stageId: entrance.stageId,
		depth: clampInteger(value.depth, 1, 20),
		contractId: stringOr(value.contractId, ''),
		vendorId: stringOr(value.vendorId, ''),
		eliteId: stringOr(value.eliteId, ''),
		enemyPackCount: clampInteger(value.enemyPackCount, 1, 5),
		sideRoomCount: clampInteger(value.sideRoomCount, 1, 3),
		maxAffixesPerPack: clampInteger(value.maxAffixesPerPack, 0, 2),
		rewardScale: clampNumber(value.rewardScale, 1, 2.25),
		checksum: stringOr(value.checksum, ''),
	};
	return candidate.runId && candidate.seed ? candidate : null;
}

function normalizeSeed(seed: string): string {
	const normalized = seed.trim();
	if (!normalized) throw new Error('undercity seed must be non-empty');
	return normalized.slice(0, 160);
}

function stableStringify(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
	if (isRecord(value)) {
		return `{${Object.keys(value)
			.sort()
			.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
			.join(',')}}`;
	}
	return JSON.stringify(value);
}

function hashText(value: string): string {
	let hash = 2166136261;
	for (const char of value) {
		hash ^= char.charCodeAt(0);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0).toString(16).padStart(8, '0');
}

function clampInteger(value: unknown, minimum: number, maximum: number): number {
	return typeof value === 'number' && Number.isFinite(value)
		? Math.min(maximum, Math.max(minimum, Math.floor(value)))
		: minimum;
}

function clampNumber(value: unknown, minimum: number, maximum: number): number {
	return typeof value === 'number' && Number.isFinite(value)
		? Math.min(maximum, Math.max(minimum, value))
		: minimum;
}

function stringOr(value: unknown, fallback: string): string {
	return typeof value === 'string' ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function round(value: number): number {
	return Math.round(value * 100) / 100;
}
