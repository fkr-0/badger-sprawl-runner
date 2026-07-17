import type { Renderer } from '../renderer/Renderer';
/**
 * SkillTreeScene - tabbed, branched four-discipline progression screen.
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
	{
		id: 'clawline',
		label: 'CLAW COMBAT',
		longLabel: 'HAND-TO-HAND / CLAW',
		description: 'Parry // pressure // finishers',
		accent: '#ff5e7a',
	},
	{
		id: 'railgun',
		label: 'BALLISTICS',
		longLabel: 'BALLISTICS',
		description: 'Handling // ordnance // sightlines',
		accent: '#67f3c4',
	},
	{
		id: 'rocket',
		label: 'GHOSTSTEP',
		longLabel: 'STEALTH / CLIMB / ACROBATICS',
		description: 'Climbing // stealth // aerial routes',
		accent: '#ffb35e',
	},
	{
		id: 'hacking',
		label: 'HACKING',
		longLabel: 'HACKING',
		description: 'Infiltration // control // root',
		accent: '#8f68ff',
	},
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
				rank: 0,
				maxRank: 1,
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
		skillRanks: Record<string, number>;
		skills: SkillNode[];
		trackProgress: Record<TrackId, number>;
		trackTotals: Record<TrackId, number>;
		message: string;
	} {
		const selected = this.getSelectedSkill();
		const meta = this.flow.getMeta();
		return {
			selectedSkillId: selected.id,
			selectedTrack: selected.track ?? 'clawline',
			selectedTier: selected.tier ?? 1,
			blueprintShards: meta.blueprintShards,
			purchasedSkills: this.getPurchasedSkills(),
			skillRanks: { ...(meta.skillRanks ?? {}) },
			skills: this.getSkills(),
			trackProgress: this.getTrackProgress(),
			trackTotals: this.getTrackTotals(),
			message: this.message,
		};
	}

	onEnter(_ctx: SceneContext): void {
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
			const rank = result.node.rank ?? 1;
			const maxRank = result.node.maxRank ?? 1;
			this.message =
				maxRank > 1 ? `${result.node.name} rank ${rank}/${maxRank}` : `${result.node.name} unlocked`;
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
		const selected = this.getSelectedSkill();
		const meta = this.flow.getMeta();
		const activeTrack =
			TRACKS.find((track) => track.id === selected.track) ?? TRACKS[0];
		const activeSkills = this.getTrackSkills(activeTrack.id);

		ctx.save();
		ctx.fillStyle = '#0b1020';
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		this.renderBackdropGrid(ctx);

		ctx.fillStyle = '#eaf2ff';
		ctx.font = '700 24px ui-monospace, monospace';
		ctx.textAlign = 'left';
		ctx.fillText('BADGER DISCIPLINES', 30, 38);
		ctx.font = '11px ui-monospace, monospace';
		ctx.fillStyle = '#92a4be';
		ctx.fillText('48 NODE GRAPH // BRANCHED PREREQUISITES // MULTI-RANK PASSIVES', 30, 58);
		ctx.textAlign = 'right';
		ctx.fillStyle = '#ffb35e';
		ctx.font = '700 14px ui-monospace, monospace';
		ctx.fillText(`BLUEPRINT SHARDS ${meta.blueprintShards}`, ctx.canvas.width - 30, 42);

		this.renderTrackTabs(ctx, activeTrack.id);
		this.renderTree(ctx, spriteRenderer, activeSkills, activeTrack);
		this.renderSelectedDetail(ctx, selected, activeTrack);
		ctx.restore();
	}

	private getTrackSkills(track: TrackId): SkillNode[] {
		return this.getSkills()
			.filter((skill) => skill.track === track)
			.sort(
				(a, b) =>
					(a.tier ?? 0) - (b.tier ?? 0) ||
					(a.column ?? 1) - (b.column ?? 1) ||
					a.name.localeCompare(b.name)
			);
	}

	private moveGrid(trackDelta: number, nodeDelta: number): void {
		const selected = this.getSelectedSkill();
		const currentTrack = Math.max(0, TRACKS.findIndex((track) => track.id === selected.track));
		if (trackDelta !== 0) {
			const nextTrack = (currentTrack + trackDelta + TRACKS.length) % TRACKS.length;
			const candidates = this.getTrackSkills(TRACKS[nextTrack]?.id ?? 'clawline');
			const target =
				candidates.find(
					(skill) =>
						skill.tier === selected.tier && (skill.column ?? 1) === (selected.column ?? 1)
				) ??
				candidates.find((skill) => skill.tier === selected.tier) ??
				candidates[0];
			this.selectSkill(target?.id);
			return;
		}
		const candidates = this.getTrackSkills(TRACKS[currentTrack]?.id ?? 'clawline');
		const localIndex = Math.max(0, candidates.findIndex((skill) => skill.id === selected.id));
		const target = candidates[(localIndex + nodeDelta + candidates.length) % candidates.length];
		this.selectSkill(target?.id);
	}

	private selectSkill(skillId: string | undefined): void {
		if (!skillId) return;
		const index = this.getSkills().findIndex((skill) => skill.id === skillId);
		if (index >= 0) this.selectedIndex = index;
	}

	private renderTrackTabs(ctx: CanvasRenderingContext2D, activeTrack: TrackId): void {
		const left = 30;
		const top = 76;
		const gap = 8;
		const width = (ctx.canvas.width - 60 - gap * 3) / 4;
		const progress = this.getTrackProgress();
		const totals = this.getTrackTotals();
		for (const [index, track] of TRACKS.entries()) {
			const x = left + index * (width + gap);
			const active = track.id === activeTrack;
			ctx.fillStyle = active ? 'rgba(255,255,255,0.08)' : 'rgba(4,6,12,0.78)';
			ctx.fillRect(x, top, width, 45);
			ctx.strokeStyle = active ? track.accent : '#293348';
			ctx.lineWidth = active ? 2 : 1;
			ctx.strokeRect(x, top, width, 45);
			ctx.textAlign = 'left';
			ctx.font = '700 11px ui-monospace, monospace';
			ctx.fillStyle = active ? track.accent : '#eaf2ff';
			ctx.fillText(track.label, x + 10, top + 18);
			ctx.font = '9px ui-monospace, monospace';
			ctx.fillStyle = '#92a4be';
			ctx.fillText(`${progress[track.id]}/${totals[track.id]} RANKS`, x + 10, top + 34);
		}
	}

	private renderTree(
		ctx: CanvasRenderingContext2D,
		spriteRenderer: ReturnType<Renderer['getSpriteRenderer']> | undefined,
		skills: SkillNode[],
		track: (typeof TRACKS)[number]
	): void {
		const area = { x: 30, y: 138, width: Math.min(610, ctx.canvas.width * 0.65), height: 322 };
		ctx.fillStyle = 'rgba(4, 6, 12, 0.58)';
		ctx.fillRect(area.x, area.y, area.width, area.height);
		ctx.strokeStyle = '#293348';
		ctx.strokeRect(area.x, area.y, area.width, area.height);
		ctx.textAlign = 'left';
		ctx.font = '700 13px ui-monospace, monospace';
		ctx.fillStyle = track.accent;
		ctx.fillText(track.longLabel, area.x + 14, area.y + 21);
		ctx.font = '9px ui-monospace, monospace';
		ctx.fillStyle = '#92a4be';
		ctx.fillText(track.description, area.x + 14, area.y + 37);

		const positions = new Map<string, { x: number; y: number }>();
		for (const skill of skills) {
			positions.set(skill.id, {
				x: area.x + 86 + (skill.column ?? 1) * ((area.width - 172) / 2),
				y: area.y + 65 + ((skill.tier ?? 1) - 1) * 57,
			});
		}

		for (const skill of skills) {
			const end = positions.get(skill.id);
			if (!end) continue;
			for (const prerequisite of skill.prereqs) {
				const start = positions.get(prerequisite);
				if (!start) continue;
				const live = this.getSkills().find((candidate) => candidate.id === prerequisite)?.unlocked;
				ctx.strokeStyle = live ? track.accent : '#293348';
				ctx.lineWidth = live ? 2 : 1;
				ctx.beginPath();
				ctx.moveTo(start.x, start.y + 18);
				ctx.lineTo(start.x, end.y - 25);
				ctx.lineTo(end.x, end.y - 25);
				ctx.lineTo(end.x, end.y - 18);
				ctx.stroke();
			}
		}

		for (const skill of skills) {
			const position = positions.get(skill.id);
			if (position) this.renderSkillNode(ctx, spriteRenderer, skill, track, position.x, position.y);
		}
	}

	private renderSkillNode(
		ctx: CanvasRenderingContext2D,
		spriteRenderer: ReturnType<Renderer['getSpriteRenderer']> | undefined,
		skill: SkillNode,
		track: (typeof TRACKS)[number],
		x: number,
		y: number
	): void {
		const selected = skill.id === this.getSelectedSkill().id;
		const canPurchase = this.canPurchase(skill);
		const rank = skill.rank ?? 0;
		const maxRank = skill.maxRank ?? 1;
		const width = 164;
		const height = 39;
		const left = x - width / 2;
		const top = y - height / 2;
		ctx.fillStyle = rank > 0
			? 'rgba(103, 243, 196, 0.13)'
			: selected
				? 'rgba(255, 179, 94, 0.15)'
				: 'rgba(4, 6, 12, 0.92)';
		ctx.fillRect(left, top, width, height);
		ctx.strokeStyle = selected ? '#ffb35e' : canPurchase ? track.accent : rank > 0 ? '#67f3c4' : '#293348';
		ctx.lineWidth = selected ? 2 : 1;
		ctx.strokeRect(left, top, width, height);

		const iconX = left + 4;
		const iconY = top + 3;
		if (spriteRenderer?.hasSheet(SKILL_ICON_SHEET_ID) && skill.iconAnimation) {
			spriteRenderer.drawFrame(SKILL_ICON_SHEET_ID, skill.iconAnimation, 0, iconX, iconY);
		} else {
			ctx.fillStyle = track.accent;
			ctx.fillRect(iconX, iconY, 32, 32);
			ctx.fillStyle = '#0b1020';
			ctx.font = '700 16px ui-monospace, monospace';
			ctx.textAlign = 'center';
			ctx.fillText(String(skill.tier ?? 1), iconX + 16, iconY + 22);
		}

		ctx.textAlign = 'left';
		ctx.font = '700 9px ui-monospace, monospace';
		ctx.fillStyle = rank > 0 ? '#67f3c4' : '#eaf2ff';
		ctx.fillText(skill.name.toUpperCase().slice(0, 19), iconX + 37, top + 15);
		ctx.font = '8px ui-monospace, monospace';
		ctx.fillStyle = canPurchase ? '#ffb35e' : '#92a4be';
		ctx.fillText(
			`T${skill.tier} // RANK ${rank}/${maxRank} // ${skill.cost}S`,
			iconX + 37,
			top + 29
		);
	}

	private renderSelectedDetail(
		ctx: CanvasRenderingContext2D,
		skill: SkillNode,
		track: (typeof TRACKS)[number]
	): void {
		const x = Math.min(660, ctx.canvas.width * 0.69);
		const y = 138;
		const width = ctx.canvas.width - x - 30;
		const height = 322;
		ctx.fillStyle = 'rgba(4, 6, 12, 0.92)';
		ctx.fillRect(x, y, width, height);
		ctx.strokeStyle = track.accent;
		ctx.strokeRect(x, y, width, height);
		ctx.textAlign = 'left';
		ctx.font = '700 16px ui-monospace, monospace';
		ctx.fillStyle = '#eaf2ff';
		ctx.fillText(skill.name.toUpperCase(), x + 16, y + 28);
		ctx.font = '9px ui-monospace, monospace';
		ctx.fillStyle = track.accent;
		ctx.fillText(
			`${String(skill.branch ?? 'core').toUpperCase()} // TIER ${skill.tier ?? 1} // RANK ${skill.rank ?? 0}/${skill.maxRank ?? 1}`,
			x + 16,
			y + 47
		);
		ctx.fillStyle = '#92a4be';
		this.drawWrappedText(ctx, skill.description ?? 'No field notes available.', x + 16, y + 76, width - 32, 15);
		ctx.fillStyle = '#ffb35e';
		this.drawWrappedText(ctx, this.describeEffects(skill), x + 16, y + 145, width - 32, 14);
		ctx.fillStyle = '#92a4be';
		const prereqs = skill.prereqs.length > 0 ? skill.prereqs.join(' + ') : 'ROOT ACCESS';
		this.drawWrappedText(ctx, `REQUIRES // ${prereqs}`, x + 16, y + 221, width - 32, 14);
		ctx.fillStyle = this.message.includes('unlocked') || this.message.includes('rank') ? '#67f3c4' : '#ff5e7a';
		this.drawWrappedText(ctx, this.message, x + 16, y + 267, width - 32, 14);
		ctx.fillStyle = '#92a4be';
		ctx.font = '8px ui-monospace, monospace';
		ctx.fillText('← → TREE   ↑ ↓ NODE   ENTER INVEST   ESC RETURN', x + 16, y + height - 14);
	}

	private drawWrappedText(
		ctx: CanvasRenderingContext2D,
		text: string,
		x: number,
		y: number,
		maxWidth: number,
		lineHeight: number
	): void {
		const words = text.split(/\s+/);
		let line = '';
		let lineIndex = 0;
		for (const word of words) {
			const test = line ? `${line} ${word}` : word;
			if (ctx.measureText(test).width > maxWidth && line) {
				ctx.fillText(line, x, y + lineIndex * lineHeight);
				line = word;
				lineIndex += 1;
			} else line = test;
		}
		if (line) ctx.fillText(line, x, y + lineIndex * lineHeight);
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
		return Object.fromEntries(
			TRACKS.map((track) => [
				track.id,
				this.getSkills()
					.filter((skill) => skill.track === track.id)
					.reduce((total, skill) => total + (skill.rank ?? 0), 0),
			])
		) as Record<TrackId, number>;
	}

	private getTrackTotals(): Record<TrackId, number> {
		return Object.fromEntries(
			TRACKS.map((track) => [
				track.id,
				this.getSkills()
					.filter((skill) => skill.track === track.id)
					.reduce((total, skill) => total + (skill.maxRank ?? 1), 0),
			])
		) as Record<TrackId, number>;
	}

	private canPurchase(skill: SkillNode): boolean {
		if ((skill.rank ?? 0) >= (skill.maxRank ?? 1)) return false;
		if (this.flow.getMeta().blueprintShards < skill.cost) return false;
		const purchased = new Set(this.getPurchasedSkills());
		return skill.prereqs.every((prerequisite) => purchased.has(prerequisite));
	}

	private describeEffects(skill: SkillNode): string {
		const effects = Object.entries(skill.effects ?? {}).map(
			([key, value]) => `${key} ${String(value)} / rank`
		);
		return effects.length > 0 ? effects.join(' // ') : 'Narrative unlock';
	}

	private describeFailure(reason: SkillPurchaseFailure): string {
		switch (reason) {
			case 'already-unlocked':
				return 'Maximum rank reached';
			case 'missing-prerequisite':
				return 'Missing prerequisite';
			case 'insufficient-shards':
				return 'Not enough blueprint shards';
			case 'unknown-skill':
				return 'Unknown skill';
		}
	}
}
