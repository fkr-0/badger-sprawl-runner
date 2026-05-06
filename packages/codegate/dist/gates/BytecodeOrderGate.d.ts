import type { MiniGameSpec, MiniGameResult } from '../types';
export interface BytecodeOrderGateConfig {
    opcodes: Array<{
        name: string;
        order: number;
    }>;
}
export declare function createBytecodeOrderGate(spec: MiniGameSpec, config: BytecodeOrderGateConfig): {
    validate(input: string): MiniGameResult | null;
};
//# sourceMappingURL=BytecodeOrderGate.d.ts.map