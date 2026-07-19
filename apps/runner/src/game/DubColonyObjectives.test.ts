import { describe, expect, it } from 'vitest';
import { createPlayer } from '../actors/MossBadger';
import type { ActionMap } from '../systems/InputSystem';
import {
	DUB_ALIGNMENT_WINDOWS_MS,
	DUB_COLONY_BPM,
	DUB_REACTOR_NODES,
	DUB_SPARE_PARTS,
	DUB_VOTE_CARDS,
	DubColonyObjectives,
} from './DubColonyObjectives';

const action = (overrides: Partial<ActionMap>): ActionMap => ({
	moveLeft: false,
	moveRight: false,
	jump: false,
	jumpPressed: false,
	fastFall: false,
	melee: false,
	meleePressed: false,
	shoot: false,
	shootPressed: false,
	item: false,
	itemPressed: false,
	parry: false,
	parryPressed: false,
	dodge: false,
	dodgePressed: false,
	hack: false,
	hackPressed: false,
	hackHeld: false,
	pause: false,
	pausePressed: false,
	debugToggle: false,
	...overrides,
});

function place(player: ReturnType<typeof createPlayer>, x: number, y: number): void {
	player.x = x - player.w / 2;
	player.y = y - player.h / 2;
}

describe('DubColonyObjectives', () => {
	it('projects the chorus vote into a wider beat window and a visible alignment', () => {
		const objectives = new DubColonyObjectives(['colony_alignment_chorus']);
		const snapshot = objectives.getSnapshot(createPlayer());
		expect(snapshot.alignment).toBe('chorus');
		expect(snapshot.bpm).toBe(DUB_COLONY_BPM);
		expect(snapshot.windowMs).toBe(DUB_ALIGNMENT_WINDOWS_MS.chorus);
		expect(snapshot.inBeatWindow).toBe(true);
	});

	it('keeps every colony branch in a distinct 86 BPM pocket', () => {
		const player = createPlayer();
		expect(new DubColonyObjectives(['colony_alignment_chorus']).getSnapshot(player).windowMs).toBe(185);
		expect(new DubColonyObjectives(['colony_alignment_supplier']).getSnapshot(player).windowMs).toBe(145);
		expect(new DubColonyObjectives(['colony_alignment_army']).getSnapshot(player).windowMs).toBe(115);
	});

	it('recovers spare parts and vote cards through authored interactions', () => {
		const objectives = new DubColonyObjectives();
		const player = createPlayer();
		for (const part of DUB_SPARE_PARTS) {
			place(player, part.x, part.y);
			objectives.observeAction(player, action({ hackPressed: true }));
		}
		for (const card of DUB_VOTE_CARDS) {
			place(player, card.x, card.y);
			objectives.observeAction(player, action({ hackPressed: true }));
		}
		expect(objectives.getSnapshot()).toMatchObject({
			partsComplete: true,
			voteCardsComplete: true,
		});
	});

	it('tunes all three reactor nodes on beat and completes the Naya shield lesson', () => {
		const objectives = new DubColonyObjectives(['colony_alignment_chorus']);
		const player = createPlayer();
		const actionByName = {
			jump: action({ jumpPressed: true }),
			parry: action({ parryPressed: true }),
			melee: action({ meleePressed: true }),
		};
		for (const node of DUB_REACTOR_NODES) {
			place(player, node.x, node.y);
			const events = objectives.observeAction(player, actionByName[node.expectedAction]);
			expect(events).toContainEqual({
				kind: 'reactor-node-tuned',
				id: node.id,
				action: node.expectedAction,
			});
		}
		expect(objectives.getSnapshot()).toMatchObject({
			reactorSynchronized: true,
			nayaTutorialComplete: true,
			beatStreak: 3,
		});
	});

	it('blocks beat progress while a jammer bat owns the rhythm channel', () => {
		const objectives = new DubColonyObjectives();
		const player = createPlayer();
		const node = DUB_REACTOR_NODES[0];
		place(player, node.x, node.y);
		objectives.jamRhythm(1.1);
		const events = objectives.observeAction(player, action({ jumpPressed: true }));
		expect(events).toContainEqual({ kind: 'beat-missed', id: node.id, action: 'jump' });
		expect(objectives.getSnapshot().lastGrade).toBe('jammed');
	});
});
