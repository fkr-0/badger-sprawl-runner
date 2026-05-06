import type { GateState } from './types';

export function drawCodeGate(
  ctx: CanvasRenderingContext2D,
  state: GateState,
  canvasW: number,
  canvasH: number
): void {
  const panelH = canvasH * 0.33;
  const panelY = canvasH - panelH;

  // Draw terminal background
  ctx.fillStyle = 'rgba(4, 6, 12, 0.9)';
  ctx.fillRect(16, panelY + 8, canvasW - 32, panelH - 16);

  // Draw border
  ctx.strokeStyle = '#67f3c4';
  ctx.lineWidth = 2;
  ctx.strokeRect(16, panelY + 8, canvasW - 32, panelH - 16);

  // Draw prompt
  ctx.fillStyle = '#eaf2ff';
  ctx.font = '16px ui-monospace, monospace';
  ctx.fillText(state.prompt, 30, panelY + 35);

  // Draw input
  ctx.fillStyle = '#67f3c4';
  ctx.fillText(`> ${state.inputSoFar}`, 30, panelY + 60);

  // Draw time remaining
  const timeColor = state.timeRemaining < 3 ? '#ff5e7a' : '#92a4be';
  ctx.fillStyle = timeColor;
  ctx.fillText(`${state.timeRemaining.toFixed(1)}s`, canvasW - 80, panelY + 35);
}
