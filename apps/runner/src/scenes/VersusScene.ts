import type { Scene, SceneContext } from '../engine/SceneManager';

export type VersusSide = 'player' | 'rival';

export interface VersusScore {
	playerScore: number;
	rivalScore: number;
	winScore: number;
	winner?: VersusSide;
	roundState: 'ready' | 'tagged' | 'match-over';
}

export interface VersusArenaConfig {
	id: 'duel-yard';
	width: number;
	spawnPoints: Record<VersusSide, { x: number; y: number }>;
	platforms: Array<{ x: number; y: number; w: number; h: number }>;
}

export const DUEL_YARD_ARENA: VersusArenaConfig = {
	id: 'duel-yard',
	width: 1400,
	spawnPoints: {
		player: { x: 260, y: 420 },
		rival: { x: 980, y: 420 },
	},
	platforms: [
		{ x: 0, y: 500, w: 1400, h: 80 },
		{ x: 380, y: 405, w: 180, h: 20 },
		{ x: 760, y: 405, w: 180, h: 20 },
	],
};

export interface VersusSceneOptions {
	onReturnToTitle?: () => void;
}

export class VersusScene implements Scene {
	readonly name = 'VersusScene';

	private score: VersusScore = {
		playerScore: 0,
		rivalScore: 0,
		winScore: 3,
		roundState: 'ready',
	};
	private keyHandler: ((event: KeyboardEvent) => void) | null = null;

	constructor(private readonly options: VersusSceneOptions = {}) {}

	getArena(): VersusArenaConfig {
		return structuredClone(DUEL_YARD_ARENA) as VersusArenaConfig;
	}

	getScore(): VersusScore {
		return { ...this.score };
	}

	scoreTag(side: VersusSide): VersusScore {
		if (this.score.roundState === 'match-over') return this.getScore();

		const playerScore = this.score.playerScore + (side === 'player' ? 1 : 0);
		const rivalScore = this.score.rivalScore + (side === 'rival' ? 1 : 0);
		const winner =
			playerScore >= this.score.winScore
				? 'player'
				: rivalScore >= this.score.winScore
					? 'rival'
					: undefined;

		this.score = {
			...this.score,
			playerScore,
			rivalScore,
			winner,
			roundState: winner ? 'match-over' : 'tagged',
		};
		return this.getScore();
	}

	resetRound(): void {
		if (this.score.roundState !== 'match-over') {
			this.score = { ...this.score, roundState: 'ready' };
		}
	}

	resetMatch(): void {
		this.score = { playerScore: 0, rivalScore: 0, winScore: 3, roundState: 'ready' };
	}

	onEnter(_ctx: SceneContext): void {
		console.log('VersusScene entered');
		const handleKeyDown = (event: KeyboardEvent): void => {
			if (event.code === 'Escape') {
				this.options.onReturnToTitle?.();
				event.preventDefault();
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		this.keyHandler = handleKeyDown;
	}
	onExit(): void {
		console.log('VersusScene exited');
		if (this.keyHandler) {
			window.removeEventListener('keydown', this.keyHandler);
			this.keyHandler = null;
		}
	}
	update(_dt: number): void {}

	render(renderer: unknown, _alpha: number): void {
		const maybeRenderer = renderer as { getContext?: () => CanvasRenderingContext2D };
		const ctx = maybeRenderer.getContext?.();
		if (!ctx) return;

		ctx.save();
		ctx.fillStyle = '#eaf2ff';
		ctx.font = '700 24px ui-monospace, monospace';
		ctx.textAlign = 'center';
		ctx.fillText(
			`VS ${this.score.playerScore}:${this.score.rivalScore} / first to ${this.score.winScore}`,
			ctx.canvas.width / 2,
			80
		);
		ctx.restore();
	}
}
