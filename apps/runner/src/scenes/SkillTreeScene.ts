import type { Renderer } from '../renderer/Renderer';
/**
 * SkillTreeScene - four-track progression graph with five meaningful tiers per discipline.
 */

import type { Scene, SceneContext } from '../engine/SceneManager';
import {
	type GameFlow,
	type SkillNode,
	type SkillPurchaseFailure,
	createGameFlow,
} from '../game/GameFlow';
import type { AutosaveFeedback, AutosaveReason } from '../storage/AutosaveFeedback';

const SKILL_ICON_SHEET_ID = 'skill_icons';
const TRACKS = [
	{ id: 'clawline', label: 'CLAWLINE', accent: '#ff5e7a' },
	{ id: 'railgun', label: 'RAILGUN', accent: '#67f3c4' },
	{ id: 'rocket', label: 'ROCKET', accent: '#ffb35e' },
	{ id: 'hacking', label: 'HACKING', accent: '#8f68ff' },
] as const;

type TrackId = (typeof TRACKS)[number]['id'];

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
		selectedTrack: string;
		selectedTier: number;
		blueprintShards: number;
		purchasedSkills: string[];
		skills: SkillNode[];
		trackProgress: Record<TrackId, number>;
		message: string;
	} {
		const selected = this.getSelectedSkill();
		return {
			selectedSkillId: selected.id,
			selectedTrack: selected.track ?? 'clawline',
			selectedTier: selected.tier ?? 1,
			blueprintShards: this.flow.getMeta().blueprintShards,
			purchasedSkills: this.getPurchasedSkills(),
			skills: this.getSkills(),
			trackProgress: this.getTrackProgress(),
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
			if (event.code === 'ArrowLeft') {
				this.moveGrid(-1, 0);
				event.preventDefault();
			}
			if (event.code === 'ArrowRight') {
				this.moveGrid(1, 0);
				event.preventDefault();
			}
			if (event.code === 'ArrowUp') {
				this.moveGrid(0, -1);
				event.preventDefault();
			}
			if (event.code === 'ArrowDown') {
				this.moveGrid(0, 1);
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
			if (typeof window !== 'undefined') {
				window.dispatchEvent(
					new CustomEvent('badger:skill-purchased', {
						detail: { skill: result.node, meta: result.state, autosave: this.lastAutosaveFeedback },
					})
				);
			}
			return;
		}
		this.message = this.describeFailure(result.reason);
	}

	render(renderer: Renderer, _alpha: number): void {
		const maybeRenderer = renderer as {
			getContext?: () => CanvasRenderingContext2D;
			getSpriteRenderer?: () => ReturnType<Renderer['getSpriteRenderer']>;
		};
		const ctx = maybeRenderer.getContext?.();
		if (!ctx) return;
		const spriteRenderer = maybeRenderer.getSpriteRenderer?.();
		const skills = this.getSkills();
		const selected = this.getSelectedSkill();
		const meta = this.flow.getMeta();

		ctx.save();
		ctx.fillStyle = '#0b1020';
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		this.renderBackdropGrid(ctx);

		ctx.fillStyle = '#eaf2ff';
		ctx.font = '700 26px ui-monospace, monospace';
		ctx.textAlign = 'center';
		ctx.fillText('BADGER DISCIPLINES', ctx.canvas.width / 2, 46);
		ctx.font = '12px ui-monospace, monospace';
		ctx.fillStyle = '#92a4be';
		ctx.fillText('Four practices // five commitments each', ctx.canvas.width / 2, 67);
		ctx.fillStyle = '#ffb35e';
		ctx.font = '700 14px ui-monospace, monospace';
		ctx.fillText(`BLUEPRINT SHARDS ${meta.blueprintShards}`, ctx.canvas.width / 2, 91);

		const columnWidth = ctx.canvas.width / TRACKS.length;
		for (const [trackIndex, track] of TRACKS.entries()) {
			const x = trackIndex * columnWidth + columnWidth / 2;
			const trackSkills = skills
				.filter((skill) => skill.track === track.id)
				.sort((a, b) => (a.tier ?? 0) - (b.tier ?? 0));
			this.renderTrack(ctx, spriteRenderer, trackSkills, track, x, columnWidth);
		}

		this.renderSelectedDetail(ctx, selected);
		ctx.restore();
	}

	private moveGrid(trackDelta: number, tierDelta: number): void {
		const selected = this.getSelectedSkill();
		const currentTrack = Math.max(
			0,
			TRACKS.findIndex((track) => track.id === selected.track)
		);
		const currentTier = Math.max(1, selected.tier ?? 1);
		const nextTrack = (currentTrack + trackDelta + TRACKS.length) % TRACKS.length;
		const nextTier = ((currentTier - 1 + tierDelta + 5) % 5) + 1;
		const target = this.getSkills().find(
			(skill) => skill.track === TRACKS[nextTrack]?.id && skill.tier === nextTier
		);
		if (!target) return;
		const index = this.getSkills().findIndex((skill) => skill.id === target.id);
		if (index >= 0) this.selectedIndex = index;
	}

	private renderTrack(
		ctx: CanvasRenderingContext2D,
		spriteRenderer: ReturnType<Renderer['getSpriteRenderer']> | undefined,
		skills: SkillNode[],
		track: (typeof TRACKS)[number],
		x: number,
		columnWidth: number
	): void {
		ctx.textAlign = 'center';
		ctx.font = '700 13px ui-monospace, monospace';
		ctx.fillStyle = track.accent;
		ctx.fillText(track.label, x, 121);
		ctx.font = '10px ui-monospace, monospace';
		ctx.fillStyle = '#92a4be';
		ctx.fillText(`${skills.filter((skill) => skill.unlocked).length}/5`, x, 136);

		for (const [index, skill] of skills.entries()) {
			const nodeY = 154 + index * 55;
			if (index > 0) {
				ctx.strokeStyle = skills[index - 1]?.unlocked ? track.accent : '#293348';
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.moveTo(x, nodeY - 18);
				ctx.lineTo(x, nodeY - 9);
				ctx.stroke();
			}
			this.renderSkillNode(ctx, spriteRenderer, skill, track, x, nodeY, columnWidth);
		}
	}

	private renderSkillNode(
		ctx: CanvasRenderingContext2D,
		spriteRenderer: ReturnType<Renderer['getSpriteRenderer']> | undefined,
		skill: SkillNode,
		track: (typeof TRACKS)[number],
		x: number,
		y: number,
		columnWidth: number
	): void {
		const selected = skill.id === this.getSelectedSkill().id;
		const canPurchase = this.canPurchase(skill);
		const width = Math.min(205, columnWidth - 18);
		const left = x - width / 2;
		ctx.fillStyle = skill.unlocked
			? 'rgba(103, 243, 196, 0.13)'
			: selected
				? 'rgba(255, 179, 94, 0.15)'
				: 'rgba(4, 6, 12, 0.78)';
		ctx.fillRect(left, y - 9, width, 43);
		ctx.strokeStyle = skill.unlocked
			? '#67f3c4'
			: selected
				? '#ffb35e'
				: canPurchase
					? track.accent
					: '#293348';
		ctx.lineWidth = selected ? 2 : 1;
		ctx.strokeRect(left, y - 9, width, 43);

		const iconX = left + 7;
		const iconY = y - 4;
		if (spriteRenderer?.hasSheet(SKILL_ICON_SHEET_ID) && skill.iconAnimation) {
			spriteRenderer.drawFrame(SKILL_ICON_SHEET_ID, skill.iconAnimation, 0, iconX, iconY);
		} else {
			ctx.fillStyle = track.accent;
			ctx.fillRect(iconX, iconY, 32, 32);
		}

		ctx.textAlign = 'left';
		ctx.font = '700 10px ui-monospace, monospace';
		ctx.fillStyle = skill.unlocked ? '#67f3c4' : '#eaf2ff';
		ctx.fillText(skill.name.toUpperCase().slice(0, 20), iconX + 39, y + 7);
		ctx.font = '9px ui-monospace, monospace';
		ctx.fillStyle = canPurchase ? '#ffb35e' : '#92a4be';
		ctx.fillText(
			skill.unlocked
				? `T${skill.tier} // INSTALLED`
				: `T${skill.tier} // ${skill.cost} SHARD${skill.cost === 1 ? '' : 'S'}`,
			iconX + 39,
			y + 23
		);
	}

	private renderSelectedDetail(ctx: CanvasRenderingContext2D, skill: SkillNode): void {
		const y = ctx.canvas.height - 92;
		ctx.fillStyle = 'rgba(4, 6, 12, 0.94)';
		ctx.fillRect(24, y, ctx.canvas.width - 48, 68);
		ctx.strokeStyle = '#67f3c4';
		ctx.strokeRect(24, y, ctx.canvas.width - 48, 68);
		ctx.textAlign = 'left';
		ctx.font = '700 13px ui-monospace, monospace';
		ctx.fillStyle = '#eaf2ff';
		ctx.fillText(
			`${skill.name} // ${String(skill.track ?? 'unknown').toUpperCase()} TIER ${skill.tier ?? 1}`,
			38,
			y + 20
		);
		ctx.font = '11px ui-monospace, monospace';
		ctx.fillStyle = '#92a4be';
		ctx.fillText((skill.description ?? 'No field notes available.').slice(0, 106), 38, y + 39);
		ctx.fillStyle = '#ffb35e';
		ctx.fillText(this.describeEffects(skill).slice(0, 74), 38, y + 56);
		ctx.textAlign = 'right';
		ctx.fillStyle = this.message.includes('unlocked') ? '#67f3c4' : '#ff5e7a';
		ctx.fillText(this.message, ctx.canvas.width - 38, y + 20);
		ctx.fillStyle = '#92a4be';
		ctx.fillText('ARROWS NAVIGATE // ENTER INSTALL // ESC RETURN', ctx.canvas.width - 38, y + 56);
	}

	private renderBackdropGrid(ctx: CanvasRenderingContext2D): void {
		ctx.strokeStyle = 'rgba(103, 243, 196, 0.05)';
		ctx.lineWidth = 1;
		for (let x = 0; x < ctx.canvas.width; x += 32) {
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, ctx.canvas.height);
			ctx.stroke();
		}
		for (let y = 0; y < ctx.canvas.height; y += 32) {
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(ctx.canvas.width, y);
			ctx.stroke();
		}
	}

	private getTrackProgress(): Record<TrackId, number> {
		return {
			clawline: this.getSkills().filter((skill) => skill.track === 'clawline' && skill.unlocked)
				.length,
			railgun: this.getSkills().filter((skill) => skill.track === 'railgun' && skill.unlocked)
				.length,
			rocket: this.getSkills().filter((skill) => skill.track === 'rocket' && skill.unlocked).length,
			hacking: this.getSkills().filter((skill) => skill.track === 'hacking' && skill.unlocked)
				.length,
		};
	}

	private canPurchase(skill: SkillNode): boolean {
		if (skill.unlocked || this.flow.getMeta().blueprintShards < skill.cost) return false;
		const purchased = new Set(this.getPurchasedSkills());
		return skill.prereqs.every((prerequisite) => purchased.has(prerequisite));
	}

	private describeEffects(skill: SkillNode): string {
		const effects = Object.entries(skill.effects ?? {}).map(
			([key, value]) => `${key} ${String(value)}`
		);
		return effects.length > 0 ? effects.join(' // ') : 'Narrative unlock';
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
