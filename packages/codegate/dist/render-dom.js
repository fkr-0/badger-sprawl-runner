export function updateCodeGateDom(el, state) {
    const isActive = state.phase === 'active';
    const className = isActive ? 'code-active' : '';
    let content = `<strong>Code gate</strong><br>`;
    content += `Type: <code>${state.prompt}</code><br>`;
    content += `<code>&gt; ${state.inputSoFar}</code><br>`;
    content += `${state.timeRemaining.toFixed(1)}s left · Enter submits · Backspace edits`;
    el.className = className;
    el.innerHTML = content;
}
//# sourceMappingURL=render-dom.js.map