import type { GateState } from './types';

export function updateCodeGateDom(el: HTMLElement, state: GateState): void {
	const isActive = state.phase === 'active';
	const className = isActive ? 'code-active' : '';

	let content = '<strong>Code gate</strong><br>';
	content += `Type: <code>${state.prompt}</code><br>`;
	content += `<code>&gt; ${state.inputSoFar}</code><br>`;
	content += `${state.timeRemaining.toFixed(1)}s left · Enter submits · Backspace edits`;

	el.className = className;
	el.innerHTML = content;
}
