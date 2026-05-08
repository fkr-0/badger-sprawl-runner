/**
 * @badger/codegate -- Extractable minigame engine
 * Exports: core game factory, types, all gate kinds, renderers
 */

export { createCodeGate } from './core';
export type {
	MiniGameSpec,
	MiniGameResult,
	MiniGameEvent,
	GateState,
	CodeGateInstance,
	GateKind,
} from './types';

export { createFastTypeGate } from './gates/FastTypeGate';
export { createCommandRepairGate } from './gates/CommandRepairGate';
export { createRegexMatchGate } from './gates/RegexMatchGate';
export { createRoutingGate } from './gates/RoutingGate';
export { createBytecodeOrderGate } from './gates/BytecodeOrderGate';
export { createMicroCodeGate } from './gates/MicroCodeGate';

export { drawCodeGate } from './render-canvas';
export { updateCodeGateDom } from './render-dom';
