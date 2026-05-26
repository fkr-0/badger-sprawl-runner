export interface ConstraintBody {
	id: string;
	x: number;
	y: number;
	vx: number;
	vy: number;
	mass?: number;
}

export interface DistanceConstraint {
	id: string;
	a: string;
	b: string;
	restLength: number;
	stiffness: number;
	damping?: number;
}

export interface ConstraintStepResult<T extends ConstraintBody> {
	bodies: T[];
	corrections: Array<{ constraintId: string; dx: number; dy: number }>;
}

function distance(ax: number, ay: number, bx: number, by: number): number {
	return Math.hypot(bx - ax, by - ay);
}

export function solveDistanceConstraints<T extends ConstraintBody>(
	bodies: readonly T[],
	constraints: readonly DistanceConstraint[],
	dt: number,
	iterations = 1
): ConstraintStepResult<T> {
	if (!Number.isFinite(dt) || dt < 0) throw new Error(`Invalid constraint dt: ${dt}`);
	if (!Number.isInteger(iterations) || iterations <= 0) throw new Error(`Invalid constraint iterations: ${iterations}`);

	const next = bodies.map((body) => ({ ...body })) as T[];
	const corrections: ConstraintStepResult<T>['corrections'] = [];
	const byId = () => new Map(next.map((body) => [body.id, body]));
	const sorted = [...constraints].sort((a, b) => a.id.localeCompare(b.id));

	for (let iteration = 0; iteration < iterations; iteration += 1) {
		const map = byId();
		for (const constraint of sorted) {
			const a = map.get(constraint.a);
			const b = map.get(constraint.b);
			if (!a || !b) continue;
			const d = distance(a.x, a.y, b.x, b.y);
			if (d === 0) continue;
			const difference = (d - constraint.restLength) / d;
			const stiffness = Math.max(0, Math.min(1, constraint.stiffness));
			const invMassA = 1 / Math.max(0.0001, a.mass ?? 1);
			const invMassB = 1 / Math.max(0.0001, b.mass ?? 1);
			const totalInvMass = invMassA + invMassB;
			const dx = (b.x - a.x) * difference * stiffness;
			const dy = (b.y - a.y) * difference * stiffness;
			const ax = dx * (invMassA / totalInvMass);
			const ay = dy * (invMassA / totalInvMass);
			const bx = dx * (invMassB / totalInvMass);
			const by = dy * (invMassB / totalInvMass);

			a.x += ax;
			a.y += ay;
			b.x -= bx;
			b.y -= by;

			if (constraint.damping) {
				const damping = Math.max(0, Math.min(1, constraint.damping * dt));
				const relVx = b.vx - a.vx;
				const relVy = b.vy - a.vy;
				a.vx += relVx * damping * 0.5;
				a.vy += relVy * damping * 0.5;
				b.vx -= relVx * damping * 0.5;
				b.vy -= relVy * damping * 0.5;
			}

			corrections.push({ constraintId: constraint.id, dx: Number(dx.toFixed(6)), dy: Number(dy.toFixed(6)) });
		}
	}

	return { bodies: next, corrections };
}
