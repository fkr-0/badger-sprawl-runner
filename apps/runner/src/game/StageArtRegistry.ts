import type { RuntimeStageId } from '../world/stageLayoutRegistry';

export interface StagePlatformArt {
	sheetId: string;
	surfaceAnimation: string;
	bodyAnimation: string;
	decorations: readonly string[];
}

export const STAGE_PLATFORM_ART: Record<RuntimeStageId, StagePlatformArt> = {
	'lower-sprawl': {
		sheetId: 'lower_sprawl_tiles',
		surfaceAnimation: 'wet_asphalt',
		bodyAnimation: 'brick_tile',
		decorations: ['neon_sign', 'market_awning', 'cable_bundle'],
	},
	drainmarket: {
		sheetId: 'drainmarket_tiles',
		surfaceAnimation: 'clinic_floor',
		bodyAnimation: 'sump_brick',
		decorations: ['medicine_sign', 'vendor_tarp', 'hanging_tubes'],
	},
	'chrome-arcology': {
		sheetId: 'chrome_arcology_tiles',
		surfaceAnimation: 'chrome_floor',
		bodyAnimation: 'glass_lattice',
		decorations: ['ad_panel_loop', 'holo_ad_flicker', 'elevator_rail'],
	},
	'mirror-palace': {
		sheetId: 'straylight_mirage_tiles',
		surfaceAnimation: 'mirror_floor',
		bodyAnimation: 'luxury_column',
		decorations: ['false_door_glitch', 'holo_curtain', 'mirror_shard'],
	},
	'dub-colony': {
		sheetId: 'dub_colony_tiles',
		surfaceAnimation: 'speakerstone_paver',
		bodyAnimation: 'bass_cable_vine',
		decorations: ['speaker_stack', 'studio_rack', 'solar_sail_cloth'],
	},
	'antenna-barrens': {
		sheetId: 'antenna_barrens_tiles',
		surfaceAnimation: 'rust_plate',
		bodyAnimation: 'wire_bridge',
		decorations: ['static_mast_arc', 'satellite_dish', 'wind_flag_array'],
	},
	'orbital-lift': {
		sheetId: 'orbital_lift_tiles',
		surfaceAnimation: 'lift_grating',
		bodyAnimation: 'cargo_strap',
		decorations: ['warning_chevron_scroll', 'vacuum_door', 'counterweight_blink'],
	},
	'asteroid-redoubt': {
		sheetId: 'asteroid_redoubt_tiles',
		surfaceAnimation: 'asteroid_regolith_block',
		bodyAnimation: 'cargo_crate',
		decorations: ['transmitter_blink_loop', 'rebel_banner', 'pirate_radio_shrine'],
	},
};

export function getStagePlatformArt(stageId: RuntimeStageId): StagePlatformArt {
	return STAGE_PLATFORM_ART[stageId];
}
