/**
 * DialogueScene - RPG dialogue with choices and flag writes
 */

import type { Scene } from '../engine/SceneManager';
import type { SceneContext } from '../engine/SceneManager';
import type { Renderer } from '../renderer/Renderer';

export interface DialogueLine {
	speaker: string;
	text: string;
	portrait?: string;
}

export interface DialogueChoice {
	text: string;
	flagWrites?: Record<string, boolean | string | number>;
	next?: string;
}

export interface DialogueSpec {
	id: string;
	lines: DialogueLine[];
	choices?: DialogueChoice[];
	onComplete?: () => void;
}

export class DialogueScene implements Scene {
	readonly name = 'DialogueScene';

	private spec: DialogueSpec | null = null;
	private keyHandler: ((e: KeyboardEvent) => void) | null = null;
	private lineIndex = 0;
	private charIndex = 0;
	private charTimer = 0;
	private pendingChoices: DialogueChoice[] | null = null;
	private renderer: Renderer | null = null;
	private typewriterSpeed = 35; // ms per character

	onEnter(ctx: SceneContext): void {
		console.log('DialogueScene entered');
		this.renderer = ctx.renderer as Renderer;

		const handleKeyDown = (e: KeyboardEvent): void => {
			if (e.code === 'Space' || e.code === 'Enter') {
				this.advance();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		this.keyHandler = handleKeyDown;
	}

	onExit(): void {
		if (this.keyHandler) {
			window.removeEventListener('keydown', this.keyHandler);
			this.keyHandler = null;
		}
		console.log('DialogueScene exited');
	}

	update(dt: number): void {
		if (!this.spec) return;

		// Typewriter effect
		const currentLine = this.spec.lines[this.lineIndex];
		if (this.charIndex < currentLine.text.length) {
			this.charTimer += dt * 1000;
			while (this.charTimer >= this.typewriterSpeed && this.charIndex < currentLine.text.length) {
				this.charIndex++;
				this.charTimer -= this.typewriterSpeed;
			}
		}
	}

	render(renderer: unknown, alpha: number): void {
		const rend = renderer as Renderer;
		const ctx = rend.getContext();

		// Dim background
		ctx.fillStyle = 'rgba(4, 6, 12, 0.7)';
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		if (!this.spec) return;

		this.renderDialogueBox(ctx);
	}

	private renderDialogueBox(ctx: CanvasRenderingContext2D): void {
		if (!this.spec) return;

		const W = ctx.canvas.width;
		const H = ctx.canvas.height;

		const boxY = H - 200;
		const boxH = 180;

		// Dialogue box background
		ctx.fillStyle = '#1a1d26';
		ctx.fillRect(50, boxY, W - 100, boxH);
		ctx.strokeStyle = '#67f3c4';
		ctx.lineWidth = 2;
		ctx.strokeRect(50, boxY, W - 100, boxH);

		// Current line
		const line = this.spec.lines[this.lineIndex];
		const displayText = line.text.substring(0, this.charIndex);

		// Speaker name
		ctx.fillStyle = '#ffb35e';
		ctx.font = 'bold 16px ui-monospace, monospace';
		ctx.textAlign = 'left';
		ctx.fillText(line.speaker, 70, boxY + 30);

		// Text
		ctx.fillStyle = '#eaf2ff';
		ctx.font = '18px ui-monospace, monospace';
		this.wrapText(ctx, displayText, 70, boxY + 60, W - 140);

		// Choices (if available)
		if (this.pendingChoices) {
			this.renderChoices(ctx, W, boxY);
		} else if (this.charIndex >= line.text.length) {
			// Continue indicator
			ctx.fillStyle = '#67f3c4';
			ctx.font = '14px ui-monospace, monospace';
			ctx.textAlign = 'right';
			ctx.fillText('▼ Press SPACE to continue', W - 70, boxY + boxH - 15);
		}
	}

	private renderChoices(ctx: CanvasRenderingContext2D, W: number, boxY: number): void {
		if (!this.pendingChoices) return;

		let y = boxY + 70;
		for (let i = 0; i < this.pendingChoices.length; i++) {
			const choice = this.pendingChoices[i];

			ctx.fillStyle = '#ffb35e';
			ctx.font = '16px ui-monospace, monospace';
			ctx.textAlign = 'left';
			ctx.fillText(`${i + 1}. ${choice.text}`, 90, y);

			y += 30;
		}
	}

	private wrapText(
		ctx: CanvasRenderingContext2D,
		text: string,
		x: number,
		y: number,
		maxWidth: number
	): void {
		const words = text.split(' ');
		let line = '';
		let lineY = y;

		for (const word of words) {
			const test = line ? `${line} ${word}` : word;
			const metrics = ctx.measureText(test);

			if (metrics.width > maxWidth && line) {
				ctx.fillText(line, x, lineY);
				line = word;
				lineY += 24;
			} else {
				line = test;
			}
		}

		if (line) {
			ctx.fillText(line, x, lineY);
		}
	}

	advance(): void {
		if (!this.spec) return;

		const line = this.spec.lines[this.lineIndex];

		// Skip typewriter effect
		if (this.charIndex < line.text.length) {
			this.charIndex = line.text.length;
			return;
		}

		// Show choices
		if (this.pendingChoices) {
			// First choice for now (would be keyboard selectable)
			const choice = this.pendingChoices[0];
			if (choice?.flagWrites) {
				console.log('Writing flags:', choice.flagWrites);
			}
			this.pendingChoices = null;
			this.close();
			return;
		}

		// Next line
		this.lineIndex++;
		this.charIndex = 0;

		if (this.lineIndex >= this.spec.lines.length) {
			// Show choices or close
			if (this.spec.choices && this.spec.choices.length > 0) {
				this.pendingChoices = this.spec.choices;
			} else {
				this.close();
			}
		}
	}

	startDialogue(spec: DialogueSpec): void {
		this.spec = spec;
		this.lineIndex = 0;
		this.charIndex = 0;
		this.charTimer = 0;
		this.pendingChoices = null;
	}

	close(): void {
		if (this.spec?.onComplete) {
			this.spec.onComplete();
		}
		this.spec = null;
	}

	isActive(): boolean {
		return this.spec !== null;
	}
}
