import type { StageMinigame } from './schema';

export const CAMPAIGN_MINIGAMES: Record<string, StageMinigame[]> = {
	'lower-sprawl': [
		{
			id: 'toll-gate-rhythm',
			title: 'Toll Gate Rhythm',
			kind: 'timing',
			objective: 'Tap the meter beat to open street tolls without paying rent sensors.',
			teaches: 'beat timing windows and visible machinery tempo',
			reward: 'temporary route safety and dubFavor+1 branch context',
		},
	],
	drainmarket: [
		{
			id: 'injury-ledger-triage',
			title: 'Injury Ledger Triage',
			kind: 'memory',
			objective: 'Match clinic invoices to patients before the price board reshuffles.',
			teaches: 'memory pressure under capitalist medicine UI noise',
			reward: 'shop consumable discount context',
		},
	],
	'chrome-arcology': [
		{
			id: 'elevator-seed-router',
			title: 'Elevator Seed Router',
			kind: 'routing',
			objective: 'Route elevator permissions through labor floors without touching luxury traps.',
			teaches: 'permission routing and owned-space traversal',
			reward: 'elevator_seed payload hint',
		},
	],
	'mirror-palace': [
		{
			id: 'banquet-etiquette-loop',
			title: 'Banquet Etiquette Loop',
			kind: 'memory',
			objective: 'Repeat the refusal sequence while mirrors lie about the safe response.',
			teaches: 'contract logic recognition under social pressure',
			reward: 'mirror_pass payload context',
		},
	],
	'dub-colony': [
		{
			id: 'bass-reactor-sync',
			title: 'Bass Reactor Sync',
			kind: 'timing',
			objective: 'Sync reactor valves to the chorus without silencing the colony bassline.',
			teaches: 'companion sync and beat-assisted shielding',
			reward: 'dubFavor+1 and bass reactor payload clarity',
		},
	],
	'antenna-barrens': [
		{
			id: 'ledger-codegate-surge',
			title: 'Ledger Codegate Surge',
			kind: 'codegate',
			objective: 'Repair pirate-radio commands before static masts burn the ledger shard.',
			teaches: 'fast command repair and Rook overlay reading',
			reward: 'debt_ledger_shard checksum shortcut',
		},
	],
	'orbital-lift': [
		{
			id: 'cargo-claim-routing',
			title: 'Cargo Claim Routing',
			kind: 'routing',
			objective: 'Swap container claims before the lift converts witnesses into freight.',
			teaches: 'route planning with irreversible cargo tags',
			reward: 'cargo_reversal_key payload branch context',
		},
	],
	'asteroid-redoubt': [
		{
			id: 'public-toolkit-broadcast',
			title: 'Public Toolkit Broadcast',
			kind: 'signal',
			objective: 'Tune transmitter roots until the final message teaches tools instead of heroes.',
			teaches: 'signal alignment and final doctrine framing',
			reward: 'asteroid_transmitter_root finale context',
		},
	],
};
