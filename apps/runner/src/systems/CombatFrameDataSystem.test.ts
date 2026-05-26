import { describe, expect, it } from 'vitest';
import { canCancelInto, getCancelRoutes, markFrameActionHitResolved, startFrameAction, stepFrameAction, type AttackFrameData } from './CombatFrameDataSystem';

const claw: AttackFrameData = {
	id: 'claw_jab_frame',
	startup: 0.1,
	active: 0.08,
	recovery: 0.2,
	cancelInto: ['claw_cross'],
	attack: {
		id: 'claw_jab',
		source: 'player',
		damage: 1,
		damageType: 'slash',
		stun: 0.1,
		knockbackX: 20,
		hitbox: { x: 0, y: 0, w: 30, h: 20 },
	},
};

const routed: AttackFrameData = {
	...claw,
	id: 'jab_routed',
	requiresHitConfirm: true,
	onHitCancelInto: ['launcher', 'claw_cross'],
	onBlockCancelInto: ['guard_cancel'],
	onWhiffCancelInto: ['panic_roll'],
	cancelInto: [],
};

describe('CombatFrameDataSystem', () => {
	it('steps startup, active, recovery, and done phases deterministically', () => {
		let state = startFrameAction(claw);
		expect(state.phase).toBe('startup');

		let step = stepFrameAction(claw, state, 0.1);
		expect(step.becameActive).toBe(true);
		expect(step.state.phase).toBe('active');

		state = markFrameActionHitResolved(step.state);
		expect(state.hasResolvedHit).toBe(true);

		step = stepFrameAction(claw, state, 0.08);
		expect(step.state.phase).toBe('recovery');
		expect(step.canCancel).toBe(true);
		expect(canCancelInto(claw, step.state, 'claw_cross')).toBe(true);
		expect(canCancelInto(claw, step.state, 'launcher')).toBe(false);

		step = stepFrameAction(claw, step.state, 0.2);
		expect(step.finished).toBe(true);
		expect(step.state.phase).toBe('done');
	});

	it('supports instant active attacks with zero startup', () => {
		const state = startFrameAction({ ...claw, id: 'parry_counter', startup: 0 });
		expect(state.phase).toBe('active');
	});

	it('orders mixed legacy and outcome routes deterministically', () => {
		const frameData: AttackFrameData = {
			...claw,
			cancelInto: ['zeta', 'alpha'],
			onHitCancelInto: ['launcher', 'alpha'],
		};
		const state = markFrameActionHitResolved({ ...startFrameAction(frameData), elapsed: 0.19, phase: 'recovery' }, 'hit');
		expect(getCancelRoutes(frameData, state).routes).toEqual(['alpha', 'launcher', 'zeta']);
	});

	it('hit confirm unlocks deterministic cross and launcher routes', () => {
		const state = markFrameActionHitResolved({ ...startFrameAction(routed), elapsed: 0.19, phase: 'recovery' }, 'hit');
		expect(getCancelRoutes(routed, state)).toEqual({ allowed: true, routes: ['claw_cross', 'launcher'] });
	});

	it('whiff denies hit-confirm cancel routes', () => {
		const state = markFrameActionHitResolved({ ...startFrameAction(routed), elapsed: 0.19, phase: 'recovery' }, 'whiff');
		expect(getCancelRoutes(routed, state)).toEqual({ allowed: false, routes: [], reason: 'requires-hit-confirm' });
	});

	it('block allows defensive cancel only without hit-confirm gate', () => {
		const frameData = { ...routed, requiresHitConfirm: false };
		const state = markFrameActionHitResolved({ ...startFrameAction(frameData), elapsed: 0.19, phase: 'recovery' }, 'block');
		expect(getCancelRoutes(frameData, state)).toEqual({ allowed: true, routes: ['guard_cancel'] });
	});
});
