import type { Renderer } from '../renderer/Renderer';
/**
 * SkillTreeScene - lightweight skill route scene for the SceneManager shell.
 */

import type { Scene, SceneContext } from '../engine/SceneManager';
import {
	type GameFlow,
	type SkillNode,
	type SkillPurchaseFailure,
	createGameFlow,
} from '../game/GameFlow';
import type { AutosaveFeedback, AutosaveReason } from '../storage/AutosaveFeedback';

export interface SkillTreeSceneOptions {
	flow?: GameFlow;
	onAutosave?: (reason: AutosaveReason) => AutosaveFeedback | undefined;
	onReturnToTitle?: () => void;
}

export class SkillTreeScene implements Scene {
	readonly name = 'SkillTreeScene';

	private selectedIndex = 0;
	private keyHandler: ((event: KeyboardEvent) => void) | null = null;
	private readonly flow: GameFlow;
	private message = '';
	private lastAutosaveFeedback: AutosaveFeedback | null = null;

	constructor(private readonly options: SkillTreeSceneOptions = {}) {
		this.flow = options.flow ?? createGameFlow();
	}

	getSelectedSkill(): SkillNode {
		return (
			this.getSkills()[this.selectedIndex] ??
			this.getSkills()[0] ?? {
				id: 'double_swipe',
				name: 'Double Swipe',
				cost: 1,
				prereqs: [],
				unlocked: false,
			}
		);
	}

	getPurchasedSkills(): string[] {
		return [...this.flow.getMeta().purchasedSkills];
	}

	getSkills(): SkillNode[] {
		return this.flow.getSkills();
	}

	getSnapshot(): {
		selectedSkillId: string;
		blueprintShards: number;
		purchasedSkills: string[];
		skills: SkillNode[];
		message: string;
	} {
		return {
			selectedSkillId: this.getSelectedSkill().id,
			blueprintShards: this.flow.getMeta().blueprintShards,
			purchasedSkills: this.getPurchasedSkills(),
			skills: this.getSkills(),
			message: this.message,
		};
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
		const count = this.getSkills().length;
		if (count === 0) return;
		this.selectedIndex = (this.selectedIndex + delta + count) % count;
	}

	purchaseSelectedSkill(): void {
		const selected = this.getSelectedSkill();
		const result = this.flow.purchaseSkill(selected.id);
		if (result.ok) {
			this.message = `${result.node.name} unlocked`;
			this.lastAutosaveFeedback = this.options.onAutosave?.('skill-purchase') ?? null;
			window.dispatchEvent(
				new CustomEvent('badger:skill-purchased', {
					detail: { skill: result.node, meta: result.state, autosave: this.lastAutosaveFeedback },
				})
			);
			return;
		}
		this.message = this.describeFailure(result.reason);
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
		const skills = this.getSkills();
		const meta = this.flow.getMeta();
		ctx.font = '16px ui-monospace, monospace';
		ctx.fillStyle = '#ffb35e';
		ctx.fillText(`Blueprint shards: ${meta.blueprintShards}`, ctx.canvas.width / 2, 132);
		ctx.textAlign = 'left';
		for (const [index, skill] of skills.entries()) {
			const y = 178 + index * 42;
			const selected = index === this.selectedIndex;
			ctx.fillStyle = skill.unlocked ? '#67f3c4' : selected ? '#ffb35e' : '#eaf2ff';
			ctx.fillText(
				`${selected ? '>' : ' '} ${skill.name} • ${skill.cost} shard${skill.cost === 1 ? '' : 's'}${skill.unlocked ? ' • UNLOCKED' : ''}`,
				ctx.canvas.width / 2 - 250,
				y
			);
			ctx.fillStyle = '#92a4be';
			ctx.font = '12px ui-monospace, monospace';
			ctx.fillText(
				`prereqs: ${skill.prereqs.join(', ') || 'none'}`,
				ctx.canvas.width / 2 - 220,
				y + 17
			);
			ctx.font = '16px ui-monospace, monospace';
		}
		ctx.textAlign = 'center';
		ctx.fillStyle = this.message.includes('unlocked') ? '#67f3c4' : '#ff5e7a';
		ctx.fillText(this.message, ctx.canvas.width / 2, ctx.canvas.height - 66);
		ctx.fillStyle = '#92a4be';
		ctx.font = '12px ui-monospace, monospace';
		ctx.fillText(
			'↑/↓ select • Enter purchase • Esc return',
			ctx.canvas.width / 2,
			ctx.canvas.height - 34
		);
		ctx.restore();
	}

	private describeFailure(reason: SkillPurchaseFailure): string {
		switch (reason) {
			case 'already-unlocked':
				return 'Already unlocked';
			case 'missing-prerequisite':
				return 'Missing prerequisite';
			case 'insufficient-shards':
				return 'Not enough blueprint shards';
			case 'unknown-skill':
				return 'Unknown skill';
		}
	}
}
