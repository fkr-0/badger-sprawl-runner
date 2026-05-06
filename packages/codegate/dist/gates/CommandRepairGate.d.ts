import type { MiniGameSpec, MiniGameResult } from '../types';
export interface CommandRepairGateConfig {
    brokenCommand: string;
    expectedFix: string;
    errorLocation: number;
}
export declare function createCommandRepairGate(spec: MiniGameSpec, config: CommandRepairGateConfig): {
    validate(input: string): MiniGameResult | null;
};
//# sourceMappingURL=CommandRepairGate.d.ts.map