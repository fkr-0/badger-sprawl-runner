/**
 * DialogueSystem - RPG dialogue box state machine
 */

export interface DialogueLine {
	speaker: string;
	text: string;
	portrait?: string;
}

export interface DialogueChoice {
	text: string;
	flagWrites: Record<string, unknown>;
	next: string;
}

export interface DialogueSpec {
	id: string;
	lines: DialogueLine[];
	choices?: DialogueChoice[];
}

export class DialogueSystem {
	private spec: DialogueSpec | null = null;
	private lineIndex = 0;
	private charIndex = 0;
	private charTimer = 0;
	private pendingChoices: DialogueChoice[] = [];

	start(spec: DialogueSpec): void {
		this.spec = spec;
		this.lineIndex = 0;
		this.charIndex = 0;
		this.charTimer = 0;
		this.pendingChoices = spec.choices || [];
	}

	advance(): boolean {
		if (!this.spec) return false;

		const currentLine = this.spec.lines[this.lineIndex];
		if (this.charIndex < currentLine.text.length) {
			this.charIndex = currentLine.text.length; // Skip to end
			return true;
		}

		if (this.pendingChoices.length > 0) {
			return false; // Waiting for choice
		}

		this.lineIndex++;
		this.charIndex = 0;

		if (this.lineIndex >= this.spec.lines.length) {
			this.spec = null;
			return false;
		}

		return true;
	}

	makeChoice(choiceIndex: number): void {
		const choice = this.pendingChoices[choiceIndex];
		if (!choice) return;

		// Write flags
		for (const [key, value] of Object.entries(choice.flagWrites)) {
			// Would write to event bus or state manager
		}

		// Load next dialogue or end
		this.pendingChoices = [];
	}

	getCurrentText(): string {
		if (!this.spec) return '';
		const line = this.spec.lines[this.lineIndex];
		return line.text.substring(0, this.charIndex);
	}

	isActive(): boolean {
		return this.spec !== null;
	}

	getChoices(): DialogueChoice[] {
		return [...this.pendingChoices];
	}

	getSpeaker(): string {
		if (!this.spec) return '';
		return this.spec.lines[this.lineIndex]?.speaker || '';
	}
}
