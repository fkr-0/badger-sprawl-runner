import type { MiniGameSpec, MiniGameResult } from '../types';
export interface FastTypeGateConfig {
    target: string;
}
export declare function createFastTypeGate(spec: MiniGameSpec, config: FastTypeGateConfig): {
    validate(input: string): MiniGameResult | null;
};
//# sourceMappingURL=FastTypeGate.d.ts.map