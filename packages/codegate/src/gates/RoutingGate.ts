import type { MiniGameSpec, MiniGameResult } from '../types';

export interface RoutingGateConfig {
	nodes: Array<{ id: string; x: number; y: number }>;
	connections: Array<{ from: string; to: string }>;
	start: string;
	end: string;
}

export function createRoutingGate(spec: MiniGameSpec, config: RoutingGateConfig) {
	return {
		validate(input: string): MiniGameResult | null {
			// Check if input is a valid path from start to end
			const path = input.split('->');
			if (path[0] === config.start && path[path.length - 1] === config.end) {
				return { outcome: 'clean', heatDelta: -1, rewardTags: spec.rewardTags, timeMs: 0 };
			}
			return null;
		},
	};
}
