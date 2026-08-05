export interface CivicCargoItem {
	id: string;
	volume: number;
	mass: number;
	priority: number;
	protected?: boolean;
	conflictsWith?: string[];
}

export interface CivicCargoBin {
	id: string;
	volumeCapacity: number;
	massCapacity: number;
}

export interface CivicCargoPlacement {
	binId: string;
	itemIds: string[];
	usedVolume: number;
	usedMass: number;
}

export interface CivicCargoPackingResult {
	placements: CivicCargoPlacement[];
	unplacedItemIds: string[];
	packedPriority: number;
	packedProtectedCount: number;
	usedBinCount: number;
	optimal: boolean;
	proof: string[];
}

interface MutableBin {
	id: string;
	volumeCapacity: number;
	massCapacity: number;
	usedVolume: number;
	usedMass: number;
	itemIds: string[];
}

interface PackingCandidate {
	bins: MutableBin[];
	unplacedItemIds: string[];
	packedPriority: number;
	packedProtectedCount: number;
	packedCount: number;
	usedBinCount: number;
	totalSlack: number;
	signature: string;
}

const EXACT_PACKING_ITEM_LIMIT = 12;

/**
 * Packs a small public manifest exactly and larger manifests with a stable
 * first-fit-decreasing fallback. The objective deliberately protects named
 * passengers/cargo before aggregate throughput, then priority, count, used
 * bins, and residual slack.
 */
export function packCivicCargo(
	items: readonly CivicCargoItem[],
	bins: readonly CivicCargoBin[]
): CivicCargoPackingResult {
	validateCargoInput(items, bins);
	const orderedItems = [...items].sort(compareCargoItems);
	const mutableBins = [...bins]
		.sort((left, right) => left.id.localeCompare(right.id))
		.map((bin) => ({ ...bin, usedVolume: 0, usedMass: 0, itemIds: [] }));
	const exact = orderedItems.length <= EXACT_PACKING_ITEM_LIMIT;
	const candidate = exact
		? searchExactPacking(orderedItems, mutableBins)
		: firstFitPacking(orderedItems, mutableBins);
	return {
		placements: candidate.bins.map(toPlacement),
		unplacedItemIds: [...candidate.unplacedItemIds],
		packedPriority: candidate.packedPriority,
		packedProtectedCount: candidate.packedProtectedCount,
		usedBinCount: candidate.usedBinCount,
		optimal: exact,
		proof: [
			exact
				? `Exact branch search considered every feasible placement for ${orderedItems.length} items.`
				: `Stable first-fit decreasing used because ${orderedItems.length} items exceed the exact limit ${EXACT_PACKING_ITEM_LIMIT}.`,
			`Protected packed: ${candidate.packedProtectedCount}. Priority packed: ${candidate.packedPriority}.`,
			`Used bins: ${candidate.usedBinCount}/${bins.length}. Unplaced: ${candidate.unplacedItemIds.length}.`,
		],
	};
}

function searchExactPacking(items: CivicCargoItem[], bins: MutableBin[]): PackingCandidate {
	let best: PackingCandidate | null = null;
	const unplaced: string[] = [];

	const visit = (index: number): void => {
		if (index >= items.length) {
			const candidate = summarizePacking(items, bins, unplaced);
			if (!best || comparePackingCandidates(candidate, best) < 0) best = candidate;
			return;
		}
		const item = items[index] as CivicCargoItem;
		const equivalentStates = new Set<string>();
		for (const bin of bins) {
			if (!canPlaceItem(item, bin, items)) continue;
			const stateKey = `${bin.usedVolume}:${bin.usedMass}:${[...bin.itemIds].sort().join(',')}`;
			if (equivalentStates.has(stateKey)) continue;
			equivalentStates.add(stateKey);
			placeItem(item, bin);
			visit(index + 1);
			removeItem(item, bin);
		}
		unplaced.push(item.id);
		visit(index + 1);
		unplaced.pop();
	};

	visit(0);
	return best ?? summarizePacking(items, bins, items.map((item) => item.id));
}

function firstFitPacking(items: CivicCargoItem[], bins: MutableBin[]): PackingCandidate {
	const unplaced: string[] = [];
	for (const item of items) {
		const bin = bins.find((candidate) => canPlaceItem(item, candidate, items));
		if (bin) placeItem(item, bin);
		else unplaced.push(item.id);
	}
	return summarizePacking(items, bins, unplaced);
}

function summarizePacking(
	items: readonly CivicCargoItem[],
	bins: readonly MutableBin[],
	unplacedItemIds: readonly string[]
): PackingCandidate {
	const unplaced = new Set(unplacedItemIds);
	const packed = items.filter((item) => !unplaced.has(item.id));
	const usedBins = bins.filter((bin) => bin.itemIds.length > 0);
	const totalSlack = usedBins.reduce(
		(total, bin) =>
			total +
			(bin.volumeCapacity - bin.usedVolume) / bin.volumeCapacity +
			(bin.massCapacity - bin.usedMass) / bin.massCapacity,
		0
	);
	const clone = bins.map((bin) => ({ ...bin, itemIds: [...bin.itemIds].sort() }));
	return {
		bins: clone,
		unplacedItemIds: [...unplacedItemIds].sort(),
		packedPriority: packed.reduce((total, item) => total + item.priority, 0),
		packedProtectedCount: packed.filter((item) => item.protected).length,
		packedCount: packed.length,
		usedBinCount: usedBins.length,
		totalSlack,
		signature: clone.map((bin) => `${bin.id}:${bin.itemIds.join(',')}`).join('|'),
	};
}

function comparePackingCandidates(left: PackingCandidate, right: PackingCandidate): number {
	return (
		right.packedProtectedCount - left.packedProtectedCount ||
		right.packedPriority - left.packedPriority ||
		right.packedCount - left.packedCount ||
		left.usedBinCount - right.usedBinCount ||
		left.totalSlack - right.totalSlack ||
		left.signature.localeCompare(right.signature)
	);
}

function compareCargoItems(left: CivicCargoItem, right: CivicCargoItem): number {
	return (
		Number(Boolean(right.protected)) - Number(Boolean(left.protected)) ||
		right.priority - left.priority ||
		right.volume + right.mass - (left.volume + left.mass) ||
		left.id.localeCompare(right.id)
	);
}

function canPlaceItem(
	item: CivicCargoItem,
	bin: MutableBin,
	items: readonly CivicCargoItem[]
): boolean {
	if (bin.usedVolume + item.volume > bin.volumeCapacity) return false;
	if (bin.usedMass + item.mass > bin.massCapacity) return false;
	const byId = new Map(items.map((candidate) => [candidate.id, candidate]));
	return bin.itemIds.every((existingId) => {
		const existing = byId.get(existingId);
		return (
			!item.conflictsWith?.includes(existingId) &&
			!existing?.conflictsWith?.includes(item.id)
		);
	});
}

function placeItem(item: CivicCargoItem, bin: MutableBin): void {
	bin.itemIds.push(item.id);
	bin.usedVolume += item.volume;
	bin.usedMass += item.mass;
}

function removeItem(item: CivicCargoItem, bin: MutableBin): void {
	const index = bin.itemIds.lastIndexOf(item.id);
	if (index >= 0) bin.itemIds.splice(index, 1);
	bin.usedVolume -= item.volume;
	bin.usedMass -= item.mass;
}

function toPlacement(bin: MutableBin): CivicCargoPlacement {
	return {
		binId: bin.id,
		itemIds: [...bin.itemIds],
		usedVolume: round(bin.usedVolume),
		usedMass: round(bin.usedMass),
	};
}

function validateCargoInput(
	items: readonly CivicCargoItem[],
	bins: readonly CivicCargoBin[]
): void {
	assertUniqueIds(items, 'cargo item');
	assertUniqueIds(bins, 'cargo bin');
	for (const item of items) {
		if (!(item.volume > 0) || !(item.mass > 0) || !(item.priority > 0)) {
			throw new Error(`${item.id}: cargo dimensions and priority must be positive`);
		}
	}
	for (const bin of bins) {
		if (!(bin.volumeCapacity > 0) || !(bin.massCapacity > 0)) {
			throw new Error(`${bin.id}: cargo capacities must be positive`);
		}
	}
}

export interface AuthorityGraph {
	nodeIds: string[];
	edges: Array<readonly [string, string]>;
}

export interface AuthorityColoringResult {
	colorCount: number;
	assignment: Record<string, number>;
	conflictFree: boolean;
	proof: string[];
}

/** Exact DSATUR-style coloring for the small governance graphs used in quests. */
export function colorAuthorityGraph(graph: AuthorityGraph): AuthorityColoringResult {
	const nodeIds = [...new Set(graph.nodeIds)].sort();
	if (nodeIds.length !== graph.nodeIds.length) throw new Error('authority graph contains duplicate nodes');
	const neighbors = new Map(nodeIds.map((id) => [id, new Set<string>()]));
	for (const [left, right] of graph.edges) {
		if (left === right) throw new Error(`${left}: authority graph contains a self conflict`);
		if (!neighbors.has(left) || !neighbors.has(right)) {
			throw new Error(`${left}:${right}: authority edge references an unknown node`);
		}
		neighbors.get(left)?.add(right);
		neighbors.get(right)?.add(left);
	}
	if (nodeIds.length === 0) {
		return { colorCount: 0, assignment: {}, conflictFree: true, proof: ['Empty graph needs no shifts.'] };
	}
	for (let colorLimit = 1; colorLimit <= nodeIds.length; colorLimit += 1) {
		const assignment: Record<string, number> = {};
		if (tryColorGraph(nodeIds, neighbors, assignment, colorLimit)) {
			return {
				colorCount: colorLimit,
				assignment,
				conflictFree: validateColoring(graph, assignment),
				proof: [
					`No valid coloring exists with fewer than ${colorLimit} public shifts.`,
					`A conflict-free ${colorLimit}-color assignment was found deterministically.`,
				],
			};
		}
	}
	throw new Error('authority graph coloring failed unexpectedly');
}

function tryColorGraph(
	nodeIds: readonly string[],
	neighbors: ReadonlyMap<string, ReadonlySet<string>>,
	assignment: Record<string, number>,
	colorLimit: number
): boolean {
	if (Object.keys(assignment).length === nodeIds.length) return true;
	const uncolored = nodeIds.filter((id) => assignment[id] === undefined);
	uncolored.sort((left, right) => {
		const leftColors = new Set([...neighbors.get(left) ?? []].map((id) => assignment[id]).filter((value) => value !== undefined));
		const rightColors = new Set([...neighbors.get(right) ?? []].map((id) => assignment[id]).filter((value) => value !== undefined));
		return (
			rightColors.size - leftColors.size ||
			(neighbors.get(right)?.size ?? 0) - (neighbors.get(left)?.size ?? 0) ||
			left.localeCompare(right)
		);
	});
	const nodeId = uncolored[0] as string;
	const forbidden = new Set(
		[...neighbors.get(nodeId) ?? []]
			.map((neighborId) => assignment[neighborId])
			.filter((value): value is number => value !== undefined)
	);
	for (let color = 0; color < colorLimit; color += 1) {
		if (forbidden.has(color)) continue;
		assignment[nodeId] = color;
		if (tryColorGraph(nodeIds, neighbors, assignment, colorLimit)) return true;
		delete assignment[nodeId];
	}
	return false;
}

function validateColoring(graph: AuthorityGraph, assignment: Readonly<Record<string, number>>): boolean {
	return graph.edges.every(([left, right]) => assignment[left] !== assignment[right]);
}

export interface ContradictionImplication {
	id: string;
	when: string[];
	then: string;
	reason: string;
}

export interface ContradictionCase {
	assumption: string;
	facts: readonly string[];
	implications: readonly ContradictionImplication[];
	exclusivePairs: readonly (readonly [string, string])[];
}

export interface ContradictionProofResult {
	closed: boolean;
	derivedFacts: string[];
	contradiction?: readonly [string, string];
	proofTrace: string[];
}

/**
 * Performs a finite forward-chaining proof by contradiction. It is intentionally
 * small and inspectable: every derived statement records the implication that
 * produced it, and failure to close remains a valid result rather than magic.
 */
export function proveByContradiction(input: ContradictionCase): ContradictionProofResult {
	const derived = new Set([...input.facts, input.assumption]);
	const trace = [
		...input.facts.map((fact) => `Given: ${fact}`),
		`Assume for contradiction: ${input.assumption}`,
	];
	const implications = [...input.implications].sort((left, right) => left.id.localeCompare(right.id));
	let changed = true;
	while (changed) {
		changed = false;
		for (const implication of implications) {
			if (derived.has(implication.then)) continue;
			if (!implication.when.every((fact) => derived.has(fact))) continue;
			derived.add(implication.then);
			trace.push(`${implication.id}: ${implication.reason} ⇒ ${implication.then}`);
			changed = true;
			const contradiction = findContradiction(derived, input.exclusivePairs);
			if (contradiction) {
				trace.push(`Contradiction: ${contradiction[0]} and ${contradiction[1]} cannot both hold.`);
				return {
					closed: true,
					derivedFacts: [...derived].sort(),
					contradiction,
					proofTrace: trace,
				};
			}
		}
	}
	const contradiction = findContradiction(derived, input.exclusivePairs);
	if (contradiction) {
		trace.push(`Contradiction: ${contradiction[0]} and ${contradiction[1]} cannot both hold.`);
	}
	return {
		closed: Boolean(contradiction),
		derivedFacts: [...derived].sort(),
		contradiction,
		proofTrace: contradiction
			? trace
			: [...trace, 'The assumption remains unrefuted by the available public evidence.'],
	};
}

function findContradiction(
	facts: ReadonlySet<string>,
	exclusivePairs: readonly (readonly [string, string])[]
): readonly [string, string] | undefined {
	return exclusivePairs.find(([left, right]) => facts.has(left) && facts.has(right));
}

function assertUniqueIds(values: readonly { id: string }[], label: string): void {
	const ids = new Set<string>();
	for (const value of values) {
		if (!value.id) throw new Error(`${label} id must be non-empty`);
		if (ids.has(value.id)) throw new Error(`duplicate ${label}: ${value.id}`);
		ids.add(value.id);
	}
}

function round(value: number): number {
	return Math.round(value * 100) / 100;
}
