export type DamageType = 'slash' | 'blunt' | 'pierce' | 'burn' | 'shock' | 'acid' | 'true';

export interface DamagePacket {
	amount: number;
	type: DamageType;
	crit?: boolean;
	critMultiplier?: number;
	armorPierce?: number;
	variance?: number;
}

export interface DefenseProfile {
	armor: number;
	resistances?: Partial<Record<DamageType, number>>;
	vulnerabilities?: Partial<Record<DamageType, number>>;
	guardMultiplier?: number;
}

export interface DamageResolution {
	base: number;
	afterCrit: number;
	afterArmor: number;
	afterResistance: number;
	final: number;
	blocked: number;
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

export function resolveDamagePacket(packet: DamagePacket, defense: DefenseProfile): DamageResolution {
	if (!Number.isFinite(packet.amount) || packet.amount < 0) throw new Error(`Invalid damage amount: ${packet.amount}`);
	const base = packet.amount;
	const afterCrit = packet.crit ? base * (packet.critMultiplier ?? 1.5) : base;
	const effectiveArmor = packet.type === 'true' ? 0 : Math.max(0, defense.armor - (packet.armorPierce ?? 0));
	const afterArmor = Math.max(0, afterCrit - effectiveArmor);
	const resistance = clamp(defense.resistances?.[packet.type] ?? 0, -1, 0.95);
	const vulnerability = Math.max(0, defense.vulnerabilities?.[packet.type] ?? 0);
	const afterResistance = afterArmor * (1 - resistance + vulnerability);
	const guarded = afterResistance * (defense.guardMultiplier ?? 1);
	const final = Number(guarded.toFixed(6));
	return {
		base,
		afterCrit: Number(afterCrit.toFixed(6)),
		afterArmor: Number(afterArmor.toFixed(6)),
		afterResistance: Number(afterResistance.toFixed(6)),
		final,
		blocked: Number(Math.max(0, afterCrit - final).toFixed(6)),
	};
}

export function combineDamagePackets(packets: readonly DamagePacket[], defense: DefenseProfile): DamageResolution {
	const parts = packets.map((packet) => resolveDamagePacket(packet, defense));
	return {
		base: Number(parts.reduce((sum, part) => sum + part.base, 0).toFixed(6)),
		afterCrit: Number(parts.reduce((sum, part) => sum + part.afterCrit, 0).toFixed(6)),
		afterArmor: Number(parts.reduce((sum, part) => sum + part.afterArmor, 0).toFixed(6)),
		afterResistance: Number(parts.reduce((sum, part) => sum + part.afterResistance, 0).toFixed(6)),
		final: Number(parts.reduce((sum, part) => sum + part.final, 0).toFixed(6)),
		blocked: Number(parts.reduce((sum, part) => sum + part.blocked, 0).toFixed(6)),
	};
}
