import type { MiniGameSpec, MiniGameResult } from '../types';
export interface MicroCodeGateConfig {
    expectedExpression: string;
    input: number;
    output: number;
}
export declare function createMicroCodeGate(spec: MiniGameSpec, config: MicroCodeGateConfig): {
    validate(input: string): MiniGameResult | null;
};
//# sourceMappingURL=MicroCodeGate.d.ts.map