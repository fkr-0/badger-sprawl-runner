import type { Renderer } from '../renderer/Renderer';
/**
 * SkillTreeScene - lightweight skill route scene for the SceneManager shell.
 */

import type { Scene, SceneContext } from '../engine/SceneManager';

const SKILL_IDS = ['double_swipe', 'parry_tooth', 'rail_mastery'] as const;

type SkillId = (typeof SKILL_IDS)[number];

export interface SkillTreeSceneOptions {
	onReturnToTitle?: () => void;
}

export class SkillTreeScene implements Scene {
	readonly name = 'SkillTreeScene';

	private selectedIndex = 0;
	private purchased = new Set<SkillId>();
	private keyHandler: ((event: KeyboardEvent) => void) | null = null;

	constructor(private readonly options: SkillTreeSceneOptions = {}) {}

	getSelectedSkill(): SkillId {
		return SKILL_IDS[this.selectedIndex] ?? 'double_swipe';
	}

	getPurchasedSkills(): SkillId[] {
		return [...this.purchased];
	}

	onEnter(_ctx: SceneContext): void {
		console.log('SkillTreeScene entered');
		const handleKeyDown = (event: KeyboardEvent): void => {
			if (event.code === 'Escape') {
				this.options.onReturnToTitle?.();
				event.preventDefault();
				return;
			}
			if (event.code === 'ArrowUp') {
				this.moveSelection(-1);
				event.preventDefault();
			}
			if (event.code === 'ArrowDown') {
				this.moveSelection(1);
				event.preventDefault();
			}
			if (event.code === 'Enter' || event.code === 'Space') {
				this.purchaseSelectedSkill();
				event.preventDefault();
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		this.keyHandler = handleKeyDown;
	}

	onExit(): void {
		console.log('SkillTreeScene exited');
		if (this.keyHandler) {
			window.removeEventListener('keydown', this.keyHandler);
			this.keyHandler = null;
		}
	}

	update(_dt: number): void {}

	moveSelection(delta: number): void {
		this.selectedIndex = (this.selectedIndex + delta + SKILL_IDS.length) % SKILL_IDS.length;
	}

	purchaseSelectedSkill(): void {
		this.purchased.add(this.getSelectedSkill());
	}

	render(renderer: Renderer, _alpha: number): void {
		const maybeRenderer = renderer as { getContext?: () => CanvasRenderingContext2D };
		const ctx = maybeRenderer.getContext?.();
		if (!ctx) return;

		ctx.save();
		ctx.fillStyle = '#0b1020';
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.fillStyle = '#eaf2ff';
		ctx.font = '700 28px ui-monospace, monospace';
		ctx.textAlign = 'center';
		ctx.fillText('SKILL TREE', ctx.canvas.width / 2, 90);
		ctx.font = '16px ui-monospace, monospace';
		ctx.fillText(`selected: ${this.getSelectedSkill()}`, ctx.canvas.width / 2, 135);
		ctx.fillText(
			`purchased: ${this.getPurchasedSkills().join(', ') || 'none'}`,
			ctx.canvas.width / 2,
			170
		);
		ctx.restore();
	}
}
