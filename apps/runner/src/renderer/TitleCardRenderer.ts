/**
 * TitleCardRenderer - Brechtian title/placard scenes
 */

export class TitleCardRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    title: string,
    subtitle?: string,
    progress = 0
  ): void {
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;

    // Dark overlay
    ctx.fillStyle = `rgba(0, 0, 0, ${0.85 - progress * 0.35})`;
    ctx.fillRect(0, 0, W, H);

    // Text box
    ctx.save();
    ctx.translate(W / 2, H / 2);

    // Title
    ctx.fillStyle = '#eaf2ff';
    ctx.font = 'bold 48px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Wrap title to fit width
    const maxWidth = W - 200;
    const lines = this.wrapText(title, maxWidth, ctx);

    const lineHeight = 56;
    const totalHeight = lines.length * lineHeight + (subtitle ? 40 : 0);

    let y = -totalHeight / 2;
    for (const line of lines) {
      ctx.fillText(line, 0, y);
      y += lineHeight;
    }

    // Subtitle
    if (subtitle) {
      ctx.fillStyle = '#92a4be';
      ctx.font = '24px ui-monospace, monospace';
      ctx.fillText(subtitle, 0, y + 30);
    }

    // World title (small, below)
    if (progress > 0) {
      ctx.fillStyle = '#67f3c4';
      ctx.font = '16px ui-monospace, monospace';
      ctx.fillText(`WORLD ${Math.floor(progress * 8) + 1}`, 0, y + 70);
    }

    ctx.restore();
  }

  private wrapText(text: string, maxWidth: number, ctx: CanvasRenderingContext2D): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      const metrics = ctx.measureText(test);

      if (metrics.width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }

    if (current) lines.push(current);
    return lines;
  }
}
