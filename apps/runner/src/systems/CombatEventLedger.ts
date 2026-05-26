import type { CombatEntity, CombatEvent } from './CombatSystem';

export interface CombatLedgerSummary {
	damageByTarget: Record<string, number>;
	kills: string[];
	comboMaxBySource: Record<string, number>;
	statusEvents: number;
	eventCount: number;
}

export function reduceCombatEvents(events: readonly CombatEvent[]): CombatLedgerSummary {
	const summary: CombatLedgerSummary = {
		damageByTarget: {},
		kills: [],
		comboMaxBySource: {},
		statusEvents: 0,
		eventCount: events.length,
	};

	for (const event of events) {
		const targetId = event.targetId ?? 'unknown';
		if (event.damage !== undefined) {
			summary.damageByTarget[targetId] = (summary.damageByTarget[targetId] ?? 0) + event.damage;
		}
		if (event.kind === 'kill') summary.kills.push(targetId);
		if (event.combo !== undefined) {
			const source = event.source ?? 'unknown';
			summary.comboMaxBySource[source] = Math.max(summary.comboMaxBySource[source] ?? 0, event.combo);
		}
		if (event.status) summary.statusEvents += 1;
	}

	summary.kills.sort();
	return summary;
}

export function applyCombatLedgerDamage<T extends CombatEntity>(entities: readonly T[], summary: CombatLedgerSummary): T[] {
	return entities.map((entity) => {
		const damage = summary.damageByTarget[entity.id ?? 'unknown'] ?? 0;
		return { ...entity, hp: Math.max(0, entity.hp - damage) };
	});
}

export function combatEventsToTimeline(events: readonly CombatEvent[]): Array<Pick<CombatEvent, 'kind' | 'source' | 'targetId' | 'damage' | 'combo' | 'time' | 'moveId'>> {
	return [...events]
		.sort((a, b) => (a.time ?? 0) - (b.time ?? 0) || a.kind.localeCompare(b.kind) || (a.moveId ?? '').localeCompare(b.moveId ?? ''))
		.map((event) => ({
			kind: event.kind,
			source: event.source,
			targetId: event.targetId,
			damage: event.damage,
			combo: event.combo,
			time: event.time,
			moveId: event.moveId,
		}));
}
