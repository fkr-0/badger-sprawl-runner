import type { MiniGameSpec, MiniGameResult } from '../types';
export interface RoutingGateConfig {
    nodes: Array<{
        id: string;
        x: number;
        y: number;
    }>;
    connections: Array<{
        from: string;
        to: string;
    }>;
    start: string;
    end: string;
}
export declare function createRoutingGate(spec: MiniGameSpec, config: RoutingGateConfig): {
    validate(input: string): MiniGameResult | null;
};
//# sourceMappingURL=RoutingGate.d.ts.map