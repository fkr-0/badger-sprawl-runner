import type { CombatEntity } from '../systems/CombatSystem';

export type EnemyRole =
	| 'shield'
	| 'bruiser'
	| 'trapper'
	| 'ranged'
	| 'skirmisher'
	| 'summoner'
	| 'support'
	| 'swarm';
export type PackRank = 'normal' | 'champion' | 'elite' | 'unique' | 'boss_support';

export interface EnemyUnitTemplate {
	id: string;
	role: EnemyRole;
	cost: number;
	hp: number;
	speed: number;
}

export interface EnemyFamilyTemplate {
	id: string;
	stages: string[];
	roleWeights: Partial<Record<EnemyRole, number>>;
	units: EnemyUnitTemplate[];
}

export interface EnemyAffixTemplate {
	id: string;
	cost: number;
	allowedRoles: EnemyRole[];
	forbiddenWith: string[];
	telegraph: string;
	effect: string;
}

export interface StageProcgenProfile {
	stageId: string;
	basePackBudget: number;
	familyWeights: Record<string, number>;
	rankWeights: Partial<Record<PackRank, number>>;
}

export interface EncounterGenerationInput {
	stageId: string;
	seed: string;
	orbitHeat?: number;
	gameplayHooks?: readonly string[];
	packIndex?: number;
}

export interface GeneratedEnemyPack {
	id: string;
	stageId: string;
	seed: string;
	familyId: string;
	rank: PackRank;
	budget: number;
	affixes: string[];
	enemies: CombatEntity[];
}

export interface ProcgenCatalog {
	families: EnemyFamilyTemplate[];
	affixes: EnemyAffixTemplate[];
	profiles: StageProcgenProfile[];
}

export const DEFAULT_ENEMY_FAMILIES: EnemyFamilyTemplate[] = [
	{
		id: 'toll_authority',
		stages: ['lower-sprawl', 'orbital-lift'],
		roleWeights: { shield: 3, bruiser: 2, trapper: 2, ranged: 1 },
		units: [
			{ id: 'meter_bailiff', role: 'shield', cost: 2, hp: 3, speed: 22 },
			{ id: 'turnstile_guard', role: 'bruiser', cost: 2, hp: 3, speed: 34 },
			{ id: 'receipt_trapper', role: 'trapper', cost: 3, hp: 2, speed: 12 },
			{ id: 'fare_laser', role: 'ranged', cost: 3, hp: 2, speed: 8 },
		],
	},
	{
		id: 'drainmarket_knives',
		stages: ['drainmarket'],
		roleWeights: { skirmisher: 4, ranged: 2, trapper: 2 },
		units: [
			{ id: 'knife_drone', role: 'skirmisher', cost: 1, hp: 1, speed: 62 },
			{ id: 'clinic_collector', role: 'bruiser', cost: 2, hp: 3, speed: 28 },
			{ id: 'price_tag_wasp', role: 'ranged', cost: 2, hp: 1, speed: 42 },
			{ id: 'invoice_snare', role: 'trapper', cost: 3, hp: 2, speed: 10 },
		],
	},
	{
		id: 'arcology_security',
		stages: ['chrome-arcology', 'mirror-palace'],
		roleWeights: { ranged: 3, shield: 3, trapper: 2, skirmisher: 1 },
		units: [
			{ id: 'lobby_sentinel', role: 'ranged', cost: 2, hp: 2, speed: 14 },
			{ id: 'elevator_bouncer', role: 'shield', cost: 3, hp: 4, speed: 20 },
			{ id: 'banquet_reflector', role: 'trapper', cost: 3, hp: 2, speed: 18 },
			{ id: 'contract_duelist', role: 'skirmisher', cost: 2, hp: 2, speed: 48 },
		],
	},
	{
		id: 'pirate_static',
		stages: ['antenna-barrens', 'asteroid-redoubt'],
		roleWeights: { summoner: 3, ranged: 3, trapper: 2 },
		units: [
			{ id: 'static_mast_imp', role: 'summoner', cost: 3, hp: 2, speed: 16 },
			{ id: 'ledger_ghost', role: 'ranged', cost: 2, hp: 2, speed: 24 },
			{ id: 'antenna_saboteur', role: 'trapper', cost: 3, hp: 2, speed: 28 },
			{ id: 'broadcast_leech', role: 'skirmisher', cost: 1, hp: 1, speed: 52 },
		],
	},
	{
		id: 'cargo_union_pressure',
		stages: ['dub-colony', 'orbital-lift', 'asteroid-redoubt'],
		roleWeights: { bruiser: 3, support: 3, swarm: 2 },
		units: [
			{ id: 'crate_brute', role: 'bruiser', cost: 3, hp: 4, speed: 18 },
			{ id: 'lift_chain_worker', role: 'support', cost: 2, hp: 2, speed: 26 },
			{ id: 'chorus_shieldhand', role: 'shield', cost: 3, hp: 4, speed: 16 },
			{ id: 'freight_tick', role: 'swarm', cost: 1, hp: 1, speed: 58 },
		],
	},
];

export const DEFAULT_AFFIXES: EnemyAffixTemplate[] = [
	{
		id: 'static_aura',
		cost: 2,
		allowedRoles: ['ranged', 'summoner', 'trapper'],
		forbiddenWith: [],
		telegraph: 'blue ring + buzzing speakers',
		effect: 'periodic EMP pulse',
	},
	{
		id: 'debt_shield',
		cost: 2,
		allowedRoles: ['shield', 'bruiser'],
		forbiddenWith: ['mirror_counter'],
		telegraph: 'receipt halo',
		effect: 'absorbs first hit until parried',
	},
	{
		id: 'fast_route',
		cost: 1,
		allowedRoles: ['skirmisher', 'swarm', 'bruiser'],
		forbiddenWith: ['knife_cloud'],
		telegraph: 'orange leg trails',
		effect: 'movement speed bonus',
	},
	{
		id: 'knife_cloud',
		cost: 2,
		allowedRoles: ['skirmisher', 'trapper', 'swarm'],
		forbiddenWith: ['fast_route'],
		telegraph: 'orbiting knife sprites',
		effect: 'proximity chip damage',
	},
	{
		id: 'mirror_counter',
		cost: 2,
		allowedRoles: ['skirmisher', 'shield'],
		forbiddenWith: ['debt_shield'],
		telegraph: 'mirror flash',
		effect: 'brief counter/parry window',
	},
];

export const DEFAULT_STAGE_PROFILES: StageProcgenProfile[] = [
	{ stageId: 'lower-sprawl', basePackBudget: 5, familyWeights: { toll_authority: 5 }, rankWeights: { normal: 5, champion: 1 } },
	{ stageId: 'drainmarket', basePackBudget: 6, familyWeights: { drainmarket_knives: 5 }, rankWeights: { normal: 4, champion: 2 } },
	{ stageId: 'chrome-arcology', basePackBudget: 7, familyWeights: { arcology_security: 5 }, rankWeights: { normal: 3, champion: 2, elite: 1 } },
	{ stageId: 'mirror-palace', basePackBudget: 7, familyWeights: { arcology_security: 5 }, rankWeights: { normal: 3, champion: 2, elite: 1 } },
	{ stageId: 'dub-colony', basePackBudget: 8, familyWeights: { cargo_union_pressure: 5 }, rankWeights: { normal: 3, champion: 3, elite: 1 } },
	{ stageId: 'antenna-barrens', basePackBudget: 8, familyWeights: { pirate_static: 5 }, rankWeights: { normal: 2, champion: 3, elite: 2 } },
	{ stageId: 'orbital-lift', basePackBudget: 9, familyWeights: { toll_authority: 2, cargo_union_pressure: 4 }, rankWeights: { normal: 2, champion: 3, elite: 2 } },
	{ stageId: 'asteroid-redoubt', basePackBudget: 10, familyWeights: { pirate_static: 3, cargo_union_pressure: 3 }, rankWeights: { normal: 1, champion: 3, elite: 3, unique: 1 } },
];

export const DEFAULT_PROCGEN_CATALOG: ProcgenCatalog = {
	families: DEFAULT_ENEMY_FAMILIES,
	affixes: DEFAULT_AFFIXES,
	profiles: DEFAULT_STAGE_PROFILES,
};

export class SeededRng {
	private state: number;

	constructor(seed: string) {
		this.state = hashSeed(seed);
	}

	next(): number {
		this.state = (1664525 * this.state + 1013904223) >>> 0;
		return this.state / 0x100000000;
	}

	int(maxExclusive: number): number {
		return Math.floor(this.next() * maxExclusive);
	}
}

export class EncounterGenerator {
	constructor(private readonly catalog: ProcgenCatalog = DEFAULT_PROCGEN_CATALOG) {}

	generatePack(input: EncounterGenerationInput): GeneratedEnemyPack {
		const profile = this.getProfile(input.stageId);
		const rng = new SeededRng(`${input.stageId}:${input.seed}:${input.packIndex ?? 0}`);
		const family = this.getFamily(weightedPick(profile.familyWeights, rng));
		const rank = weightedPick(profile.rankWeights, rng) as PackRank;
		const budget = this.getBudget(profile, rank, input.orbitHeat ?? 0, input.gameplayHooks ?? []);
		const affixes = this.pickAffixes(family, rank, rng);
		const enemies = this.buildEnemies(family, affixes, budget, rng, input.packIndex ?? 0);
		return {
			id: `${input.stageId}-${family.id}-${rank}-${input.packIndex ?? 0}`,
			stageId: input.stageId,
			seed: input.seed,
			familyId: family.id,
			rank,
			budget,
			affixes: affixes.map((affix) => affix.id),
			enemies,
		};
	}

	generatePacks(input: EncounterGenerationInput, count: number): GeneratedEnemyPack[] {
		return Array.from({ length: count }, (_, index) => this.generatePack({ ...input, packIndex: index }));
	}

	private getProfile(stageId: string): StageProcgenProfile {
		return this.catalog.profiles.find((profile) => profile.stageId === stageId) ?? this.catalog.profiles[0] as StageProcgenProfile;
	}

	private getFamily(familyId: string): EnemyFamilyTemplate {
		return this.catalog.families.find((family) => family.id === familyId) ?? this.catalog.families[0] as EnemyFamilyTemplate;
	}

	private getBudget(
		profile: StageProcgenProfile,
		rank: PackRank,
		orbitHeat: number,
		gameplayHooks: readonly string[]
	): number {
		const rankBonus: Partial<Record<PackRank, number>> = { champion: 2, elite: 4, unique: 6, boss_support: 3 };
		const hookBonus = gameplayHooks.includes('companion_assist_delay') ? 1 : 0;
		return profile.basePackBudget + Math.floor(Math.max(0, orbitHeat) / 2) + (rankBonus[rank] ?? 0) + hookBonus;
	}

	private pickAffixes(
		family: EnemyFamilyTemplate,
		rank: PackRank,
		rng: SeededRng
	): EnemyAffixTemplate[] {
		const countByRank: Partial<Record<PackRank, number>> = { champion: 1, elite: 2, unique: 2, boss_support: 1 };
		const affixCount = countByRank[rank] ?? 0;
		const familyRoles = new Set(family.units.map((unit) => unit.role));
		const candidates = this.catalog.affixes.filter((affix) =>
			affix.allowedRoles.some((role) => familyRoles.has(role))
		);
		const picked: EnemyAffixTemplate[] = [];
		for (let attempts = 0; picked.length < affixCount && attempts < 20; attempts++) {
			const candidate = candidates[rng.int(candidates.length)];
			if (!candidate) continue;
			if (picked.some((affix) => affix.id === candidate.id)) continue;
			if (picked.some((affix) => affix.forbiddenWith.includes(candidate.id) || candidate.forbiddenWith.includes(affix.id))) continue;
			picked.push(candidate);
		}
		return picked;
	}

	private buildEnemies(
		family: EnemyFamilyTemplate,
		affixes: EnemyAffixTemplate[],
		budget: number,
		rng: SeededRng,
		packIndex: number
	): CombatEntity[] {
		const enemies: CombatEntity[] = [];
		let remaining = budget;
		let safety = 0;
		while (remaining > 0 && safety < 12) {
			safety++;
			const affordable = family.units.filter((unit) => unit.cost <= remaining);
			const unit = affordable[rng.int(affordable.length)] ?? family.units[0];
			if (!unit) break;
			remaining -= unit.cost;
			enemies.push(this.materializeEnemy(unit, affixes, enemies.length, packIndex));
		}
		return enemies;
	}

	private materializeEnemy(
		unit: EnemyUnitTemplate,
		affixes: EnemyAffixTemplate[],
		index: number,
		packIndex: number
	): CombatEntity {
		const hpBonus = affixes.some((affix) => affix.id === 'debt_shield') ? 1 : 0;
		const speedBonus = affixes.some((affix) => affix.id === 'fast_route') ? 18 : 0;
		return {
			x: 640 + packIndex * 180 + index * 42,
			y: 462,
			w: 34,
			h: 32,
			vx: -(unit.speed + speedBonus),
			vy: 0,
			dir: -1,
			onGround: true,
			coyoteLeft: 0,
			jumpBuffered: 0,
			hp: unit.hp + hpBonus,
			maxHp: unit.hp + hpBonus,
			stun: 0,
			invuln: affixes.some((affix) => affix.id === 'mirror_counter') ? 0.05 : 0,
			procgenFamily: unit.id,
			procgenRole: unit.role,
			procgenAffixes: affixes.map((affix) => affix.id),
		};
	}
}

function weightedPick(weights: Record<string, number> | Partial<Record<string, number>>, rng: SeededRng): string {
	const entries = Object.entries(weights).filter((entry): entry is [string, number] => typeof entry[1] === 'number' && entry[1] > 0);
	const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
	let cursor = rng.next() * total;
	for (const [id, weight] of entries) {
		cursor -= weight;
		if (cursor <= 0) return id;
	}
	return entries[0]?.[0] ?? 'normal';
}

function hashSeed(seed: string): number {
	let hash = 2166136261;
	for (const char of seed) {
		hash ^= char.charCodeAt(0);
		hash = Math.imul(hash, 16777619);
	}
	return hash >>> 0;
}
