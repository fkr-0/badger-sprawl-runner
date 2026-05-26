import type { StatEffectMap } from './ItemStatSystem';

export interface SocketDefinition {
	id: string;
	acceptsTags: string[];
	polarity?: string;
	overclockLevel?: number;
	instability?: number;
}

export interface SocketedItemState {
	itemId: string;
	sockets: SocketDefinition[];
	installed: Record<string, string>;
}

export interface ModChipDefinition {
	id: string;
	tags: string[];
	effects: StatEffectMap;
	polarity?: string;
	heatCost?: number;
	durabilityDrain?: number;
}

export interface SocketInstallResult {
	ok: boolean;
	state: SocketedItemState;
	reason?: string;
}

export interface SocketResolvedEffect {
	socketId: string;
	chipId: string;
	polarity: 'matched' | 'mismatched' | 'neutral';
	overclockLevel: number;
	instability: number;
	heatCost: number;
	durabilityDrain: number;
	effects: StatEffectMap;
}

export interface SocketPolarityResolution {
	effects: StatEffectMap;
	entries: SocketResolvedEffect[];
	instabilitySeed: number;
}

export function installModChip(item: SocketedItemState, chip: ModChipDefinition, socketId: string): SocketInstallResult {
	const socket = item.sockets.find((candidate) => candidate.id === socketId);
	if (!socket) return { ok: false, state: cloneSocketedItem(item), reason: `missing-socket:${socketId}` };
	if (!chip.tags.some((tag) => socket.acceptsTags.includes(tag))) {
		return { ok: false, state: cloneSocketedItem(item), reason: `incompatible:${chip.id}:${socketId}` };
	}
	return {
		ok: true,
		state: {
			itemId: item.itemId,
			sockets: item.sockets.map(cloneSocket),
			installed: { ...item.installed, [socketId]: chip.id },
		},
	};
}

export function removeModChip(item: SocketedItemState, socketId: string): SocketedItemState {
	const installed = { ...item.installed };
	delete installed[socketId];
	return { itemId: item.itemId, sockets: item.sockets.map(cloneSocket), installed };
}

export function resolveSocketEffects(item: SocketedItemState, chips: readonly ModChipDefinition[]): StatEffectMap {
	const byId = new Map(chips.map((chip) => [chip.id, chip]));
	const effects: StatEffectMap = {};
	for (const [socketId, chipId] of Object.entries(item.installed).sort(([left], [right]) => left.localeCompare(right))) {
		const chip = byId.get(chipId);
		if (!chip) continue;
		for (const [key, value] of Object.entries(chip.effects).sort(([left], [right]) => left.localeCompare(right))) {
			const previous = effects[key];
			if (typeof value === 'number' && typeof previous === 'number') effects[key] = previous + value;
			else effects[key] = value;
		}
	}
	return effects;
}

function cloneSocketedItem(item: SocketedItemState): SocketedItemState {
	return {
		itemId: item.itemId,
		sockets: item.sockets.map(cloneSocket),
		installed: { ...item.installed },
	};
}


function cloneSocket(socket: SocketDefinition): SocketDefinition {
	return { ...socket, acceptsTags: [...socket.acceptsTags] };
}

function numericEffect(value: number, socket: SocketDefinition, chip: ModChipDefinition): number {
	const polarityBoost = socket.polarity && chip.polarity ? (socket.polarity === chip.polarity ? 1.25 : 0.8) : 1;
	const overclockBoost = 1 + Math.max(0, socket.overclockLevel ?? 0) * 0.15;
	return Number((value * polarityBoost * overclockBoost).toFixed(6));
}

function instabilitySeed(entries: SocketResolvedEffect[]): number {
	let hash = 2166136261;
	for (const entry of entries) {
		for (const char of `${entry.socketId}:${entry.chipId}:${entry.instability}`) {
			hash ^= char.charCodeAt(0);
			hash = Math.imul(hash, 16777619) >>> 0;
		}
	}
	return hash >>> 0;
}

export function resolveSocketPolarityEffects(item: SocketedItemState, chips: readonly ModChipDefinition[]): SocketPolarityResolution {
	const byId = new Map(chips.map((chip) => [chip.id, chip]));
	const effects: StatEffectMap = {};
	const entries: SocketResolvedEffect[] = [];
	for (const [socketId, chipId] of Object.entries(item.installed).sort(([left], [right]) => left.localeCompare(right))) {
		const socket = item.sockets.find((candidate) => candidate.id === socketId);
		const chip = byId.get(chipId);
		if (!socket || !chip) continue;
		const entryEffects: StatEffectMap = {};
		for (const [key, value] of Object.entries(chip.effects).sort(([left], [right]) => left.localeCompare(right))) {
			const resolved = typeof value === 'number' ? numericEffect(value, socket, chip) : value;
			entryEffects[key] = resolved;
			const previous = effects[key];
			if (typeof resolved === 'number' && typeof previous === 'number') effects[key] = Number((previous + resolved).toFixed(6));
			else effects[key] = resolved;
		}
		const overclockLevel = Math.max(0, socket.overclockLevel ?? 0);
		const polarity = socket.polarity && chip.polarity ? (socket.polarity === chip.polarity ? 'matched' : 'mismatched') : 'neutral';
		entries.push({
			socketId,
			chipId,
			polarity,
			overclockLevel,
			instability: Number(((socket.instability ?? 0) + overclockLevel * 0.05).toFixed(6)),
			heatCost: Number(((chip.heatCost ?? 0) * (1 + overclockLevel * 0.25)).toFixed(6)),
			durabilityDrain: Number(((chip.durabilityDrain ?? 0) * (1 + overclockLevel * 0.5)).toFixed(6)),
			effects: entryEffects,
		});
	}
	return { effects, entries, instabilitySeed: instabilitySeed(entries) };
}
