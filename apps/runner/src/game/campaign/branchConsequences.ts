import type { BranchConsequence } from './schema';

export const BRANCH_CONSEQUENCES: BranchConsequence[] = [
	{
		resultFlag: 'lio_exposed',
		label: 'Broken Lio Trust',
		stageIds: ['dub-colony', 'antenna-barrens'],
		gameplayHook: 'companion_assist_delay',
		uiHint: 'Lio hesitates before assist calls; companion help is less immediate.',
	},
	{
		resultFlag: 'lio_protected',
		label: 'Protected Lio Trust',
		stageIds: ['dub-colony', 'antenna-barrens'],
		gameplayHook: 'companion_assist_ready',
		uiHint: 'Lio keeps channels warm; assist hints appear earlier.',
	},
	{
		resultFlag: 'lio_baited',
		label: 'Baited Betrayal',
		stageIds: ['antenna-barrens'],
		gameplayHook: 'ambush_warning_overlay',
		uiHint: 'Rook warns about ambush routing before signal gates.',
	},
	{
		resultFlag: 'colony_alignment_chorus',
		label: 'Chorus Alignment',
		stageIds: ['orbital-lift', 'asteroid-redoubt'],
		gameplayHook: 'naya_shield_bonus',
		uiHint: 'Naya shield starts fuller because the chorus shares charge.',
	},
	{
		resultFlag: 'colony_alignment_supplier',
		label: 'Supplier Alignment',
		stageIds: ['orbital-lift'],
		gameplayHook: 'shop_supply_discount',
		uiHint: 'Supplier routes reduce cargo shop prices but add heat.',
	},
	{
		resultFlag: 'ledger_public_dump',
		label: 'Public Ledger Dump',
		stageIds: ['orbital-lift', 'asteroid-redoubt'],
		gameplayHook: 'public_route_shortcut',
		uiHint: 'Public proof opens worker shortcuts through the lift.',
	},
	{
		resultFlag: 'cargo_full_release',
		label: 'Full Cargo Release',
		stageIds: ['asteroid-redoubt'],
		gameplayHook: 'finale_route_unlock',
		uiHint: 'Released cargo crews unlock safer finale routes.',
	},
	{
		resultFlag: 'broadcast_publish_tools',
		label: 'Publish Tools Doctrine',
		stageIds: ['asteroid-redoubt'],
		gameplayHook: 'final_broadcast_toolkit',
		uiHint: 'The finale prioritizes public toolkits over hero worship.',
	},
];
