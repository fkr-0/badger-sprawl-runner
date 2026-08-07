import { createPlayer, type Player } from '../actors/MossBadger';
import { CombatSystem } from './CombatSystem';
import type { ActionMap } from './InputSystem';
import { PhysicsSystem, type Platform } from './PhysicsSystem';

export type LocomotionGoldenScenario =
	| 'run-brake'
	| 'held-jump'
	| 'coyote-jump'
	| 'fast-fall'
	| 'ground-dodge';

export interface LocomotionTraceSample {
	frame: number;
	x: number;
	y: number;
	vx: number;
	vy: number;
	onGround: boolean;
	nearApex: boolean;
	isDodging: boolean;
}

export interface LocomotionGoldenTrace {
	scenario: LocomotionGoldenScenario;
	fixedDt: number;
	frames: number;
	minimumY: number;
	maximumX: number;
	apexFrame: number | null;
	landingFrame: number | null;
	end: Omit<LocomotionTraceSample, 'frame'>;
	samples: LocomotionTraceSample[];
}

const FIXED_DT = 1 / 60;
const FRAME_COUNT = 120;
const SAMPLE_FRAMES = new Set([0, 15, 30, 45, 60, 90, 119]);
const FLOOR: Platform = { x: 0, y: 466, w: 2400, h: 90 };

export function runLocomotionGoldenTrace(
	scenario: LocomotionGoldenScenario
): LocomotionGoldenTrace {
	const player = createTracePlayer(scenario);
	const physics = new PhysicsSystem();
	const combat = new CombatSystem();
	const platforms = scenario === 'coyote-jump' ? [{ ...FLOOR, x: 160 }] : [FLOOR];
	const samples: LocomotionTraceSample[] = [];
	let minimumY = player.y;
	let maximumX = player.x;
	let apexFrame: number | null = null;
	let landingFrame: number | null = null;
	let previousVy = player.vy;
	let airborne = !player.onGround;

	for (let frame = 0; frame < FRAME_COUNT; frame += 1) {
		const action = actionForScenario(scenario, frame);
		physics.step(player, platforms, action, FIXED_DT);
		combat.step(player, [], action, FIXED_DT, undefined, { time: frame * FIXED_DT });
		minimumY = Math.min(minimumY, player.y);
		maximumX = Math.max(maximumX, player.x);
		if (apexFrame === null && !player.onGround && previousVy < 0 && player.vy >= 0) {
			apexFrame = frame;
		}
		if (!player.onGround) airborne = true;
		if (landingFrame === null && airborne && player.justLanded) landingFrame = frame;
		previousVy = player.vy;
		if (SAMPLE_FRAMES.has(frame)) samples.push(sample(frame, player));
	}

	const end = sample(FRAME_COUNT - 1, player);
	const { frame: _frame, ...endWithoutFrame } = end;
	return {
		scenario,
		fixedDt: round(FIXED_DT),
		frames: FRAME_COUNT,
		minimumY: round(minimumY),
		maximumX: round(maximumX),
		apexFrame,
		landingFrame,
		end: endWithoutFrame,
		samples,
	};
}

export function buildLocomotionGoldenCorpus(): Record<
	LocomotionGoldenScenario,
	LocomotionGoldenTrace
> {
	return {
		'run-brake': runLocomotionGoldenTrace('run-brake'),
		'held-jump': runLocomotionGoldenTrace('held-jump'),
		'coyote-jump': runLocomotionGoldenTrace('coyote-jump'),
		'fast-fall': runLocomotionGoldenTrace('fast-fall'),
		'ground-dodge': runLocomotionGoldenTrace('ground-dodge'),
	};
}

function createTracePlayer(scenario: LocomotionGoldenScenario): Player {
	const player = createPlayer();
	player.x = 80;
	player.y = FLOOR.y - player.h;
	player.onGround = scenario !== 'coyote-jump';
	player.coyoteLeft = scenario === 'coyote-jump' ? 0.08 : 0;
	if (scenario === 'coyote-jump') {
		player.y = 410;
		player.vx = 130;
		player.vy = 18;
	}
	return player;
}

function actionForScenario(scenario: LocomotionGoldenScenario, frame: number): ActionMap {
	const action = emptyAction();
	switch (scenario) {
		case 'run-brake':
			action.moveRight = frame < 60;
			break;
		case 'held-jump':
			action.jumpPressed = frame === 0;
			action.jump = frame <= 27;
			break;
		case 'coyote-jump':
			action.moveRight = true;
			action.jumpPressed = frame === 2;
			action.jump = frame >= 2 && frame <= 27;
			break;
		case 'fast-fall':
			action.jumpPressed = frame === 0;
			action.jump = frame <= 23;
			action.fastFall = frame >= 30;
			break;
		case 'ground-dodge':
			action.moveRight = frame < 18;
			action.dodgePressed = frame === 18;
			action.dodge = frame >= 18 && frame <= 32;
			break;
	}
	return action;
}

function emptyAction(): ActionMap {
	return {
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
	};
}

function sample(frame: number, player: Player): LocomotionTraceSample {
	return {
		frame,
		x: round(player.x),
		y: round(player.y),
		vx: round(player.vx),
		vy: round(player.vy),
		onGround: player.onGround,
		nearApex: player.nearApex ?? false,
		isDodging: player.isDodging ?? false,
	};
}

function round(value: number): number {
	return Math.round(value * 1000) / 1000;
}
