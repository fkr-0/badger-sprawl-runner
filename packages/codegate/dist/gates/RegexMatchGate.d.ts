import type { MiniGameSpec, MiniGameResult } from '../types';
export interface RegexMatchGateConfig {
    target: string;
    patterns: Array<{
        pattern: string;
        correct: boolean;
    }>;
}
export declare function createRegexMatchGate(spec: MiniGameSpec, config: RegexMatchGateConfig): {
    validate(input: string): MiniGameResult | null;
};
//# sourceMappingURL=RegexMatchGate.d.ts.map